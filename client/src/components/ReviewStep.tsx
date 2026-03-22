import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import { MESSAGES } from '../constants/messages'

interface ReviewStepProps {
  frontPreview: string | null
  backPreview: string | null
  onRetakeFront: () => void
  onRetakeBack: () => void
  onSend: () => void
  isSending: boolean
  canSend?: boolean
}

export function ReviewStep({
  frontPreview,
  backPreview,
  onRetakeFront,
  onRetakeBack,
  onSend,
  isSending,
  canSend: canSendProp,
}: ReviewStepProps) {
  const canSend = canSendProp ?? Boolean(frontPreview && backPreview)

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="h6" align="center" gutterBottom>
        {MESSAGES.FRONTAL} / {MESSAGES.TRASERA}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
          justifyContent: 'center',
        }}
      >
        {frontPreview && (
          <Card sx={{ flex: 1, maxWidth: { md: 280 } }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {MESSAGES.FRONTAL}
              </Typography>
              <Box
                component="img"
                src={frontPreview}
                alt={MESSAGES.FRONTAL}
                sx={{
                  width: '100%',
                  aspectRatio: 1.586,
                  objectFit: 'contain',
                  borderRadius: 1,
                  bgcolor: 'grey.100',
                }}
              />
              <Button variant="outlined" size="small" onClick={onRetakeFront}>
                {MESSAGES.TOMAR_DE_NUEVO}
              </Button>
            </CardContent>
          </Card>
        )}
        {backPreview && (
          <Card sx={{ flex: 1, maxWidth: { md: 280 } }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {MESSAGES.TRASERA}
              </Typography>
              <Box
                component="img"
                src={backPreview}
                alt={MESSAGES.TRASERA}
                sx={{
                  width: '100%',
                  aspectRatio: 1.586,
                  objectFit: 'contain',
                  borderRadius: 1,
                  bgcolor: 'grey.100',
                }}
              />
              <Button variant="outlined" size="small" onClick={onRetakeBack}>
                {MESSAGES.TOMAR_DE_NUEVO}
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" align="center">
        {MESSAGES.PRIVACY_NOTE}
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={onSend}
        disabled={!canSend || isSending}
        fullWidth
      >
        {MESSAGES.ENVIAR}
      </Button>
    </Box>
  )
}
