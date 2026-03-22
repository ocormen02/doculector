import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { MESSAGES } from '../constants/messages'

interface StatusMessageProps {
  type: 'loading' | 'success' | 'error'
  message: string
  onRetry?: () => void
  onBack?: () => void
}

export function StatusMessage({ type, message, onRetry, onBack }: StatusMessageProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1.5,
        textAlign: 'center',
        py: 3,
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: type === 'success' ? 'success.main' : type === 'error' ? 'error.main' : 'text.primary',
        }}
      >
        {message}
      </Typography>
      {type === 'loading' && <CircularProgress aria-hidden />}
      {type === 'error' && onRetry && (
        <Button variant="contained" onClick={onRetry}>
          {MESSAGES.REINTENTAR}
        </Button>
      )}
      {(type === 'success' || type === 'error') && onBack && (
        <Button variant="outlined" onClick={onBack}>
          {MESSAGES.VOLVER}
        </Button>
      )}
    </Box>
  )
}
