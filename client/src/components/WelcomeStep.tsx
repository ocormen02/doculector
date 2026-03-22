import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { MESSAGES } from '../constants/messages'

interface WelcomeStepProps {
  onContinue: () => void
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 560,
        px: { xs: 3, md: 4 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}
    >
      <Typography
        variant="h6"
        component="h1"
        align="center"
        sx={{
          fontWeight: 600,
          color: 'primary.main',
          lineHeight: 1.4,
          pb: 2,
        }}
      >
        {MESSAGES.WELCOME_TITLE}
      </Typography>
      <Typography
        variant="body1"
        align="left"
        sx={{
          width: '100%',
          whiteSpace: 'pre-line',
          lineHeight: 1.7,
          color: 'text.secondary',
          mb: 3,
        }}
      >
        {MESSAGES.WELCOME_BODY}
      </Typography>
      <Button
        variant="contained"
        onClick={onContinue}
        size="large"
        sx={{ minWidth: 200, mt: 2 }}
      >
        {MESSAGES.CONTINUAR}
      </Button>
    </Box>
  )
}
