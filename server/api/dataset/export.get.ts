import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const evaluations = await prisma.evaluation.findMany({
    where: { riesgo: { not: null } },
    include: {
      patient: {
        include: { questionnaire: true },
      },
      thermalImages: true,
    },
    orderBy: { fecha: 'asc' },
  })

  const samples = evaluations.map((ev) => {
    const q = ev.patient.questionnaire

    return {
      id: ev.id,
      fecha: ev.fecha.toISOString(),
      label: ev.riesgo,
      probability: ev.probabilidad,

      images: {
        izquierdo: ev.thermalImages.find(i => i.tipoPie === 'IZQUIERDO')?.rutaImagen ?? null,
        derecho: ev.thermalImages.find(i => i.tipoPie === 'DERECHO')?.rutaImagen ?? null,
        count: ev.thermalImages.length,
      },

      patient: {
        edad: ev.patient.edad,
        sexo: ev.patient.sexo,
      },

      questionnaire: q ? {
        diagnosticoPrevio: q.diagnosticoPrevio,
        tipoDiabetes: q.tipoDiabetes ?? null,
        anosEvolucion: q.anosEvolucion ?? null,
        usoInsulina: q.usoInsulina,

        antecedentesFamiliares: q.antecedentesFamiliares,
        planAlimentacion: q.planAlimentacion,
        trabajoPesado: q.trabajoPesado,

        ulceraEnPie: q.ulceraEnPie,
        cambiosTemperatura: q.cambiosTemperatura,

        frecuenciaEjercicio: q.frecuenciaEjercicio ?? null,
        tipoCalzado: q.tipoCalzado ?? null,
        frecuenciaCorteUnas: q.frecuenciaCorteUnas ?? null,

        perdidaSensibilidad: q.perdidaSensibilidad,
        amputaciones: q.amputaciones,
        infeccionesPies: q.infeccionesPies,
        lesionesLentas: q.lesionesLentas,

        hipertension: q.hipertension,
        dislipidemia: q.dislipidemia,
        obesidad: q.obesidad,
        enfermedadesVasculares: q.enfermedadesVasculares,
        otrasEnfermedades: q.otrasEnfermedades ?? null,

        ulcerasAnteriores: q.ulcerasAnteriores,
        deformidadesPies: q.deformidadesPies,
        factoresRiesgoAdicionales: q.factoresRiesgoAdicionales ?? null,
      } : null,
    }
  })

  const dist = { BAJO: 0, MEDIO: 0, ALTO: 0, CRITICO: 0 }
  for (const s of samples) {
    if (s.label) dist[s.label as keyof typeof dist]++
  }

  return {
    success: true,
    data: {
      meta: {
        version: '1.0',
        exported_at: new Date().toISOString(),
        total_samples: samples.length,
        samples_with_images: samples.filter(s => s.images.count > 0).length,
        samples_with_both_images: samples.filter(s => s.images.count === 2).length,
        samples_with_questionnaire: samples.filter(s => s.questionnaire !== null).length,
        class_distribution: dist,
      },
      samples,
    },
  }
})
