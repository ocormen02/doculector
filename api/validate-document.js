import { createOpenAiDocumentValidationProvider } from './lib/openAiDocumentValidationProvider.js'

const documentValidationProvider = createOpenAiDocumentValidationProvider()

const FALLBACK_RESPONSE = {
  documentDetected: false,
  documentType: 'unknown',
  isBlurry: true,
  lightingOk: false,
  framingOk: false,
  sideMatches: false,
  confidence: 0,
  errors: ['AI validation unavailable'],
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { imageBase64, side } = body || {}
    const imageSize = typeof imageBase64 === 'string' ? Math.round(imageBase64.length / 1024) : 0
    console.log(`[validate-document] Request: side="${side}", imageBase64=${imageSize}KB`)

    if (typeof imageBase64 !== 'string' || !['front', 'back'].includes(side)) {
      console.warn('[validate-document] Invalid request')
      return res.status(400).json({
        success: false,
        error: 'Invalid request: imageBase64 and side (front|back) required',
      })
    }

    const result = await documentValidationProvider.validate(imageBase64, side)
    console.log(`[validate-document] Success: documentType=${result.documentType}, valid=${result.documentDetected && !result.isBlurry && result.lightingOk && result.framingOk && result.sideMatches}`)
    return res.status(200).json(result)
  } catch (err) {
    console.error('validate-document error:', err)
    return res.status(500).json(FALLBACK_RESPONSE)
  }
}
