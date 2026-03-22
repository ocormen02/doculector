import { useState, useCallback, useMemo, useEffect } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { SplashStep } from './components/SplashStep'
import { WelcomeStep } from './components/WelcomeStep'
import { InformationStep, type PersonalData } from './components/InformationStep'
import logoImg from './assets/logo.png'
import { CameraCapture } from './components/CameraCapture'
import { ImagePreview } from './components/ImagePreview'
import { ReviewStep } from './components/ReviewStep'
import { StatusMessage } from './components/StatusMessage'
import { compressImageForUpload } from './utils/imageUtils'
import { MESSAGES } from './constants/messages'
import type { DocumentAiValidationResult } from './types/documentValidation'

type Step =
  | 'splash'
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
const ENABLE_AI = import.meta.env.VITE_ENABLE_AI_DOCUMENT_VALIDATION === 'true'

function AppLogo() {
  return (
    <Box
      component="img"
      src={logoImg}
      alt="Recolector de documentos"
      sx={{
        width: 'auto',
        height: { xs: 180, md: 200 },
        maxWidth: { xs: 320, md: 360 },
        objectFit: 'contain',
        mb: { xs: 1, md: 1.5 },
        flexShrink: 0,
      }}
    />
  )
}

function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 1.5, md: 2 },
        px: { xs: 1.5, md: 2 },
      }}
    >
      <AppLogo />
      <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {children}
      </Box>
    </Container>
  )
}

function App() {
  const [step, setStep] = useState<Step>('splash')
  const [personalData, setPersonalData] = useState<PersonalData | null>(null)
  const [frontBlob, setFrontBlob] = useState<Blob | null>(null)
  const [backBlob, setBackBlob] = useState<Blob | null>(null)
  const [frontAiResult, setFrontAiResult] = useState<DocumentAiValidationResult | null>(null)
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
    setFrontAiResult(null)
    setErrorMessage(null)
  }, [])

  if (step === 'sending') {
    return (
      <AppContainer>
        <StatusMessage type="loading" message={MESSAGES.SENDING} />
      </AppContainer>
    )
  }

  if (step === 'success') {
    return (
      <AppContainer>
        <StatusMessage
          type="success"
          message={MESSAGES.SUCCESS}
          onBack={handleBackToStart}
        />
      </AppContainer>
    )
  }

  if (step === 'error') {
    return (
      <AppContainer>
        <StatusMessage
          type="error"
          message={errorMessage ?? MESSAGES.SEND_FAILED}
          onRetry={handleRetrySend}
          onBack={handleBackToStart}
        />
      </AppContainer>
    )
  }

  if (step === 'splash') {
    return <SplashStep onComplete={() => setStep('welcome')} />
  }

  if (step === 'welcome') {
    return (
      <AppContainer>
        <WelcomeStep onContinue={() => setStep('name')} />
      </AppContainer>
    )
  }

  if (step === 'name') {
    return (
      <AppContainer>
        <InformationStep onContinue={(data) => {
          setPersonalData(data)
          setStep('capture_front')
        }} />
      </AppContainer>
    )
  }

  if (step === 'capture_front') {
    return (
      <AppContainer>
        <CameraCapture
          side="front"
          onCapture={(blob, aiResult) => {
            setFrontBlob(blob)
            setFrontAiResult(aiResult ?? null)
            setStep('preview_front')
          }}
          onError={(msg) => setErrorMessage(msg)}
          enableAi={ENABLE_AI}
          apiUrl={API_URL}
        />
      </AppContainer>
    )
  }

  if (step === 'preview_front' && frontPreviewUrl) {
    return (
      <AppContainer>
        <ImagePreview
          src={frontPreviewUrl}
          label={MESSAGES.FRONTAL}
          onUse={() => setStep('capture_back')}
          onRetake={() => {
            setFrontBlob(null)
            setFrontAiResult(null)
            setStep('capture_front')
          }}
        />
      </AppContainer>
    )
  }

  if (step === 'capture_back') {
    return (
      <AppContainer>
        <CameraCapture
          side="back"
          onCapture={(blob) => {
            setBackBlob(blob)
            setStep('preview_back')
          }}
          onError={(msg) => setErrorMessage(msg)}
          enableAi={ENABLE_AI}
          frontAiResult={frontAiResult}
          apiUrl={API_URL}
        />
      </AppContainer>
    )
  }

  if (step === 'preview_back' && backPreviewUrl) {
    return (
      <AppContainer>
        <ImagePreview
          src={backPreviewUrl}
          label={MESSAGES.TRASERA}
          onUse={() => setStep('review')}
          onRetake={() => {
            setBackBlob(null)
            setStep('capture_back')
          }}
        />
      </AppContainer>
    )
  }

  if (step === 'review') {
    return (
      <AppContainer>
        <ReviewStep
          frontPreview={frontPreviewUrl}
          backPreview={backPreviewUrl}
          onRetakeFront={() => setStep('capture_front')}
          onRetakeBack={() => setStep('capture_back')}
          onSend={handleSend}
          isSending={false}
          canSend={!!frontPreviewUrl && !!backPreviewUrl && !!personalData}
        />
      </AppContainer>
    )
  }

  return null
}

export default App
