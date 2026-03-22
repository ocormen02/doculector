import { useEffect, useRef } from 'react'
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
      <div className="camera-error">
        <p>{ERROR_MAP[error] ?? MESSAGES.CAPTURE_FAILED}</p>
        <button type="button" className="btn btn-secondary" onClick={startCamera}>
          {MESSAGES.REINTENTAR}
        </button>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="camera-setup">
        <p>{instruction}</p>
        <p className="camera-frame-instruction">{MESSAGES.FRAME_INSTRUCTION}</p>
        <button type="button" className="btn btn-primary" onClick={startCamera}>
          {MESSAGES.ACTIVAR_CAMARA}
        </button>
      </div>
    )
  }

  return (
    <div className="camera-capture">
      <p className="camera-instruction">{instruction}</p>
      <p className="camera-frame-instruction">{MESSAGES.FRAME_INSTRUCTION}</p>
      <div className="camera-capture-inner">
        <div className="camera-frame-wrapper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />
          <div className="camera-overlay" aria-hidden="true">
            <div ref={frameRef} className="id-frame" />
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-capture" onClick={handleCapture}>
          {MESSAGES.CAPTURAR}
        </button>
      </div>
    </div>
  )
}
