import { z } from 'zod'
import { join } from 'node:path'
import { evaluationService } from '../services/evaluationService'

const PYTHON_SERVICE_URL = 'http://localhost:8000'

const prediccionSchema = z.object({
  evaluationId: z.string(),
  pieDerecho: z.string().optional(),
  pieIzquierdo: z.string().optional(),
  respuestas: z.record(z.unknown()),
})

function urlToAbsolutePath(url: string): string {
  // url viene como "/uploads/filename.jpg"
  return join(process.cwd(), 'public', url)
}

async function callPythonService(payload: {
  pieIzquierdo?: string
  pieDerecho?: string
  respuestas: Record<string, unknown>
}) {
  const response = await fetch(`${PYTHON_SERVICE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Python service error ${response.status}: ${err}`)
  }

  const json = await response.json() as { success: boolean; data: {
    riesgo: string
    probabilidad: number
    hallazgos: string[]
    recomendaciones: string[]
    thermalData: Record<string, unknown>
  } }
  return json.data
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const body = await readValidatedBody(event, prediccionSchema.parse)

  // Guardar rutas de imágenes en la evaluación
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

  let prediction: {
    riesgo: string
    probabilidad: number
    hallazgos: string[]
    recomendaciones: string[]
  }

  const hasImages = !!(body.pieDerecho || body.pieIzquierdo)

  if (hasImages) {
    // Intentar análisis térmico real con el servicio Python
    try {
      const pythonResult = await callPythonService({
        pieIzquierdo: body.pieIzquierdo ? urlToAbsolutePath(body.pieIzquierdo) : undefined,
        pieDerecho: body.pieDerecho ? urlToAbsolutePath(body.pieDerecho) : undefined,
        respuestas: body.respuestas,
      })
      prediction = pythonResult
    }
    catch (err) {
      console.warn('[prediccion] Servicio Python no disponible, usando heurística:', err)
      prediction = evaluationService.runPrediction({
        pieDerecho: body.pieDerecho,
        pieIzquierdo: body.pieIzquierdo,
        respuestas: body.respuestas,
      })
    }
  }
  else {
    // Sin imágenes: usar heurística basada solo en cuestionario
    prediction = evaluationService.runPrediction({
      respuestas: body.respuestas,
    })
  }

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
