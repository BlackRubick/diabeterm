import { prisma } from '../utils/prisma'
import type { Prisma } from '@prisma/client'

const evaluationInclude = {
  patient: { select: { id: true, nombre: true, edad: true, sexo: true } },
  doctor: { select: { id: true, nombre: true } },
  thermalImages: true,
} satisfies Prisma.EvaluationInclude

export const evaluationRepository = {
  findAll: (doctorId?: string) =>
    prisma.evaluation.findMany({
      where: doctorId ? { doctorId } : undefined,
      include: evaluationInclude,
      orderBy: { fecha: 'desc' },
    }),

  findByPatient: (patientId: string) =>
    prisma.evaluation.findMany({
      where: { patientId, riesgo: { not: null } },
      include: evaluationInclude,
      orderBy: { fecha: 'desc' },
    }),

  findById: (id: string) =>
    prisma.evaluation.findUnique({ where: { id }, include: evaluationInclude }),

  create: (data: Prisma.EvaluationUncheckedCreateInput) =>
    prisma.evaluation.create({ data, include: evaluationInclude }),

  update: (id: string, data: Prisma.EvaluationUncheckedUpdateInput) =>
    prisma.evaluation.update({ where: { id }, data, include: evaluationInclude }),

  count: () => prisma.evaluation.count(),

  countPending: () => prisma.evaluation.count({ where: { riesgo: null } }),

  findRecent: (limit = 5) =>
    prisma.evaluation.findMany({
      take: limit,
      include: evaluationInclude,
      orderBy: { fecha: 'desc' },
    }),

  addThermalImage: (data: { evaluationId: string; tipoPie: 'DERECHO' | 'IZQUIERDO'; rutaImagen: string }) =>
    prisma.thermalImage.create({ data }),
}
