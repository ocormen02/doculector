# Recolector de Documentos de Identificación

Aplicación web móvil para la oficina legal de la Licenciada Helen Chacón Arce. Permite a los clientes capturar fotos de ambas caras de su documento de identidad, generar un PDF y enviarlo por correo electrónico de forma segura.

## Requisitos

- Node.js 18+
- Cuenta Gmail con 2-Step Verification habilitada
- App Password de Gmail (generar en [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords))

## Estructura del proyecto

```
recolector-documentos/
├── client/          # Frontend React (Vite)
├── api/             # Vercel serverless (PDF + email)
├── server/          # Express alternativo para desarrollo local
├── .env.example
└── vercel.json
```

## Configuración local

### 1. Instalar dependencias

```bash
cd client && npm install
cd ../api && npm install
cd ../server && npm install
```

### 2. Variables de entorno

Copie `.env.example` a `.env` en la raíz (para Vercel) o en `server/` (para Express):

```env
GMAIL_USER=su-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
DOCUMENT_RECIPIENT=su-email@gmail.com
OPENAI_API_KEY=sk-...           # Opcional: para validación AI de documentos
VITE_ENABLE_AI_DOCUMENT_VALIDATION=false  # "true" para activar validación AI
```

**Validación AI de documentos** (opcional): Configure `OPENAI_API_KEY` en el servidor y `VITE_ENABLE_AI_DOCUMENT_VALIDATION=true` en el cliente para habilitar validación de imágenes con OpenAI (cedula, dimex, especial).

### 3. Desarrollo local con Express

En una terminal:

```bash
cd server && npm start
```

En otra terminal:

```bash
cd client && npm run dev
```

La app estará en `http://localhost:5173` y el API en `http://localhost:3001`. El proxy de Vite redirige `/api` al servidor Express.

### 4. Desarrollo con Vercel CLI

```bash
npm i -g vercel
vercel dev
```

Desde la raíz del proyecto. Esto sirve el frontend y las funciones serverless.

## HTTPS y acceso a la cámara

`getUserMedia()` requiere un **contexto seguro** (HTTPS). Excepciones:

- `localhost` y `127.0.0.1` se consideran seguros para desarrollo.
- Para probar en un dispositivo móvil local:
  - **ngrok**: `ngrok http 5173` para exponer su servidor local con HTTPS.
  - O desplegar en Vercel y probar la URL de preview.

## Despliegue (Vercel)

1. Conecte el repositorio a Vercel.
2. Configure las variables de entorno `GMAIL_USER` y `GMAIL_APP_PASSWORD` en el dashboard.
3. El `vercel.json` ya define la compilación del cliente y las rutas de la API.

Alternativas: Netlify (con funciones), Railway o Render para el backend Express.

## Licencia

Uso interno - Oficina Legal Lic. Helen Chacón Arce.
