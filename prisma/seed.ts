import { PrismaClient, Role, Sexo } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const doctorPassword = await bcrypt.hash('123123123', 12)
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@gmail.com' },
    update: {},
    create: {
      email: 'doctor@gmail.com',
      password: doctorPassword,
      role: Role.DOCTOR,
      nombre: 'Dr. Carlos Medina',
    },
  })

  const patientPassword = await bcrypt.hash('123123123', 12)
  const patientUser = await prisma.user.upsert({
    where: { email: 'paciente@gmail.com' },
    update: {},
    create: {
      email: 'paciente@gmail.com',
      password: patientPassword,
      role: Role.PATIENT,
      nombre: 'Juan Pérez',
    },
  })

  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      nombre: 'Juan Pérez',
      fechaNacimiento: new Date('1975-05-15'),
      edad: 50,
      sexo: Sexo.MASCULINO,
      domicilio: 'Av. Revolución 123, Col. Centro',
      telefono: '555-1234-567',
      estadoCivil: 'Casado',
    },
  })

  await prisma.medicalQuestionnaire.upsert({
    where: { patientId: patient.id },
    update: {},
    create: {
      patientId: patient.id,
      diagnosticoPrevio: true,
      tipoDiabetes: 'Tipo 2',
      anosEvolucion: 8,
      antecedentesFamiliares: true,
      planAlimentacion: true,
      usoInsulina: false,
      trabajoPesado: false,
      ulceraEnPie: false,
      frecuenciaCorteUnas: 2,
      cambiosTemperatura: true,
      frecuenciaEjercicio: '1-2 veces',
      tipoCalzado: 'Zapatos cerrados',
      perdidaSensibilidad: false,
      amputaciones: false,
      infeccionesPies: false,
      lesionesLentas: false,
      hipertension: true,
      dislipidemia: false,
      obesidad: true,
    },
  })

  await prisma.evaluation.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      fecha: new Date(),
      observaciones: 'Evaluación inicial. Paciente presenta ligeras alteraciones en temperatura del pie derecho.',
      riesgo: 'MEDIO',
      probabilidad: 45.2,
      recomendaciones: JSON.stringify([
        'Inspección diaria de los pies',
        'Mantener glucosa en niveles controlados',
        'Usar calzado adecuado para diabéticos',
        'Acudir a podología cada 3 meses',
      ]),
      hallazgos: JSON.stringify([
        'Diferencia térmica leve entre pie derecho e izquierdo (+1.8°C)',
        'Posible inflamación distal en pie derecho',
      ]),
    },
  })

  console.log('✅ Seed completado exitosamente')
  console.log('📧 Doctor: doctor@gmail.com / 123123123')
  console.log('📧 Paciente: paciente@gmail.com / 123123123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
