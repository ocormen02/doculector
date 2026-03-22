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

/** Error codes for the client to show specific messages */
export const VALIDATION_ERROR_CODES = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  SERVER: 'SERVER_ERROR',
} as const

export class DocumentValidationError extends Error {
  readonly code: keyof typeof VALIDATION_ERROR_CODES
  constructor(message: string, code: keyof typeof VALIDATION_ERROR_CODES) {
    super(message)
    this.name = 'DocumentValidationError'
    this.code = code
  }
}

export async function validateDocumentWithAi(
  blob: Blob,
  side: 'front' | 'back',
  apiUrl: string,
  options?: { timeoutMs?: number }
): Promise<DocumentAiValidationResult> {
  const base64 = await blobToBase64(blob)
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const body = { imageBase64: base64, side }
    const url = `${apiUrl || ''}/api/validate-document`.replace(/\/+/g, '/')
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    let data: unknown
    try {
      data = await res.json()
    } catch {
      throw new DocumentValidationError(
        res.ok ? 'Invalid response format' : 'Could not reach validation service',
        'SERVER'
      )
    }

    if (typeof data === 'object' && data !== null && 'errors' in data && Array.isArray((data as { errors: unknown }).errors)) {
      return data as DocumentAiValidationResult
    }

    if (!res.ok) {
      const err = data as { error?: string }
      throw new DocumentValidationError(err?.error ?? 'Validation request failed', 'SERVER')
    }

    return data as DocumentAiValidationResult
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DocumentValidationError) throw err
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new DocumentValidationError('Validation timeout', 'TIMEOUT')
      }
      if (err.message === 'Failed to fetch' || err.message.includes('NetworkError') || err.message.includes('Load failed')) {
        throw new DocumentValidationError('Could not reach validation service. Is the server running?', 'NETWORK')
      }
      throw new DocumentValidationError(err.message, 'SERVER')
    }
    throw new DocumentValidationError('Validation request failed', 'SERVER')
  }
}
