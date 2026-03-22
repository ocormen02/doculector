import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { useCamera } from '../hooks/useCamera'
import { runDocumentValidations } from '../utils/runDocumentValidations'
import { MESSAGES } from '../constants/messages'

interface CameraCaptureProps {
  side: 'front' | 'back'
  onCapture: (blob: Blob) => void
  onError: (message: string) => void
}

const ERROR_MAP: Record<string, string> = {
  'permission-denied': MESSAGES.CAMERA_PERMISSION_DENIED,
  'not-found': MESSAGES.CAMERA_NOT_FOUND,
  'not-supported': MESSAGES.CAMERA_NOT_SUPPORTED,
  unknown: MESSAGES.CAPTURE_FAILED,
}

export function CameraCapture({ side, onCapture, onError }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const stopCameraRef = useRef<() => void>(() => {})
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const {
    stream,
    error,
    isReady,
    startCamera,
    stopCamera,
    capturePhoto,
  } = useCamera()

  stopCameraRef.current = stopCamera

  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current
      video.srcObject = stream
      video.play().catch(() => {})
    }
  }, [stream])

  useEffect(() => {
    return () => {
      stopCameraRef.current()
    }
  }, [])

  useEffect(() => {
    if (error) {
      onError(ERROR_MAP[error] ?? MESSAGES.CAPTURE_FAILED)
    }
  }, [error, onError])

  const handleCapture = async () => {
    setValidationError(null)
    let blob = await capturePhoto(videoRef.current, frameRef.current)
    if (!blob) {
      await new Promise((r) => setTimeout(r, 400))
      blob = await capturePhoto(videoRef.current, frameRef.current)
    }
    if (!blob) {
      onError(MESSAGES.CAPTURE_FAILED)
      return
    }
    setIsValidating(true)
    try {
      const result = await runDocumentValidations(blob, side)
      if (result.valid) {
        onCapture(blob)
      } else {
        setValidationError(result.errors[0] ?? MESSAGES.CAPTURE_FAILED)
      }
    } catch {
      setValidationError(MESSAGES.CAPTURE_FAILED)
    } finally {
      setIsValidating(false)
    }
  }

  const instruction = side === 'front' ? MESSAGES.CAPTURE_FRENTE : MESSAGES.CAPTURE_TRASERA

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
        }}
      >
        <Typography color="text.secondary" align="center">
          {ERROR_MAP[error] ?? MESSAGES.CAPTURE_FAILED}
        </Typography>
        <Button variant="outlined" onClick={startCamera}>
          {MESSAGES.REINTENTAR}
        </Button>
      </Box>
    )
  }

  if (!isReady) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
        }}
      >
        <Typography color="text.secondary" align="center">
          {instruction}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ opacity: 0.9 }}>
          {MESSAGES.FRAME_INSTRUCTION}
        </Typography>
        <Button variant="contained" onClick={startCamera}>
          {MESSAGES.ACTIVAR_CAMARA}
        </Button>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        width: '100%',
      }}
    >
      <Typography color="text.secondary" align="center">
        {instruction}
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ opacity: 0.9 }}>
        {MESSAGES.FRAME_INSTRUCTION}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 1,
          width: '100%',
          maxWidth: { xs: 340, md: 420 },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4 / 3',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'black',
          }}
        >
          <Box
            component="video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <Box
              ref={frameRef}
              aria-hidden
              sx={{
                width: '90%',
                aspectRatio: '1.586',
                border: `4px dashed ${validationError ? 'error.main' : 'white'}`,
                borderRadius: 1,
                bgcolor: 'rgba(0,0,0,0.25)',
                flexShrink: 0,
              }}
            />
          </Box>
        </Box>
        {validationError && (
          <Alert severity="error" onClose={() => setValidationError(null)}>
            {validationError}
          </Alert>
        )}
        <Button
          variant="contained"
          onClick={handleCapture}
          size="large"
          fullWidth
          disabled={isValidating}
          startIcon={isValidating ? <CircularProgress size={20} color="inherit" /> : undefined}
        >
          {isValidating ? MESSAGES.VALIDATING : MESSAGES.CAPTURAR}
        </Button>
      </Box>
    </Box>
  )
}
