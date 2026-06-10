import { z } from 'zod'
import { patientService } from '../../../services/patientService'

const questionnaireSchema = z.object({
  diagnosticoPrevio: z.boolean().optional(),
  tipoDiabetes: z.string().optional(),
  anosEvolucion: z.number().optional(),
  antecedentesFamiliares: z.boolean().optional(),
  planAlimentacion: z.boolean().optional(),
  usoInsulina: z.boolean().optional(),
  trabajoPesado: z.boolean().optional(),
  ulceraEnPie: z.boolean().optional(),
  frecuenciaCorteUnas: z.number().optional(),
  cambiosTemperatura: z.boolean().optional(),
  frecuenciaEjercicio: z.string().optional(),
  tipoCalzado: z.string().optional(),
  perdidaSensibilidad: z.boolean().optional(),
  amputaciones: z.boolean().optional(),
  infeccionesPies: z.boolean().optional(),
  lesionesLentas: z.boolean().optional(),
  enfermedadesVasculares: z.boolean().optional(),
  hipertension: z.boolean().optional(),
  dislipidemia: z.boolean().optional(),
  obesidad: z.boolean().optional(),
  otrasEnfermedades: z.string().optional(),
  ulcerasAnteriores: z.boolean().optional(),
  deformidadesPies: z.boolean().optional(),
  factoresRiesgoAdicionales: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const patientId = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, questionnaireSchema.parse)
  const questionnaire = await patientService.saveQuestionnaire(patientId, body)
  return { success: true, data: questionnaire }
})
