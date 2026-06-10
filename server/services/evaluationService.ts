import { evaluationRepository } from '../repositories/evaluationRepository'
import type { RiskLevel } from '@prisma/client'

interface CreateEvaluationDto {
  patientId: string
  doctorId: string
  fecha?: string
  observaciones?: string
}

interface PredictionInput {
  pieDerecho?: string
  pieIzquierdo?: string
  respuestas: Record<string, unknown>
}

interface PredictionResult {
  riesgo: RiskLevel
  probabilidad: number
  recomendaciones: string[]
  hallazgos: string[]
}

export const evaluationService = {
  create: (dto: CreateEvaluationDto) =>
    evaluationRepository.create({
      ...dto,
      fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
    }),

  findAll: (doctorId?: string) => evaluationRepository.findAll(doctorId),

  findById: (id: string) => evaluationRepository.findById(id),

  update: (id: string, data: Record<string, unknown>) =>
    evaluationRepository.update(id, data),

  addThermalImage: (data: { evaluationId: string; tipoPie: 'DERECHO' | 'IZQUIERDO'; rutaImagen: string }) =>
    evaluationRepository.addThermalImage(data),

  runPrediction(input: PredictionInput): PredictionResult {
    const riskScore = calculateRiskScore(input.respuestas)

    let riesgo: RiskLevel
    if (riskScore < 25) riesgo = 'BAJO'
    else if (riskScore < 50) riesgo = 'MEDIO'
    else if (riskScore < 75) riesgo = 'ALTO'
    else riesgo = 'CRITICO'

    const hallazgos: string[] = []
    if (input.pieDerecho && input.pieIzquierdo) {
      hallazgos.push('Análisis termográfico procesado')
      if (riskScore > 40) hallazgos.push('Diferencia térmica detectada entre ambos pies (>2°C)')
      if (riskScore > 60) hallazgos.push('Posibles áreas de inflamación identificadas en pie derecho')
    }

    const recomendaciones = buildRecommendations(input.respuestas, riesgo)

    return {
      riesgo,
      probabilidad: Math.round(riskScore * 10) / 10,
      recomendaciones,
      hallazgos,
    }
  },
}

function calculateRiskScore(respuestas: Record<string, unknown>): number {
  let score = 0

  if (respuestas.diagnosticoPrevio) score += 20
  if (respuestas.anosEvolucion && Number(respuestas.anosEvolucion) > 10) score += 15
  if (respuestas.anosEvolucion && Number(respuestas.anosEvolucion) > 5) score += 8
  if (respuestas.antecedentesFamiliares) score += 10
  if (respuestas.ulceraEnPie) score += 20
  if (respuestas.cambiosTemperatura) score += 12
  if (respuestas.perdidaSensibilidad) score += 15
  if (respuestas.amputaciones) score += 25
  if (respuestas.infeccionesPies) score += 15
  if (respuestas.lesionesLentas) score += 12
  if (respuestas.enfermedadesVasculares) score += 10
  if (respuestas.hipertension) score += 8
  if (respuestas.obesidad) score += 8
  if (respuestas.ulcerasAnteriores) score += 18
  if (respuestas.deformidadesPies) score += 10
  if (!respuestas.planAlimentacion) score += 5
  if (respuestas.frecuenciaEjercicio === 'Nunca') score += 8

  return Math.min(score, 100)
}

function buildRecommendations(respuestas: Record<string, unknown>, riesgo: RiskLevel): string[] {
  const recs: string[] = ['Inspección diaria de los pies en busca de lesiones, ampollas o cambios de color']

  if (riesgo === 'ALTO' || riesgo === 'CRITICO') {
    recs.push('Consulta urgente con endocrinología y podología especializada')
    recs.push('Control glucémico estricto con monitoreo frecuente')
  }

  if (respuestas.perdidaSensibilidad) recs.push('Evaluación neurológica de sensibilidad periférica')
  if (!respuestas.planAlimentacion) recs.push('Iniciar plan de alimentación supervisado por nutriólogo')
  if (respuestas.frecuenciaEjercicio === 'Nunca') recs.push('Incorporar actividad física ligera supervisada (caminata 30 min/día)')
  if (respuestas.hipertension) recs.push('Control regular de presión arterial')
  if (respuestas.obesidad) recs.push('Plan de reducción de peso supervisado')

  recs.push('Usar calzado cómodo, transpirable y sin costuras interiores')
  recs.push('No caminar descalzo en ningún momento')
  recs.push('Mantener los pies limpios y bien hidratados')

  return recs
}
