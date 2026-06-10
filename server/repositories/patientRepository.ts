import { prisma } from '../utils/prisma'
import type { Prisma } from '@prisma/client'

export const patientRepository = {
  findAll: () =>
    prisma.patient.findMany({
      include: {
        user: { select: { email: true } },
        evaluations: { select: { id: true, fecha: true, riesgo: true }, orderBy: { fecha: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),

  findById: (id: string) =>
    prisma.patient.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        questionnaire: true,
        evaluations: {
          include: {
            doctor: { select: { nombre: true } },
            thermalImages: true,
          },
          orderBy: { fecha: 'desc' },
        },
      },
    }),

  findByUserId: (userId: string) =>
    prisma.patient.findUnique({
      where: { userId },
      include: {
        questionnaire: true,
        evaluations: {
          where: { riesgo: { not: null } },
          include: {
            doctor: { select: { nombre: true } },
            thermalImages: true,
          },
          orderBy: { fecha: 'desc' },
        },
      },
    }),

  create: (data: Prisma.PatientCreateInput) =>
    prisma.patient.create({ data, include: { user: { select: { email: true } } } }),

  update: (id: string, data: Prisma.PatientUpdateInput) =>
    prisma.patient.update({ where: { id }, data }),

  count: () => prisma.patient.count(),

  upsertQuestionnaire: (patientId: string, data: Prisma.MedicalQuestionnaireUncheckedCreateInput) =>
    prisma.medicalQuestionnaire.upsert({
      where: { patientId },
      create: { ...data, patientId },
      update: data,
    }),
}
