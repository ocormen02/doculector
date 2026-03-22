import { MESSAGES } from '../constants/messages'

interface ReviewStepProps {
  frontPreview: string | null
  backPreview: string | null
  onRetakeFront: () => void
  onRetakeBack: () => void
  onSend: () => void
  isSending: boolean
  canSend?: boolean
}

export function ReviewStep({
  frontPreview,
  backPreview,
  onRetakeFront,
  onRetakeBack,
  onSend,
  isSending,
  canSend: canSendProp,
}: ReviewStepProps) {
  const canSend = canSendProp ?? Boolean(frontPreview && backPreview)

  return (
    <div className="step review-step">
      <h2 className="step-title">{MESSAGES.FRONTAL} / {MESSAGES.TRASERA}</h2>
      <div className="review-previews">
        {frontPreview && (
          <div className="preview-card">
            <p className="preview-label">{MESSAGES.FRONTAL}</p>
            <img src={frontPreview} alt={MESSAGES.FRONTAL} className="preview-image" />
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRetakeFront}>
              {MESSAGES.TOMAR_DE_NUEVO}
            </button>
          </div>
        )}
        {backPreview && (
          <div className="preview-card">
            <p className="preview-label">{MESSAGES.TRASERA}</p>
            <img src={backPreview} alt={MESSAGES.TRASERA} className="preview-image" />
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRetakeBack}>
              {MESSAGES.TOMAR_DE_NUEVO}
            </button>
          </div>
        )}
      </div>
      <p className="privacy-note">{MESSAGES.PRIVACY_NOTE}</p>
      <button
        type="button"
        className="btn btn-primary btn-send"
        onClick={onSend}
        disabled={!canSend || isSending}
      >
        {MESSAGES.ENVIAR}
      </button>
    </div>
  )
}
