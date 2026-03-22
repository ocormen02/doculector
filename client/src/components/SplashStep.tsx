import { useEffect } from 'react'
import Box from '@mui/material/Box'
import logoImg from '../assets/logo.png'

interface SplashStepProps {
  onComplete: () => void
  duration?: number
}

export function SplashStep({ onComplete, duration = 2500 }: SplashStepProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, duration)
    return () => clearTimeout(timer)
  }, [onComplete, duration])

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        zIndex: 1300,
      }}
    >
      <Box
        component="img"
        src={logoImg}
        alt="Recolector de documentos"
        sx={{
          width: 'auto',
          height: { xs: 260, md: 320 },
          maxWidth: { xs: 400, md: 500 },
          objectFit: 'contain',
          '@keyframes splashLogo': {
            '0%': { opacity: 0, transform: 'scale(0.4)' },
            '20%': { opacity: 1, transform: 'scale(1.08)' },
            '40%': { opacity: 1, transform: 'scale(0.96)' },
            '60%': { opacity: 1, transform: 'scale(1.03)' },
            '80%': { opacity: 1, transform: 'scale(0.99)' },
            '100%': { opacity: 1, transform: 'scale(1)' },
          },
          animation: 'splashLogo 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      />
    </Box>
  )
}
