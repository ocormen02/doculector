/**
 * Document validation provider abstraction.
 * Implementations analyze identity document images and return structured validation results.
 *
 * @typedef {Object} DocumentAiValidationResult
 * @property {boolean} documentDetected
 * @property {"cedula"|"dimex"|"especial"|"unknown"} documentType
 * @property {boolean} isBlurry
 * @property {boolean} lightingOk
 * @property {boolean} framingOk
 * @property {boolean} sideMatches
 * @property {number} confidence
 * @property {string[]} errors
 *
 * @typedef {Object} DocumentValidationProvider
 * @property {(imageBase64: string, side: "front"|"back") => Promise<DocumentAiValidationResult>} validate
 */

/** @type {DocumentAiValidationResult} */
export const FALLBACK_RESULT = Object.freeze({
  documentDetected: false,
  documentType: 'unknown',
  isBlurry: true,
  lightingOk: false,
  framingOk: false,
  sideMatches: false,
  confidence: 0,
  errors: ['AI validation unavailable'],
})
