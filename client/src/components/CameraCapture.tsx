import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useCamera } from '../hooks/useCamera'
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
    let blob = await capturePhoto(videoRef.current, frameRef.current)
    if (!blob) {
      await new Promise((r) => setTimeout(r, 400))
      blob = await capturePhoto(videoRef.current, frameRef.current)
    }
    if (blob) {
      onCapture(blob)
    } else {
      onError(MESSAGES.CAPTURE_FAILED)
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
                maxWidth: 300,
                aspectRatio: '85.6 / 54',
                border: '4px dashed white',
                borderRadius: 1,
                bgcolor: 'rgba(0,0,0,0.25)',
                flexShrink: 0,
              }}
            />
          </Box>
        </Box>
        <Button variant="contained" onClick={handleCapture} size="large" fullWidth>
          {MESSAGES.CAPTURAR}
        </Button>
      </Box>
    </Box>
  )
}
