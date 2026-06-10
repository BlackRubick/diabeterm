import { patientService } from '../../../services/patientService'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const id = getRouterParam(event, 'id')!
  const patient = await patientService.findById(id)
  if (!patient) throw createError({ statusCode: 404, statusMessage: 'Paciente no encontrado' })

  if (user.role === 'PATIENT' && patient.userId !== user.sub) {
    throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })
  }

  return { success: true, data: patient }
})
