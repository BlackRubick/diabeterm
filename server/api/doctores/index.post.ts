import { z } from 'zod'
import { userRepository } from '../../repositories/userRepository'
import { hashPassword } from '../../utils/password'

const schema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const firstDoctor = await userRepository.findFirstDoctor()
  if (firstDoctor?.id !== user.sub) {
    throw createError({ statusCode: 403, statusMessage: 'Solo el doctor principal puede registrar nuevos doctores' })
  }

  const body = await readValidatedBody(event, schema.parse)

  const existing = await userRepository.findByEmail(body.email)
  if (existing) throw createError({ statusCode: 409, statusMessage: 'Este correo ya está registrado' })

  const hashed = await hashPassword(body.password)
  const newDoctor = await userRepository.create({
    email: body.email,
    password: hashed,
    role: 'DOCTOR',
    nombre: body.nombre,
  })

  return {
    success: true,
    data: { id: newDoctor.id, nombre: newDoctor.nombre, email: newDoctor.email },
  }
})
