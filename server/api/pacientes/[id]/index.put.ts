import { z } from 'zod'
import { patientService } from '../../../services/patientService'

const updatePatientSchema = z.object({
  nombre: z.string().min(2).optional(),
  fechaNacimiento: z.string().optional(),
  edad: z.number().min(0).max(120).optional(),
  sexo: z.enum(['MASCULINO', 'FEMENINO']).optional(),
  domicilio: z.string().min(5).optional(),
  telefono: z.string().min(7).optional(),
  estadoCivil: z.string().min(1).optional(),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, updatePatientSchema.parse)
  const patient = await patientService.update(id, body)
  return { success: true, data: patient }
})
