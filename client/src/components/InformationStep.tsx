import { useState, useMemo, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import { MESSAGES } from '../constants/messages'
import ubicacionData from '../data/ubicacion-costa-rica.json'

export interface PersonalData {
  nombreCompleto: string
  estadoCivil: string
  ocupacion: string
  provincia: string
  canton: string
  distrito: string
  direccionExacta: string
}

export type InformationStepProps =
  | {
      mode?: 'wizard'
      onContinue: (data: PersonalData) => void
    }
  | {
      mode: 'optional'
      onDataChange: (data: PersonalData) => void
    }

const ESTADOS_CIVILES = [
  MESSAGES.ESTADO_CIVIL_SOLTERO,
  MESSAGES.ESTADO_CIVIL_CASADO,
  MESSAGES.ESTADO_CIVIL_DIVORCIADO,
  MESSAGES.ESTADO_CIVIL_VIUDO,
] as const

type UbicacionData = Record<string, Record<string, string[]>>

export function InformationStep(props: InformationStepProps) {
  const isOptional = props.mode === 'optional'
  const onContinue = !isOptional ? props.onContinue : undefined
  const onDataChange = isOptional ? props.onDataChange : undefined

  const [nombreCompleto, setNombreCompleto] = useState('')
  const [estadoCivil, setEstadoCivil] = useState('')
  const [ocupacion, setOcupacion] = useState('')
  const [provincia, setProvincia] = useState('')
  const [canton, setCanton] = useState('')
  const [distrito, setDistrito] = useState('')
  const [direccionExacta, setDireccionExacta] = useState('')
  const [error, setError] = useState('')

  const provincias = useMemo(() => Object.keys(ubicacionData as UbicacionData), [])
  const cantones = useMemo(
    () => (provincia ? Object.keys((ubicacionData as UbicacionData)[provincia] ?? {}) : []),
    [provincia]
  )
  const distritos = useMemo(
    () =>
      provincia && canton
        ? ((ubicacionData as UbicacionData)[provincia]?.[canton] ?? [])
        : [],
    [provincia, canton]
  )

  useEffect(() => {
    if (!isOptional || !onDataChange) return
    onDataChange({
      nombreCompleto: nombreCompleto.trim(),
      estadoCivil,
      ocupacion: ocupacion.trim(),
      provincia,
      canton,
      distrito,
      direccionExacta: direccionExacta.trim(),
    })
  }, [
    isOptional,
    onDataChange,
    nombreCompleto,
    estadoCivil,
    ocupacion,
    provincia,
    canton,
    distrito,
    direccionExacta,
  ])

  const resetCascading = (level: 'canton' | 'distrito' | 'all') => {
    if (level === 'all') {
      setCanton('')
      setDistrito('')
    } else if (level === 'canton') {
      setCanton('')
      setDistrito('')
    } else {
      setDistrito('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isOptional) return
    const trimmedNombre = nombreCompleto.trim()
    const trimmedDireccion = direccionExacta.trim()

    if (!trimmedNombre) {
      setError(MESSAGES.NOMBRE_REQUERIDO)
      return
    }
    if (!estadoCivil || !ocupacion.trim() || !provincia || !canton || !distrito) {
      setError(MESSAGES.CAMPOS_REQUERIDOS)
      return
    }
    if (!trimmedDireccion) {
      setError(MESSAGES.CAMPOS_REQUERIDOS)
      return
    }
    setError('')
    onContinue?.({
      nombreCompleto: trimmedNombre,
      estadoCivil,
      ocupacion: ocupacion.trim(),
      provincia,
      canton,
      distrito,
      direccionExacta: trimmedDireccion,
    })
  }

  const clearError = () => setError('')
  const fieldRequired = !isOptional

  const formContent = (
    <>
      <Grid container spacing={1.5} sx={{ width: '100%' }}>
        <Grid size={12}>
          <TextField
            fullWidth
            label={MESSAGES.NOMBRE_CON_APELLIDOS}
            value={nombreCompleto}
            onChange={(e) => { setNombreCompleto(e.target.value); clearError() }}
            placeholder={MESSAGES.NOMBRE_CON_APELLIDOS_PLACEHOLDER}
            autoComplete="name"
            required={fieldRequired}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            select
            label={MESSAGES.ESTADO_CIVIL}
            value={estadoCivil}
            onChange={(e) => { setEstadoCivil(e.target.value); clearError() }}
            required={fieldRequired}
          >
            <MenuItem value="">{MESSAGES.ESTADO_CIVIL}</MenuItem>
            {ESTADOS_CIVILES.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label={MESSAGES.OCUPACION}
            value={ocupacion}
            onChange={(e) => { setOcupacion(e.target.value); clearError() }}
            placeholder={MESSAGES.OCUPACION_PLACEHOLDER}
            autoComplete="organization-title"
            required={fieldRequired}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            select
            label={MESSAGES.PROVINCIA}
            value={provincia}
            onChange={(e) => { setProvincia(e.target.value); resetCascading('all'); clearError() }}
            required={fieldRequired}
          >
            <MenuItem value="">{MESSAGES.PROVINCIA_PLACEHOLDER}</MenuItem>
            {provincias.map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            select
            label={MESSAGES.CANTON}
            value={canton}
            onChange={(e) => { setCanton(e.target.value); resetCascading('distrito'); clearError() }}
            disabled={!provincia}
            required={fieldRequired}
          >
            <MenuItem value="">{MESSAGES.CANTON_PLACEHOLDER}</MenuItem>
            {cantones.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            select
            label={MESSAGES.DISTRITO}
            value={distrito}
            onChange={(e) => { setDistrito(e.target.value); clearError() }}
            disabled={!canton}
            required={fieldRequired}
          >
            <MenuItem value="">{MESSAGES.DISTRITO_PLACEHOLDER}</MenuItem>
            {distritos.map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <TextField
          fullWidth
          label={MESSAGES.DIRECCION_EXACTA}
          value={direccionExacta}
          onChange={(e) => { setDireccionExacta(e.target.value); clearError() }}
          placeholder={MESSAGES.DIRECCION_PLACEHOLDER}
          multiline
          rows={4}
          required={fieldRequired}
          sx={{ width: '100%' }}
        />
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {!isOptional && (
        <Button type="submit" variant="contained" size="large" fullWidth>
          {MESSAGES.CONTINUAR}
        </Button>
      )}
    </>
  )

  return (
    <Box sx={{ width: '100%', maxHeight: { xs: '85svh', md: 'none' }, overflowY: 'auto' }}>
      <Typography variant="h6" align="center" gutterBottom>
        {MESSAGES.NOMBRE_APELLIDOS}
      </Typography>
      {isOptional ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
          {formContent}
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
          {formContent}
        </Box>
      )}
    </Box>
  )
}
