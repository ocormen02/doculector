import type { DocumentAiValidationResult } from '../types/documentValidation'

const DEFAULT_TIMEOUT_MS = 20000

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const base64 = result.startsWith('data:') ? result.split(',')[1] : result
      resolve(base64 ?? '')
    }
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}

export async function validateDocumentWithAi(
  blob: Blob,
  side: 'front' | 'back',
  apiUrl: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<DocumentAiValidationResult> {
  const base64 = await blobToBase64(blob)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${apiUrl}/api/validate-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, side }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    let data: unknown
    try {
      data = await res.json()
    } catch {
      throw new Error(res.ok ? 'Invalid response format' : 'Validation request failed')
    }

    // Aceptar respuestas 500 con fallback (errors array) para mostrar mensaje adecuado
    if (typeof data === 'object' && data !== null && 'errors' in data && Array.isArray((data as { errors: unknown }).errors)) {
      return data as DocumentAiValidationResult
    }

    if (!res.ok) {
      throw new Error((data as { error?: string })?.error ?? 'Validation request failed')
    }

    return data as DocumentAiValidationResult
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error) {
      if (err.name === 'AbortError') throw new Error('Validation timeout')
      throw err
    }
    throw new Error('Validation request failed')
  }
}
