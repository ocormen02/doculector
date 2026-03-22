import * as faceapi from '@vladmandic/face-api'
import {
  imageDataFromBlob,
  detectBlur,
  detectBrightness,
  detectContrast,
  detectResolution,
  detectRectangle,
  detectAlignment,
  detectFramePosition,
} from './documentValidation'
import { MESSAGES } from '../constants/messages'

export type ValidationResult = { valid: boolean; errors: string[] }

const MODEL_BASE = '/models'
let faceModelsLoaded = false

async function ensureFaceModels(): Promise<boolean> {
  if (faceModelsLoaded) return true
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE)
    faceModelsLoaded = true
    return true
  } catch (err) {
    console.warn('Face detection models failed to load:', err)
    return false
  }
}

async function detectFace(blob: Blob): Promise<boolean> {
  const loaded = await ensureFaceModels()
  if (!loaded) return true

  const img = await faceapi.bufferToImage(blob)
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.4,
  })
  const task = faceapi.detectSingleFace(img, options)
  const detection = await task.run()
  return detection != null
}

export async function runDocumentValidations(
  blob: Blob,
  side: 'front' | 'back'
): Promise<ValidationResult> {
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

  const align = detectAlignment(imageData)
  if (!align.valid && align.error) errors.push(align.error)

  const frame = detectFramePosition(imageData)
  if (!frame.valid && frame.error) errors.push(frame.error)

  if (side === 'front') {
    const hasFace = await detectFace(blob)
    if (!hasFace) errors.push(MESSAGES.NO_FACE_DETECTED)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
