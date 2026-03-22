import { MESSAGES } from '../constants/messages'

interface WelcomeStepProps {
  onContinue: () => void
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <div className="step welcome-step">
      <h1 className="step-title">{MESSAGES.WELCOME_TITLE}</h1>
      <div className="step-content">
        <p className="welcome-body">{MESSAGES.WELCOME_BODY}</p>
      </div>
      <button type="button" className="btn btn-primary" onClick={onContinue}>
        {MESSAGES.CONTINUAR}
      </button>
    </div>
  )
}
