import { useState, useCallback, useMemo, useEffect } from 'react'
import { WelcomeStep } from './components/WelcomeStep'
import { InformationStep, type PersonalData } from './components/InformationStep'
import logoImg from './assets/logo.png'
import { CameraCapture } from './components/CameraCapture'
import { ImagePreview } from './components/ImagePreview'
import { ReviewStep } from './components/ReviewStep'
import { StatusMessage } from './components/StatusMessage'
import { compressImageForUpload } from './utils/imageUtils'
import './App.css'
import { MESSAGES } from './constants/messages'

type Step =
  | 'welcome'
  | 'name'
  | 'capture_front'
  | 'preview_front'
  | 'capture_back'
  | 'preview_back'
  | 'review'
  | 'sending'
  | 'success'
  | 'error'

const API_URL = import.meta.env.VITE_API_URL ?? ''

function AppLogo() {
  return <img src={logoImg} alt="Recolector de documentos" className="app-logo" />
}

function App() {
  const [step, setStep] = useState<Step>('welcome')
  const [personalData, setPersonalData] = useState<PersonalData | null>(null)
  const [frontBlob, setFrontBlob] = useState<Blob | null>(null)
  const [backBlob, setBackBlob] = useState<Blob | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const frontPreviewUrl = useMemo(
    () => (frontBlob ? URL.createObjectURL(frontBlob) : null),
    [frontBlob]
  )
  const backPreviewUrl = useMemo(
    () => (backBlob ? URL.createObjectURL(backBlob) : null),
    [backBlob]
  )

  useEffect(() => {
    const url = frontPreviewUrl
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [frontPreviewUrl])

  useEffect(() => {
    const url = backPreviewUrl
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [backPreviewUrl])

  const handleSend = useCallback(async () => {
    if (!frontBlob || !backBlob || !personalData) return

    setStep('sending')
    setErrorMessage(null)

    try {
      const [frontBase64, backBase64] = await Promise.all([
        compressImageForUpload(frontBlob),
        compressImageForUpload(backBlob),
      ])

      const res = await fetch(`${API_URL}/api/submit-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalData,
          frontBase64,
          backBase64,
        }),
      })

      const data = await res.json().catch(() => ({ success: false }))

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Request failed')
      }

      setStep('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : MESSAGES.SEND_FAILED)
      setStep('error')
    }
  }, [frontBlob, backBlob, personalData])

  const handleRetrySend = useCallback(() => {
    setStep('review')
    setErrorMessage(null)
  }, [])

  const handleBackToStart = useCallback(() => {
    setStep('welcome')
    setPersonalData(null)
    setFrontBlob(null)
    setBackBlob(null)
    setErrorMessage(null)
  }, [])

  if (step === 'sending') {
    return (
      <div className="app-container">
        <AppLogo />
        <StatusMessage type="loading" message={MESSAGES.SENDING} />
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="app-container">
        <AppLogo />
        <StatusMessage
          type="success"
          message={MESSAGES.SUCCESS}
          onBack={handleBackToStart}
        />
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="app-container">
        <AppLogo />
        <StatusMessage
          type="error"
          message={errorMessage ?? MESSAGES.SEND_FAILED}
          onRetry={handleRetrySend}
          onBack={handleBackToStart}
        />
      </div>
    )
  }

  if (step === 'welcome') {
    return (
      <div className="app-container">
        <AppLogo />
        <WelcomeStep onContinue={() => setStep('name')} />
      </div>
    )
  }

  if (step === 'name') {
    return (
      <div className="app-container">
        <AppLogo />
        <InformationStep onContinue={(data) => {
          setPersonalData(data)
          setStep('capture_front')
        }} />
      </div>
    )
  }

  if (step === 'capture_front') {
    return (
      <div className="app-container">
        <AppLogo />
        <CameraCapture
          side="front"
          onCapture={(blob) => {
            setFrontBlob(blob)
            setStep('preview_front')
          }}
          onError={(msg) => setErrorMessage(msg)}
        />
      </div>
    )
  }

  if (step === 'preview_front' && frontPreviewUrl) {
    return (
      <div className="app-container">
        <AppLogo />
        <ImagePreview
          src={frontPreviewUrl}
          label={MESSAGES.FRONTAL}
          onUse={() => setStep('capture_back')}
          onRetake={() => {
            setFrontBlob(null)
            setStep('capture_front')
          }}
        />
      </div>
    )
  }

  if (step === 'capture_back') {
    return (
      <div className="app-container">
        <AppLogo />
        <CameraCapture
          side="back"
          onCapture={(blob) => {
            setBackBlob(blob)
            setStep('preview_back')
          }}
          onError={(msg) => setErrorMessage(msg)}
        />
      </div>
    )
  }

  if (step === 'preview_back' && backPreviewUrl) {
    return (
      <div className="app-container">
        <AppLogo />
        <ImagePreview
          src={backPreviewUrl}
          label={MESSAGES.TRASERA}
          onUse={() => setStep('review')}
          onRetake={() => {
            setBackBlob(null)
            setStep('capture_back')
          }}
        />
      </div>
    )
  }

  if (step === 'review') {
    return (
      <div className="app-container">
        <AppLogo />
        <ReviewStep
          frontPreview={frontPreviewUrl}
          backPreview={backPreviewUrl}
          onRetakeFront={() => setStep('capture_front')}
          onRetakeBack={() => setStep('capture_back')}
          onSend={handleSend}
          isSending={false}
          canSend={!!frontPreviewUrl && !!backPreviewUrl && !!personalData}
        />
      </div>
    )
  }

  return null
}

export default App
