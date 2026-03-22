import { useState, useMemo } from 'react'
import { MESSAGES } from '../constants/messages'
import ubicacionData from '../data/ubicacion-costa-rica.json'

export interface PersonalData {
  nombreCompleto: string
  estadoCivil: string
  provincia: string
  canton: string
  distrito: string
  direccionExacta: string
}

interface InformationStepProps {
  onContinue: (data: PersonalData) => void
}

const ESTADOS_CIVILES = [
  MESSAGES.ESTADO_CIVIL_SOLTERO,
  MESSAGES.ESTADO_CIVIL_CASADO,
  MESSAGES.ESTADO_CIVIL_DIVORCIADO,
  MESSAGES.ESTADO_CIVIL_VIUDO,
] as const

type UbicacionData = Record<string, Record<string, string[]>>

export function InformationStep({ onContinue }: InformationStepProps) {
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [estadoCivil, setEstadoCivil] = useState('')
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
    const trimmedNombre = nombreCompleto.trim()
    const trimmedDireccion = direccionExacta.trim()

    if (!trimmedNombre) {
      setError(MESSAGES.NOMBRE_REQUERIDO)
      return
    }
    if (!estadoCivil || !provincia || !canton || !distrito) {
      setError(MESSAGES.CAMPOS_REQUERIDOS)
      return
    }
    if (!trimmedDireccion) {
      setError(MESSAGES.CAMPOS_REQUERIDOS)
      return
    }
    setError('')
    onContinue({
      nombreCompleto: trimmedNombre,
      estadoCivil,
      provincia,
      canton,
      distrito,
      direccionExacta: trimmedDireccion,
    })
  }

  const clearError = () => setError('')

  return (
    <div className="step information-step">
      <h2 className="step-title">{MESSAGES.NOMBRE_APELLIDOS}</h2>
      <form onSubmit={handleSubmit} className="name-form">
        <div className="form-field">
          <label htmlFor="nombreCompleto">{MESSAGES.NOMBRE_CON_APELLIDOS} <span className="required">*</span></label>
          <input
            id="nombreCompleto"
            type="text"
            value={nombreCompleto}
            onChange={(e) => {
              setNombreCompleto(e.target.value)
              clearError()
            }}
            placeholder={MESSAGES.NOMBRE_CON_APELLIDOS_PLACEHOLDER}
            className="name-input"
            autoComplete="name"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="estadoCivil">{MESSAGES.ESTADO_CIVIL} <span className="required">*</span></label>
          <select
            id="estadoCivil"
            value={estadoCivil}
            onChange={(e) => {
              setEstadoCivil(e.target.value)
              clearError()
            }}
            className="name-input select-input"
            required
          >
            <option value="">{MESSAGES.ESTADO_CIVIL}</option>
            {ESTADOS_CIVILES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="provincia">{MESSAGES.PROVINCIA} <span className="required">*</span></label>
          <select
            id="provincia"
            value={provincia}
            onChange={(e) => {
              setProvincia(e.target.value)
              resetCascading('all')
              clearError()
            }}
            className="name-input select-input"
            required
          >
            <option value="">{MESSAGES.PROVINCIA_PLACEHOLDER}</option>
            {provincias.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="canton">{MESSAGES.CANTON} <span className="required">*</span></label>
          <select
            id="canton"
            value={canton}
            onChange={(e) => {
              setCanton(e.target.value)
              resetCascading('distrito')
              clearError()
            }}
            className="name-input select-input"
            disabled={!provincia}
            required
          >
            <option value="">{MESSAGES.CANTON_PLACEHOLDER}</option>
            {cantones.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="distrito">{MESSAGES.DISTRITO} <span className="required">*</span></label>
          <select
            id="distrito"
            value={distrito}
            onChange={(e) => {
              setDistrito(e.target.value)
              clearError()
            }}
            className="name-input select-input"
            disabled={!canton}
            required
          >
            <option value="">{MESSAGES.DISTRITO_PLACEHOLDER}</option>
            {distritos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="direccionExacta">{MESSAGES.DIRECCION_EXACTA} <span className="required">*</span></label>
          <textarea
            id="direccionExacta"
            value={direccionExacta}
            onChange={(e) => {
              setDireccionExacta(e.target.value)
              clearError()
            }}
            placeholder={MESSAGES.DIRECCION_PLACEHOLDER}
            className="name-input textarea-input"
            rows={4}
            required
          />
        </div>
        {error && <p className="name-error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          {MESSAGES.CONTINUAR}
        </button>
      </form>
    </div>
  )
}
