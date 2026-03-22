export type DocumentType = 'cedula' | 'dimex' | 'especial' | 'unknown'

export type DocumentAiValidationResult = {
  documentDetected: boolean
  documentType: DocumentType
  isBlurry: boolean
  lightingOk: boolean
  framingOk: boolean
  sideMatches: boolean
  confidence: number
  errors: string[]
}
