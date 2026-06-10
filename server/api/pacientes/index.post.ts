import { z } from 'zod'
import { patientService } from '../../services/patientService'

const createPatientSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
  nombre: z.string().min(2, 'Nombre requerido'),
  fechaNacimiento: z.string(),
  edad: z.number().min(0).max(120),
  sexo: z.enum(['MASCULINO', 'FEMENINO']),
  domicilio: z.string().min(5, 'Domicilio requerido'),
  telefono: z.string().min(7, 'Teléfono requerido'),
  estadoCivil: z.string().min(1, 'Estado civil requerido'),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const body = await readValidatedBody(event, createPatientSchema.parse)
  const patient = await patientService.create(body)
  return { success: true, data: patient }
})
