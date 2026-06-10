import { prisma } from '../utils/prisma'
import type { Role } from '@prisma/client'

export const userRepository = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email } }),

  findById: (id: string) =>
    prisma.user.findUnique({ where: { id } }),

  create: (data: { email: string; password: string; role: Role; nombre: string }) =>
    prisma.user.create({ data }),

  findAllDoctors: () =>
    prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, nombre: true, email: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),

  findFirstDoctor: () =>
    prisma.user.findFirst({
      where: { role: 'DOCTOR' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    }),
}
