const MAX_WIDTH = 2400
const JPEG_QUALITY = 0.93

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Read failed'))
    reader.readAsDataURL(blob)
  })
}

export async function compressImageForUpload(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = async () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      if (width <= MAX_WIDTH) {
        try {
          resolve(await blobToDataUrl(blob))
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Read failed'))
        }
        return
      }

      height = (height * MAX_WIDTH) / width
      width = MAX_WIDTH

      const canvas = document.createElement('canvas')
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
          blobToDataUrl(compressedBlob).then(resolve).catch(reject)
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
