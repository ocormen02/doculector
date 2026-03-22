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
  options?: { fullName?: string; timeoutMs?: number }
): Promise<DocumentAiValidationResult> {
  const base64 = await blobToBase64(blob)
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const body: { imageBase64: string; side: string; fullName?: string } = {
      imageBase64: base64,
      side,
    }
    if (side === 'front' && options?.fullName?.trim()) {
      body.fullName = options.fullName.trim()
    }

    const res = await fetch(`${apiUrl}/api/validate-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.error ?? 'Validation request failed')
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
