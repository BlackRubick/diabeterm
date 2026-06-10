import { z } from 'zod'
import { evaluationService } from '../services/evaluationService'

const prediccionSchema = z.object({
  evaluationId: z.string(),
  pieDerecho: z.string().optional(),
  pieIzquierdo: z.string().optional(),
  respuestas: z.record(z.unknown()),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const body = await readValidatedBody(event, prediccionSchema.parse)

  await Promise.all([
    body.pieDerecho
      ? evaluationService.addThermalImage({
          evaluationId: body.evaluationId,
          tipoPie: 'DERECHO',
          rutaImagen: body.pieDerecho,
        })
      : Promise.resolve(),
    body.pieIzquierdo
      ? evaluationService.addThermalImage({
          evaluationId: body.evaluationId,
          tipoPie: 'IZQUIERDO',
          rutaImagen: body.pieIzquierdo,
        })
      : Promise.resolve(),
  ])

  const prediction = evaluationService.runPrediction({
    pieDerecho: body.pieDerecho,
    pieIzquierdo: body.pieIzquierdo,
    respuestas: body.respuestas,
  })

  const updated = await evaluationService.update(body.evaluationId, {
    riesgo: prediction.riesgo,
    probabilidad: prediction.probabilidad,
    recomendaciones: JSON.stringify(prediction.recomendaciones),
    hallazgos: JSON.stringify(prediction.hallazgos),
  })

  return {
    success: true,
    data: {
      ...prediction,
      evaluation: updated,
    },
  }
})
