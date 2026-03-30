import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { InformationStep, type PersonalData } from '../components/InformationStep'
import { StatusMessage } from '../components/StatusMessage'
import { AppContainer } from '../components/AppShell'
import { compressImageForUpload } from '../utils/imageUtils'
import { MESSAGES } from '../constants/messages'

const API_URL = import.meta.env.VITE_API_URL ?? ''

const emptyPersonalData = (): PersonalData => ({
  nombreCompleto: '',
  estadoCivil: '',
  ocupacion: '',
  provincia: '',
  canton: '',
  distrito: '',
  direccionExacta: '',
})

function hasAnyPersonalData(d: PersonalData): boolean {
  return Object.values(d).some((v) => String(v).trim() !== '')
}

type UiState = 'form' | 'sending' | 'success' | 'error'

export function ManualUploadPage() {
  const [uiState, setUiState] = useState<UiState>('form')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [optionalPersonalData, setOptionalPersonalData] = useState<PersonalData>(emptyPersonalData)
  const [informationKey, setInformationKey] = useState(0)
  const [frontBlob, setFrontBlob] = useState<Blob | null>(null)
  const [backBlob, setBackBlob] = useState<Blob | null>(null)

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

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

  const handleOptionalDataChange = useCallback((data: PersonalData) => {
    setOptionalPersonalData(data)
  }, [])

  const resetForm = useCallback(() => {
    setFrontBlob(null)
    setBackBlob(null)
    setOptionalPersonalData(emptyPersonalData())
    setInformationKey((k) => k + 1)
    setErrorMessage(null)
    if (frontInputRef.current) frontInputRef.current.value = ''
    if (backInputRef.current) backInputRef.current.value = ''
  }, [])

  const handleRetrySend = useCallback(() => {
    setUiState('form')
    setErrorMessage(null)
  }, [])

  const handleBackAfterSuccess = useCallback(() => {
    resetForm()
    setUiState('form')
  }, [resetForm])

  const handleSend = useCallback(async () => {
    if (!frontBlob || !backBlob) return

    setUiState('sending')
    setErrorMessage(null)

    try {
      const [frontBase64, backBase64] = await Promise.all([
        compressImageForUpload(frontBlob),
        compressImageForUpload(backBlob),
      ])

      const body: Record<string, unknown> = { frontBase64, backBase64 }
      if (hasAnyPersonalData(optionalPersonalData)) {
        body.personalData = optionalPersonalData
      }

      const res = await fetch(`${API_URL}/api/submit-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => ({ success: false }))

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Request failed')
      }

      setUiState('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : MESSAGES.SEND_FAILED)
      setUiState('error')
    }
  }, [frontBlob, backBlob, optionalPersonalData])

  const onFrontFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFrontBlob(file ?? null)
  }

  const onBackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setBackBlob(file ?? null)
  }

  const canSend = Boolean(frontBlob && backBlob)

  if (uiState === 'sending') {
    return (
      <AppContainer>
        <StatusMessage type="loading" message={MESSAGES.SENDING} />
      </AppContainer>
    )
  }

  if (uiState === 'success') {
    return (
      <AppContainer>
        <StatusMessage
          type="success"
          message={MESSAGES.SUCCESS}
          onBack={handleBackAfterSuccess}
        />
      </AppContainer>
    )
  }

  if (uiState === 'error') {
    return (
      <AppContainer>
        <StatusMessage
          type="error"
          message={errorMessage ?? MESSAGES.SEND_FAILED}
          onRetry={handleRetrySend}
          onBack={() => {
            setUiState('form')
            setErrorMessage(null)
          }}
        />
      </AppContainer>
    )
  }

  return (
    <AppContainer>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'stretch' }}>
        <Typography variant="h6" align="center" sx={{ fontWeight: 600 }}>
          {MESSAGES.MANUAL_UPLOAD_TITLE}
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center">
          {MESSAGES.MANUAL_UPLOAD_OPTIONAL_DATA_HINT}
        </Typography>

        <InformationStep
          key={informationKey}
          mode="optional"
          onDataChange={handleOptionalDataChange}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {MESSAGES.FRONTAL} / {MESSAGES.TRASERA}
          </Typography>
          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onFrontFile}
          />
          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onBackFile}
          />
          <Button variant="outlined" onClick={() => frontInputRef.current?.click()}>
            {MESSAGES.SELECT_IMAGE}: {MESSAGES.FRONTAL}
          </Button>
          <Button variant="outlined" onClick={() => backInputRef.current?.click()}>
            {MESSAGES.SELECT_IMAGE}: {MESSAGES.TRASERA}
          </Button>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            {frontPreviewUrl && (
              <Box
                component="img"
                src={frontPreviewUrl}
                alt={MESSAGES.FRONTAL}
                sx={{ width: 140, aspectRatio: '1.586', objectFit: 'contain', borderRadius: 1, bgcolor: 'grey.100' }}
              />
            )}
            {backPreviewUrl && (
              <Box
                component="img"
                src={backPreviewUrl}
                alt={MESSAGES.TRASERA}
                sx={{ width: 140, aspectRatio: '1.586', objectFit: 'contain', borderRadius: 1, bgcolor: 'grey.100' }}
              />
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center">
          {MESSAGES.PRIVACY_NOTE}
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleSend}
          disabled={!canSend}
          fullWidth
        >
          {MESSAGES.ENVIAR}
        </Button>
      </Box>
    </AppContainer>
  )
}
