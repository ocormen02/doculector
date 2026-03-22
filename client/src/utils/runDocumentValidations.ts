import {
  imageDataFromBlob,
  detectBlur,
  detectBrightness,
  detectContrast,
  detectResolution,
  detectRectangle,
} from './documentValidation'
import { MESSAGES } from '../constants/messages'

export type ValidationResult = { valid: boolean; errors: string[] }

export async function runDocumentValidations(blob: Blob): Promise<ValidationResult> {
  const errors: string[] = []
  let width = 0
  let height = 0
  let imageData: ImageData | null = null

  try {
    const { imageData: id, width: w, height: h } = await imageDataFromBlob(blob)
    width = w
    height = h
    imageData = id
  } catch {
    errors.push(MESSAGES.CAPTURE_FAILED)
    return { valid: false, errors }
  }

  if (!imageData) {
    return { valid: false, errors: [MESSAGES.CAPTURE_FAILED] }
  }

  const res = detectResolution(width, height)
  if (!res.valid && res.error) errors.push(res.error)

  const blur = detectBlur(imageData)
  if (!blur.valid && blur.error) errors.push(blur.error)

  const brightness = detectBrightness(imageData)
  if (!brightness.valid && brightness.error) errors.push(brightness.error)

  const contrast = detectContrast(imageData)
  if (!contrast.valid && contrast.error) errors.push(contrast.error)

  const rect = detectRectangle(imageData)
  if (!rect.valid && rect.error) errors.push(rect.error)

  return {
    valid: errors.length === 0,
    errors,
  }
}
