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
  return `You are validating that an image shows a Costa Rica identity document. The user must capture the ${side} side.

ONLY ACCEPT these 3 document types (Costa Rica official IDs):
- cedula: Costa Rican national ID (cédula de identidad)
- dimex: Costa Rica foreign resident ID (Documento de Identidad para Migrantes)
- especial: Refugee, provisional, or foreigner permit (documento especial, refugiado, permiso de extranjero)

STRICTLY REJECT - use documentType: "unknown" and errors: ["wrong_document_type"]:
- NO passports (pasaportes) - from any country
- NO driver's licenses (licencias de conducir) - from any country
- NO other identification cards (foreign IDs, student IDs, work permits from other countries, etc.)
- ONLY cedula, dimex, especial from Costa Rica are valid

CRITICAL - SIDE VALIDATION (use correct error, NEVER default to "blurry"):
- For "front" side: The image MUST show the FRONT of the document with a VISIBLE FACE (photo of the person). If you see the back of the document (signature area, barcode, no face) → sideMatches: false, errors: ["wrong_side"]
- For "back" side: The image MUST show the BACK of the document (usually signature area, barcode, no face). If you see a face or the front layout → sideMatches: false, errors: ["wrong_side"]

Return ONLY valid JSON, no other text:

{
  "documentDetected": boolean,
  "documentType": "cedula" | "dimex" | "especial" | "unknown",
  "isBlurry": boolean,
  "lightingOk": boolean,
  "framingOk": boolean,
  "sideMatches": boolean,
  "confidence": number (0-1),
  "errors": string[]
}

Rules:
- documentDetected: Is there a document/card visible in the image?
- documentType: ONLY "cedula", "dimex", "especial" for valid Costa Rica IDs. ALWAYS use "unknown" for passports, driver's licenses, or any non-Costa Rica ID.
- isBlurry: Use TRUE only when the image is genuinely blurry. Do NOT use blurry when the problem is wrong side or wrong document type.
- lightingOk: Acceptable lighting (not too dark, not washed out)?
- framingOk: Document centered and inside the frame?
- sideMatches: Does the image show the expected ${side}? Front=face visible, Back=no face.
- errors: Use these exact codes. Priority order: "wrong_document_type" (if not CR doc), "wrong_side" (if wrong side), "no_document", "blurry", "poor_lighting", "bad_framing". Empty array if all pass.
- confidence: 0-1`
}

function buildValidationErrors(result, docType) {
  const errors = []
  if (docType === 'unknown' && result.documentDetected) errors.push('wrong_document_type')
  if (!result.sideMatches) errors.push('wrong_side')
  if (!result.documentDetected) errors.push('no_document')
  if (result.isBlurry) errors.push('blurry')
  if (!result.lightingOk) errors.push('poor_lighting')
  if (!result.framingOk) errors.push('bad_framing')
  return errors.length > 0 ? errors : result.errors || []
}

function parseResponse(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  const parsed = JSON.parse(cleaned)
  const docType = VALID_DOCUMENT_TYPES.includes(parsed.documentType) ? parsed.documentType : 'unknown'
  const normalized = {
    documentDetected: Boolean(parsed.documentDetected),
    documentType: docType,
    isBlurry: Boolean(parsed.isBlurry),
    lightingOk: Boolean(parsed.lightingOk),
    framingOk: Boolean(parsed.framingOk),
    sideMatches: Boolean(parsed.sideMatches),
    confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
    errors: [],
  }
  normalized.errors = buildValidationErrors(parsed, docType)
  return normalized
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
