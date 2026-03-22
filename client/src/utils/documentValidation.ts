import { MESSAGES } from '../constants/messages'

export type ValidationResult = { valid: boolean; error?: string }

const BLUR_THRESHOLD = 45
const BRIGHTNESS_MIN = 40
const BRIGHTNESS_MAX = 220
const CONTRAST_MIN = 25
const RESOLUTION_MIN_WIDTH = 1280
const RESOLUTION_MIN_HEIGHT = 720
const RECTANGLE_VARIANCE_MIN = 150
const ALIGNMENT_MAX_DEGREES = 15
const FRAME_CENTER_RATIO_MIN = 0.6

/**
 * Converts a Blob to ImageData via canvas.
 */
export async function imageDataFromBlob(blob: Blob): Promise<{ imageData: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      resolve({ imageData, width: canvas.width, height: canvas.height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Laplacian variance blur detection. Low variance = blurry.
 */
export function detectBlur(imageData: ImageData): ValidationResult {
  const { data, width, height } = imageData
  const laplacianKernel = [0, 1, 0, 1, -4, 1, 0, 1, 0]
  let sum = 0
  let count = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let conv = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          const lum = luminance(data[idx], data[idx + 1], data[idx + 2])
          conv += lum * laplacianKernel[(ky + 1) * 3 + (kx + 1)]
        }
      }
      sum += conv * conv
      count++
    }
  }
  const variance = count > 0 ? sum / count : 0
  return { valid: variance >= BLUR_THRESHOLD, error: variance < BLUR_THRESHOLD ? MESSAGES.IMAGE_BLURRY : undefined }
}

/**
 * Average brightness check.
 */
export function detectBrightness(imageData: ImageData): ValidationResult {
  const { data } = imageData
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += luminance(data[i], data[i + 1], data[i + 2])
  }
  const mean = sum / (data.length / 4)
  const valid = mean >= BRIGHTNESS_MIN && mean <= BRIGHTNESS_MAX
  return { valid, error: !valid ? MESSAGES.LIGHTING_POOR : undefined }
}

/**
 * Contrast via standard deviation of luminance.
 */
export function detectContrast(imageData: ImageData): ValidationResult {
  const { data } = imageData
  const n = data.length / 4
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += luminance(data[i], data[i + 1], data[i + 2])
  }
  const mean = sum / n
  let sqSum = 0
  for (let i = 0; i < data.length; i += 4) {
    const lum = luminance(data[i], data[i + 1], data[i + 2])
    sqSum += (lum - mean) ** 2
  }
  const std = Math.sqrt(sqSum / n)
  return { valid: std >= CONTRAST_MIN, error: std < CONTRAST_MIN ? MESSAGES.LOW_CONTRAST : undefined }
}

/**
 * Minimum resolution check.
 */
export function detectResolution(width: number, height: number): ValidationResult {
  const valid = width >= RESOLUTION_MIN_WIDTH && height >= RESOLUTION_MIN_HEIGHT
  return { valid, error: !valid ? MESSAGES.LOW_RESOLUTION : undefined }
}

/**
 * Document presence heuristic: reject blank/uniform images via luminance variance.
 */
export function detectRectangle(imageData: ImageData): ValidationResult {
  const { data } = imageData
  const n = data.length / 4
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += luminance(data[i], data[i + 1], data[i + 2])
  }
  const mean = sum / n
  let sqSum = 0
  for (let i = 0; i < data.length; i += 4) {
    const lum = luminance(data[i], data[i + 1], data[i + 2])
    sqSum += (lum - mean) ** 2
  }
  const variance = sqSum / n
  return { valid: variance >= RECTANGLE_VARIANCE_MIN, error: variance < RECTANGLE_VARIANCE_MIN ? MESSAGES.NO_DOCUMENT_DETECTED : undefined }
}

/**
 * Alignment heuristic: edge orientation. Reject if dominant angle > 15° from horizontal.
 */
export function detectAlignment(imageData: ImageData): ValidationResult {
  const { data, width, height } = imageData
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]
  let sumGx = 0
  let sumGy = 0
  let count = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0
      let gy = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          const lum = luminance(data[idx], data[idx + 1], data[idx + 2])
          gx += lum * sobelX[(ky + 1) * 3 + (kx + 1)]
          gy += lum * sobelY[(ky + 1) * 3 + (kx + 1)]
        }
      }
      const mag = Math.sqrt(gx * gx + gy * gy)
      if (mag > 20) {
        sumGx += gx
        sumGy += gy
        count++
      }
    }
  }

  if (count < 10) {
    return { valid: true }
  }
  const angle = Math.atan2(sumGy, sumGx) * (180 / Math.PI)
  const fromHorizontal = Math.min(Math.abs(angle), Math.abs(angle - 90), Math.abs(angle + 90), Math.abs(angle - 180))
  const valid = fromHorizontal <= ALIGNMENT_MAX_DEGREES || fromHorizontal >= 90 - ALIGNMENT_MAX_DEGREES
  return { valid, error: !valid ? MESSAGES.DOCUMENT_ALIGNMENT : undefined }
}

/**
 * Frame position heuristic: center should have sufficient content (variance) vs corners.
 */
export function detectFramePosition(imageData: ImageData): ValidationResult {
  const { data, width, height } = imageData
  const cx = Math.floor(width / 2)
  const cy = Math.floor(height / 2)
  const r = Math.min(width, height) * 0.35
  const centerLums: number[] = []
  const cornerLums: number[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const lum = luminance(data[idx], data[idx + 1], data[idx + 2])
      const inCenter = (x - cx) ** 2 + (y - cy) ** 2 <= r * r
      const inCorner = (x < width * 0.15 || x > width * 0.85 || y < height * 0.15 || y > height * 0.85) && !inCenter
      if (inCenter) centerLums.push(lum)
      if (inCorner) cornerLums.push(lum)
    }
  }

  const variance = (arr: number[]) => {
    if (arr.length < 2) return 0
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length
  }
  const centerVar = variance(centerLums)
  const cornerVar = variance(cornerLums)
  const valid = centerVar >= cornerVar * FRAME_CENTER_RATIO_MIN || centerVar >= RECTANGLE_VARIANCE_MIN * 0.3
  return { valid, error: !valid ? MESSAGES.DOCUMENT_FRAME_POSITION : undefined }
}
