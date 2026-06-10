import { writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomUUID } from 'node:crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const formData = await readMultipartFormData(event)
  if (!formData?.length) throw createError({ statusCode: 400, statusMessage: 'No se recibió archivo' })

  const file = formData[0]
  if (!file?.filename) throw createError({ statusCode: 400, statusMessage: 'Archivo inválido' })

  const mimeType = file.type || 'application/octet-stream'
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo de archivo no permitido. Use JPG, PNG o WEBP' })
  }

  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'El archivo excede el máximo de 10 MB' })
  }

  const ext = extname(file.filename) || '.jpg'
  const filename = `${randomUUID()}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')

  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), file.data)

  return {
    success: true,
    data: {
      url: `/uploads/${filename}`,
      filename,
    },
  }
})
