import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import ButtonGroup from '@mui/material/ButtonGroup'
import { MESSAGES } from '../constants/messages'

interface ImagePreviewProps {
  src: string
  label: string
  onUse: () => void
  onRetake: () => void
}

export function ImagePreview({ src, label, onUse, onRetake }: ImagePreviewProps) {
  return (
    <Card sx={{ width: '100%', maxWidth: 340 }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {label}
        </Typography>
        <Box
          component="img"
          src={src}
          alt={label}
          sx={{
            width: '100%',
            aspectRatio: 1.586,
            objectFit: 'contain',
            borderRadius: 1,
            bgcolor: 'grey.100',
          }}
        />
        <ButtonGroup variant="outlined" fullWidth>
          <Button onClick={onRetake}>{MESSAGES.TOMAR_DE_NUEVO}</Button>
          <Button variant="contained" onClick={onUse}>{MESSAGES.USAR_FOTO}</Button>
        </ButtonGroup>
      </CardContent>
    </Card>
  )
}
