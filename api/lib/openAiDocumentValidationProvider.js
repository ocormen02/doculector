import OpenAI from 'openai'

const FALLBACK_RESULT = Object.freeze({
  documentDetected: false,
  documentType: 'unknown',
  isBlurry: true,
  lightingOk: false,
  framingOk: false,
  sideMatches: false,
  confidence: 0,
  errors: ['AI validation unavailable'],
})

const VALIDATION_TIMEOUT_MS = 15000
const VALID_DOCUMENT_TYPES = ['cedula', 'dimex', 'especial', 'unknown']

function buildPrompt(side) {
  return `You are analyzing an image of a Costa Rica identity document for quality validation. This is the ${side} side.

Analyze the image and return ONLY a valid JSON object with no other text. Do NOT claim legal authenticity validation.

Required JSON structure (use these exact keys):
{
  "documentDetected": boolean,
  "documentType": "cedula" | "dimex" | "especial" | "unknown",
  "isBlurry": boolean,
  "lightingOk": boolean,
  "framingOk": boolean,
  "sideMatches": boolean,
  "confidence": number (0-1),
  "errors": string[] (empty array if valid)
}

Rules:
- documentDetected: Is there a document in the image?
- documentType: Costa Rica documents only. cedula=national ID, dimex=foreign resident ID, especial=refugee or provisional ID, unknown if unidentifiable.
- isBlurry: Is the image blurry?
- lightingOk: Is the lighting acceptable (not too dark, not washed out)?
- framingOk: Is the document centered and inside the frame?
- sideMatches: For "front" expect a face and primary identity layout. For "back" expect no face and different layout. Set true only if the image matches the expected side.
- errors: Array of human-readable error codes in English (e.g. "no_document", "blurry", "poor_lighting", "bad_framing", "wrong_side"). Empty if all checks pass.
- confidence: Your overall confidence 0-1.`
}

function buildValidationErrors(result) {
  const errors = [...(result.errors || [])]
  if (!result.documentDetected) errors.push('no_document')
  if (result.isBlurry) errors.push('blurry')
  if (!result.lightingOk) errors.push('poor_lighting')
  if (!result.framingOk) errors.push('bad_framing')
  if (!result.sideMatches) errors.push('wrong_side')
  return errors.length > 0 ? errors : result.errors || []
}

function parseResponse(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  const parsed = JSON.parse(cleaned)
  const docType = VALID_DOCUMENT_TYPES.includes(parsed.documentType) ? parsed.documentType : 'unknown'
  return {
    documentDetected: Boolean(parsed.documentDetected),
    documentType: docType,
    isBlurry: Boolean(parsed.isBlurry),
    lightingOk: Boolean(parsed.lightingOk),
    framingOk: Boolean(parsed.framingOk),
    sideMatches: Boolean(parsed.sideMatches),
    confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
    errors: buildValidationErrors(parsed),
  }
}

export function createOpenAiDocumentValidationProvider() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set; AI document validation will use fallback.')
    return null
  }
  const client = new OpenAI({ apiKey })

  return {
    async validate(imageBase64, side) {
      if (!client || (side !== 'front' && side !== 'back')) {
        if (!client) console.warn('[AI Validation] Skipped: OpenAI client not configured (OPENAI_API_KEY missing)')
        else console.warn('[AI Validation] Skipped: invalid side=', side)
        return { ...FALLBACK_RESULT }
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI validation timeout')), VALIDATION_TIMEOUT_MS)
      )

      const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
      const imageSizeKb = Math.round((imageBase64?.length || 0) / 1024)
      console.log(`[AI Validation] Starting validation for side="${side}", image base64 size=${imageSizeKb}KB`)

      try {
        const startTime = Date.now()
        const completionPromise = client.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: buildPrompt(side),
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        })

        const response = await Promise.race([completionPromise, timeoutPromise])
        const elapsedMs = Date.now() - startTime
        const content = response.choices?.[0]?.message?.content
        console.log(`[AI Validation] OpenAI responded in ${elapsedMs}ms for side="${side}"`)
        if (!content) {
          console.warn('[AI Validation] Empty content from OpenAI, using fallback')
          return { ...FALLBACK_RESULT }
        }
        console.log('[AI Validation] Raw model response:', content)
        const parsed = parseResponse(content)
        console.log('[AI Validation] Parsed result:', JSON.stringify(parsed, null, 2))
        return parsed
      } catch (err) {
        console.error('[AI Validation] OpenAI error:', err.message)
        if (err.response) console.error('[AI Validation] API response:', err.response?.data || err.response)
        return { ...FALLBACK_RESULT }
      }
    },
  }
}
