import { evaluationService } from '../../services/evaluationService'
import { patientService } from '../../services/patientService'
import { evaluationRepository } from '../../repositories/evaluationRepository'
import { patientRepository } from '../../repositories/patientRepository'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  if (user.role === 'DOCTOR') {
    const evaluations = await evaluationService.findAll()
    return { success: true, data: evaluations }
  }

  const patient = await patientService.findByUserId(user.sub)
  if (!patient) throw createError({ statusCode: 404, statusMessage: 'Paciente no encontrado' })

  const evaluations = await evaluationRepository.findByPatient(patient.id)
  return { success: true, data: evaluations }
})
