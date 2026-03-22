import { jsPDF } from 'jspdf'
import nodemailer from 'nodemailer'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB per image (base64 is ~1.33x larger)
const ALLOWED_DATA_URL_PREFIX = 'data:image/'

function parseBase64Image(data) {
  if (typeof data !== 'string' || !data) return null
  const base64 = data.startsWith(ALLOWED_DATA_URL_PREFIX)
    ? data.split(',')[1]
    : data
  if (!base64) return null
  try {
    const buffer = Buffer.from(base64, 'base64')
    if (buffer.length > MAX_IMAGE_SIZE) return null
    return buffer
  } catch {
    return null
  }
}

function createPdf(frontBuffer, backBuffer, fullName = '') {
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const gap = 15
  const labelHeight = 6
  const nameHeight = 12
  const centerX = pageWidth / 2

  if (fullName && fullName.trim()) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(fullName.trim(), centerX, margin + nameHeight / 2, { align: 'center' })
    doc.setFont('helvetica', 'normal')
  }

  const contentTop = margin + (fullName.trim() ? nameHeight + 8 : 0)
  const aspectRatio = 85.6 / 54
  const maxImgWidth = pageWidth - 2 * margin
  const imgWidth = Math.min(maxImgWidth, 130)
  const imgHeight = imgWidth / aspectRatio
  const blockHeight = labelHeight + imgHeight
  const totalHeight = 2 * blockHeight + gap
  const topOffset = contentTop + (pageHeight - contentTop - margin - totalHeight) / 2
  const imgX = centerX - imgWidth / 2

  const addImageBlock = (buffer, label, y) => {
    doc.setFontSize(10)
    doc.text(label, centerX, y + labelHeight / 2, { align: 'center' })
    const imgData = `data:image/jpeg;base64,${buffer.toString('base64')}`
    doc.addImage(imgData, 'JPEG', imgX, y + labelHeight, imgWidth, imgHeight, undefined, 'FAST')
  }

  addImageBlock(frontBuffer, 'Frontal', topOffset)
  addImageBlock(backBuffer, 'Trasera', topOffset + blockHeight + gap)

  return doc.output('arraybuffer')
}

function formatSubject(fullName = '') {
  const date = new Date().toISOString().split('T')[0]
  const namePart = (fullName || '').trim().replace(/[,;]/g, ' ') || 'Documento'
  return `Documento-${namePart}-${date}`
}

async function sendEmail(pdfBuffer, fullName = '') {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  const recipient = process.env.DOCUMENT_RECIPIENT || user

  if (!user || !pass) {
    throw new Error('Email configuration missing')
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })

  await transporter.verify()
  await transporter.sendMail({
    from: user,
    to: recipient,
    subject: formatSubject(fullName),
    text: 'Documento de identificación adjunto.',
    attachments: [
      {
        filename: `documento-identidad-${Date.now()}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: 'application/pdf',
      },
    ],
  })
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { fullName, frontBase64, backBase64 } = body || {}

    const frontBuffer = parseBase64Image(frontBase64)
    const backBuffer = parseBase64Image(backBase64)

    if (!frontBuffer || !backBuffer) {
      return res.status(400).json({
        success: false,
        error: 'Faltan imágenes o formato inválido',
      })
    }

    const pdfBuffer = createPdf(frontBuffer, backBuffer, fullName)
    await sendEmail(pdfBuffer, fullName)

    return res.status(200).json({ success: true })
  } catch (err) {
    const message = err.message || 'Error al procesar el documento'
    return res.status(500).json({ success: false, error: message })
  }
}
