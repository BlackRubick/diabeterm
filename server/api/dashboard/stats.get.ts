import { evaluationRepository } from '../../repositories/evaluationRepository'
import { patientRepository } from '../../repositories/patientRepository'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const [totalPacientes, totalEvaluaciones, evaluacionesPendientes, ultimasEvaluaciones] = await Promise.all([
    patientRepository.count(),
    evaluationRepository.count(),
    evaluationRepository.countPending(),
    evaluationRepository.findRecent(5),
  ])

  return {
    success: true,
    data: { totalPacientes, totalEvaluaciones, evaluacionesPendientes, ultimasEvaluaciones },
  }
})
