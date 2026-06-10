import { defineStore } from 'pinia'

export interface Patient {
  id: string
  userId: string
  nombre: string
  fechaNacimiento: string
  edad: number
  sexo: 'MASCULINO' | 'FEMENINO'
  domicilio: string
  telefono: string
  estadoCivil: string
  user?: { email: string }
  evaluations?: Evaluation[]
  questionnaire?: MedicalQuestionnaire
  createdAt: string
}

export interface Evaluation {
  id: string
  patientId: string
  doctorId: string
  fecha: string
  observaciones?: string
  riesgo?: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'
  probabilidad?: number
  recomendaciones?: string
  hallazgos?: string
  doctor?: { nombre: string; id: string }
  patient?: { nombre: string; id: string }
  thermalImages?: ThermalImage[]
  createdAt: string
}

export interface ThermalImage {
  id: string
  evaluationId: string
  tipoPie: 'DERECHO' | 'IZQUIERDO'
  rutaImagen: string
}

export interface MedicalQuestionnaire {
  id: string
  patientId: string
  diagnosticoPrevio: boolean
  tipoDiabetes?: string
  anosEvolucion?: number
  antecedentesFamiliares: boolean
  planAlimentacion: boolean
  usoInsulina: boolean
  trabajoPesado: boolean
  ulceraEnPie: boolean
  frecuenciaCorteUnas?: number
  cambiosTemperatura: boolean
  frecuenciaEjercicio?: string
  tipoCalzado?: string
  perdidaSensibilidad: boolean
  amputaciones: boolean
  infeccionesPies: boolean
  lesionesLentas: boolean
  enfermedadesVasculares: boolean
  hipertension: boolean
  dislipidemia: boolean
  obesidad: boolean
  otrasEnfermedades?: string
  ulcerasAnteriores: boolean
  deformidadesPies: boolean
  factoresRiesgoAdicionales?: string
}

export const usePatientsStore = defineStore('patients', () => {
  const patients = ref<Patient[]>([])
  const currentPatient = ref<Patient | null>(null)
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await $fetch<{ success: boolean; data: Patient[] }>('/api/pacientes')
      patients.value = data
    }
    finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    try {
      const { data } = await $fetch<{ success: boolean; data: Patient }>(`/api/pacientes/${id}`)
      currentPatient.value = data
      return data
    }
    finally {
      loading.value = false
    }
  }

  return { patients, currentPatient, loading, fetchAll, fetchById }
})
