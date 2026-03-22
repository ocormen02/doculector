const MAX_WIDTH = 1200
const JPEG_QUALITY = 0.85

export async function compressImageForUpload(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width
        width = MAX_WIDTH
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (compressedBlob) => {
          if (!compressedBlob) {
            reject(new Error('Compression failed'))
            return
          }
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Read failed'))
          reader.readAsDataURL(compressedBlob)
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }

    img.src = url
  })
}
