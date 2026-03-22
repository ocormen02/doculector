import { MESSAGES } from '../constants/messages'

interface ImagePreviewProps {
  src: string
  label: string
  onUse: () => void
  onRetake: () => void
}

export function ImagePreview({ src, label, onUse, onRetake }: ImagePreviewProps) {
  return (
    <div className="image-preview-card">
      <p className="preview-label">{label}</p>
      <img src={src} alt={label} className="preview-image" />
      <div className="preview-actions">
        <button type="button" className="btn btn-secondary" onClick={onRetake}>
          {MESSAGES.TOMAR_DE_NUEVO}
        </button>
        <button type="button" className="btn btn-primary" onClick={onUse}>
          {MESSAGES.USAR_FOTO}
        </button>
      </div>
    </div>
  )
}
