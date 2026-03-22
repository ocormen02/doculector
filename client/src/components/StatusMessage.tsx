import { MESSAGES } from '../constants/messages'

interface StatusMessageProps {
  type: 'loading' | 'success' | 'error'
  message: string
  onRetry?: () => void
  onBack?: () => void
}

export function StatusMessage({ type, message, onRetry, onBack }: StatusMessageProps) {
  return (
    <div className={`status-message status-${type}`}>
      <p className="status-text">{message}</p>
      {type === 'loading' && <div className="spinner" aria-hidden="true" />}
      {type === 'error' && onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          {MESSAGES.REINTENTAR}
        </button>
      )}
      {(type === 'success' || type === 'error') && onBack && (
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          {MESSAGES.VOLVER}
        </button>
      )}
    </div>
  )
}
