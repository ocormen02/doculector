import { useState } from 'react'
import { MESSAGES } from '../constants/messages'

interface NameStepProps {
  onContinue: (fullName: string) => void
}

export function NameStep({ onContinue }: NameStepProps) {
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = fullName.trim()
    if (!trimmed) {
      setError(MESSAGES.NOMBRE_REQUERIDO)
      return
    }
    setError('')
    onContinue(trimmed)
  }

  return (
    <div className="step name-step">
      <h2 className="step-title">{MESSAGES.NOMBRE_APELLIDOS}</h2>
      <form onSubmit={handleSubmit} className="name-form">
        <input
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value)
            setError('')
          }}
          placeholder={MESSAGES.NOMBRE_PLACEHOLDER}
          className="name-input"
          autoComplete="name"
        />
        {error && <p className="name-error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          {MESSAGES.CONTINUAR}
        </button>
      </form>
    </div>
  )
}
