import { patientService } from '../../services/patientService'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const patients = await patientService.findAll()
  return { success: true, data: patients }
})
