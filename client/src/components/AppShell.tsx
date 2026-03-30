import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import logoImg from '../assets/logo.png'

export function AppLogo() {
  return (
    <Box
      component="img"
      src={logoImg}
      alt="Recolector de documentos"
      sx={{
        width: 'auto',
        height: { xs: 180, md: 200 },
        maxWidth: { xs: 320, md: 360 },
        objectFit: 'contain',
        mb: { xs: 1, md: 1.5 },
        flexShrink: 0,
      }}
    />
  )
}

export function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 1.5, md: 2 },
        px: { xs: 1.5, md: 2 },
      }}
    >
      <AppLogo />
      <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {children}
      </Box>
    </Container>
  )
}
