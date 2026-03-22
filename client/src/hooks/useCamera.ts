import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraError = 'not-supported' | 'permission-denied' | 'not-found' | 'unknown'

export interface UseCameraReturn {
  stream: MediaStream | null
  error: CameraError | null
  isReady: boolean
  startCamera: () => Promise<void>
  stopCamera: () => void
  capturePhoto: (video: HTMLVideoElement | null, frame?: HTMLElement | null) => Promise<Blob | null>
}

function getErrorFromName(name: string): CameraError {
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'permission-denied'
  }
  if (name === 'NotFoundError') {
    return 'not-found'
  }
  if (name === 'NotSupportedError') {
    return 'not-supported'
  }
  return 'unknown'
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<CameraError | null>(null)
  const [isReady, setIsReady] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('not-supported')
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      if (isMountedRef.current) {
        setStream(mediaStream)
        setIsReady(true)
      } else {
        mediaStream.getTracks().forEach((track) => track.stop())
      }
    } catch (err) {
      if (isMountedRef.current) {
        const cameraError = err instanceof Error ? getErrorFromName(err.name) : 'unknown'
        setError(cameraError)
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsReady(false)
  }, [stream])

  const capturePhoto = useCallback(
    async (video: HTMLVideoElement | null, frame?: HTMLElement | null): Promise<Blob | null> => {
      if (!video || !stream) return null
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh || video.readyState < 1) return null

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      if (frame) {
        const videoRect = video.getBoundingClientRect()
        const frameRect = frame.getBoundingClientRect()
        const scale = Math.max(videoRect.width / vw, videoRect.height / vh)
        const srcW = videoRect.width / scale
        const srcH = videoRect.height / scale
        const srcX = (vw - srcW) / 2
        const srcY = (vh - srcH) / 2
        const fx = frameRect.left - videoRect.left
        const fy = frameRect.top - videoRect.top
        const srcFrameX = srcX + (fx * srcW) / videoRect.width
        const srcFrameY = srcY + (fy * srcH) / videoRect.height
        const srcFrameW = (frameRect.width * srcW) / videoRect.width
        const srcFrameH = (frameRect.height * srcH) / videoRect.height
        canvas.width = Math.round(srcFrameW)
        canvas.height = Math.round(srcFrameH)
        ctx.drawImage(video, srcFrameX, srcFrameY, srcFrameW, srcFrameH, 0, 0, canvas.width, canvas.height)
      } else {
        canvas.width = vw
        canvas.height = vh
        ctx.drawImage(video, 0, 0, vw, vh)
      }

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob ?? null), 'image/jpeg', 0.95)
      })
    },
    [stream]
  )

  return {
    stream,
    error,
    isReady,
    startCamera,
    stopCamera,
    capturePhoto,
  }
}
