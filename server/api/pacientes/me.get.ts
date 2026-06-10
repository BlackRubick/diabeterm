import { patientService } from '../../services/patientService'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'PATIENT') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const patient = await patientService.findByUserId(user.sub)
  if (!patient) throw createError({ statusCode: 404, statusMessage: 'Paciente no encontrado' })

  return { success: true, data: patient }
})
