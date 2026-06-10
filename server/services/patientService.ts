import { patientRepository } from '../repositories/patientRepository'
import { userRepository } from '../repositories/userRepository'
import { hashPassword } from '../utils/password'
import type { Sexo } from '@prisma/client'

interface CreatePatientDto {
  email: string
  password: string
  nombre: string
  fechaNacimiento: string
  edad: number
  sexo: Sexo
  domicilio: string
  telefono: string
  estadoCivil: string
}

interface UpdatePatientDto {
  nombre?: string
  fechaNacimiento?: string
  edad?: number
  sexo?: Sexo
  domicilio?: string
  telefono?: string
  estadoCivil?: string
}

export const patientService = {
  async create(dto: CreatePatientDto) {
    const existing = await userRepository.findByEmail(dto.email)
    if (existing) throw createError({ statusCode: 409, statusMessage: 'El correo ya está registrado' })

    const hashedPassword = await hashPassword(dto.password)

    const user = await userRepository.create({
      email: dto.email,
      password: hashedPassword,
      role: 'PATIENT',
      nombre: dto.nombre,
    })

    const patient = await patientRepository.create({
      nombre: dto.nombre,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      edad: dto.edad,
      sexo: dto.sexo,
      domicilio: dto.domicilio,
      telefono: dto.telefono,
      estadoCivil: dto.estadoCivil,
      user: { connect: { id: user.id } },
    })

    return patient
  },

  findAll: () => patientRepository.findAll(),

  findById: (id: string) => patientRepository.findById(id),

  findByUserId: (userId: string) => patientRepository.findByUserId(userId),

  async update(id: string, dto: UpdatePatientDto) {
    return patientRepository.update(id, {
      ...dto,
      fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
    })
  },

  async saveQuestionnaire(patientId: string, data: Record<string, unknown>) {
    return patientRepository.upsertQuestionnaire(patientId, {
      patientId,
      ...data,
    } as Parameters<typeof patientRepository.upsertQuestionnaire>[1])
  },
}
