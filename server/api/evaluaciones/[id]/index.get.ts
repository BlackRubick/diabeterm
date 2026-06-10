import { evaluationService } from '../../../services/evaluationService'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const id = getRouterParam(event, 'id')!
  const evaluation = await evaluationService.findById(id)
  if (!evaluation) throw createError({ statusCode: 404, statusMessage: 'Evaluación no encontrada' })

  return { success: true, data: evaluation }
})
