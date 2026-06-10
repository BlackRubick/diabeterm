import { z } from 'zod'
import { evaluationService } from '../../services/evaluationService'

const createEvaluationSchema = z.object({
  patientId: z.string(),
  fecha: z.string().optional(),
  observaciones: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const body = await readValidatedBody(event, createEvaluationSchema.parse)
  const evaluation = await evaluationService.create({ ...body, doctorId: user.sub })
  return { success: true, data: evaluation }
})
