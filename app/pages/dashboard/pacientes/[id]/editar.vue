<script setup lang="ts">
import { z } from 'zod'
import type { Patient } from '~/stores/patients'

definePageMeta({ layout: 'dashboard', middleware: 'doctor-only' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const id = route.params.id as string

const { data, pending } = await useFetch<{ success: boolean; data: Patient }>(`/api/pacientes/${id}`)
const patient = computed(() => data.value?.data)

const personalSchema = z.object({
  nombre: z.string().min(2),
  fechaNacimiento: z.string(),
  edad: z.number({ coerce: true }).min(0).max(120),
  sexo: z.enum(['MASCULINO', 'FEMENINO']),
  domicilio: z.string().min(5),
  telefono: z.string().min(7),
  estadoCivil: z.string().min(1),
})

const personal = reactive({
  nombre: '', fechaNacimiento: '', edad: 0,
  sexo: 'MASCULINO' as 'MASCULINO' | 'FEMENINO',
  domicilio: '', telefono: '', estadoCivil: '',
})

const questionnaire = reactive({
  diagnosticoPrevio: false, tipoDiabetes: '', anosEvolucion: 0,
  antecedentesFamiliares: false, planAlimentacion: false, usoInsulina: false, trabajoPesado: false,
  ulceraEnPie: false, frecuenciaCorteUnas: 2, cambiosTemperatura: false,
  frecuenciaEjercicio: '', tipoCalzado: '',
  perdidaSensibilidad: false, amputaciones: false, infeccionesPies: false, lesionesLentas: false,
  enfermedadesVasculares: false, hipertension: false, dislipidemia: false, obesidad: false, otrasEnfermedades: '',
  ulcerasAnteriores: false, deformidadesPies: false, factoresRiesgoAdicionales: '',
})

watch(patient, (p) => {
  if (!p) return
  Object.assign(personal, {
    nombre: p.nombre,
    fechaNacimiento: p.fechaNacimiento.split('T')[0],
    edad: p.edad,
    sexo: p.sexo,
    domicilio: p.domicilio,
    telefono: p.telefono,
    estadoCivil: p.estadoCivil,
  })
  if (p.questionnaire) {
    Object.assign(questionnaire, p.questionnaire)
  }
}, { immediate: true })

const loadingPersonal = ref(false)
const loadingQuestionnaire = ref(false)

async function savePersonal() {
  loadingPersonal.value = true
  try {
    await $fetch(`/api/pacientes/${id}`, { method: 'PUT', body: personal })
    toast.add({ title: 'Datos actualizados', color: 'green' })
  }
  catch {
    toast.add({ title: 'Error al actualizar', color: 'red' })
  }
  finally { loadingPersonal.value = false }
}

async function saveQuestionnaire() {
  loadingQuestionnaire.value = true
  try {
    await $fetch(`/api/pacientes/${id}/cuestionario`, { method: 'PUT', body: questionnaire })
    toast.add({ title: 'Cuestionario guardado', color: 'green' })
  }
  catch {
    toast.add({ title: 'Error al guardar cuestionario', color: 'red' })
  }
  finally { loadingQuestionnaire.value = false }
}

const sexoOptions = [
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Femenino', value: 'FEMENINO' },
]
const estadoCivilOptions = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'].map(v => ({ label: v, value: v }))
const tipoDiabetesOptions = ['Tipo 1', 'Tipo 2', 'Gestacional', 'No tiene diabetes'].map(v => ({ label: v, value: v }))
const frecuenciaEjercicioOptions = ['Nunca', '1-2 veces', '3 veces', '4 veces o más'].map(v => ({ label: v, value: v }))
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <NuxtLink :to="`/dashboard/pacientes/${id}`">
        <UButton variant="ghost" icon="i-heroicons-arrow-left" size="sm" />
      </NuxtLink>
      <h2 class="text-xl font-bold text-slate-900 dark:text-white">Editar Paciente</h2>
    </div>

    <div v-if="pending" class="space-y-4">
      <USkeleton v-for="i in 3" :key="i" class="h-32 rounded-xl" />
    </div>

    <template v-else-if="patient">
      <UCard>
        <template #header>
          <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-heroicons-user" />
            Datos Personales
          </h3>
        </template>
        <UForm :schema="personalSchema" :state="personal" class="space-y-4" @submit="savePersonal">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Nombre completo" name="nombre" class="sm:col-span-2">
              <UInput v-model="personal.nombre" class="w-full" />
            </UFormField>
            <UFormField label="Fecha de nacimiento" name="fechaNacimiento">
              <UInput v-model="personal.fechaNacimiento" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Edad" name="edad">
              <UInput v-model="personal.edad" type="number" class="w-full" />
            </UFormField>
            <UFormField label="Sexo" name="sexo">
              <USelect v-model="personal.sexo" :items="sexoOptions" class="w-full" />
            </UFormField>
            <UFormField label="Estado civil" name="estadoCivil">
              <USelect v-model="personal.estadoCivil" :items="estadoCivilOptions" class="w-full" />
            </UFormField>
            <UFormField label="Teléfono" name="telefono">
              <UInput v-model="personal.telefono" class="w-full" />
            </UFormField>
            <UFormField label="Domicilio" name="domicilio" class="sm:col-span-2">
              <UInput v-model="personal.domicilio" class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end">
            <UButton type="submit" :loading="loadingPersonal" icon="i-heroicons-check">
              Guardar cambios
            </UButton>
          </div>
        </UForm>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-heroicons-document-text" />
            Cuestionario Clínico
          </h3>
        </template>

        <div class="space-y-6">
          <div class="space-y-3">
            <h4 class="font-medium text-slate-800 dark:text-slate-200 text-sm border-b pb-2 dark:border-slate-700">Diabetes</h4>
            <UCheckbox v-model="questionnaire.diagnosticoPrevio" label="Diagnóstico previo de diabetes" />
            <div v-if="questionnaire.diagnosticoPrevio" class="ml-4 space-y-3">
              <USelect v-model="questionnaire.tipoDiabetes" :items="tipoDiabetesOptions" class="w-64" placeholder="Tipo de diabetes" />
              <UInput v-model="questionnaire.anosEvolucion" type="number" class="w-48" placeholder="Años de evolución" />
            </div>
          </div>

          <div class="space-y-3">
            <h4 class="font-medium text-slate-800 dark:text-slate-200 text-sm border-b pb-2 dark:border-slate-700">Antecedentes</h4>
            <UCheckbox v-model="questionnaire.antecedentesFamiliares" label="Antecedentes familiares con pie diabético" />
            <UCheckbox v-model="questionnaire.planAlimentacion" label="Sigue plan de alimentación" />
            <UCheckbox v-model="questionnaire.usoInsulina" label="Usa insulina o medicamento" />
            <UCheckbox v-model="questionnaire.trabajoPesado" label="Realiza trabajo pesado" />
          </div>

          <div class="space-y-3">
            <h4 class="font-medium text-slate-800 dark:text-slate-200 text-sm border-b pb-2 dark:border-slate-700">Lesiones y Sensibilidad</h4>
            <UCheckbox v-model="questionnaire.ulceraEnPie" label="Ha tenido úlceras en el pie" />
            <UCheckbox v-model="questionnaire.cambiosTemperatura" label="Cambios de temperatura en pies" />
            <UCheckbox v-model="questionnaire.perdidaSensibilidad" label="Pérdida de sensibilidad" />
            <UCheckbox v-model="questionnaire.amputaciones" label="Ha sufrido amputaciones" />
            <UCheckbox v-model="questionnaire.infeccionesPies" label="Infecciones en pies" />
            <UCheckbox v-model="questionnaire.lesionesLentas" label="Lesiones que tardan en sanar" />
          </div>

          <div class="space-y-3">
            <h4 class="font-medium text-slate-800 dark:text-slate-200 text-sm border-b pb-2 dark:border-slate-700">Hábitos</h4>
            <USelect v-model="questionnaire.frecuenciaEjercicio" :items="frecuenciaEjercicioOptions" class="w-full" placeholder="Frecuencia de ejercicio" />
            <UInput v-model="questionnaire.tipoCalzado" placeholder="Tipo de calzado" class="w-full" />
          </div>

          <div class="space-y-3">
            <h4 class="font-medium text-slate-800 dark:text-slate-200 text-sm border-b pb-2 dark:border-slate-700">Enfermedades Asociadas</h4>
            <div class="grid grid-cols-2 gap-2">
              <UCheckbox v-model="questionnaire.hipertension" label="Hipertensión" />
              <UCheckbox v-model="questionnaire.dislipidemia" label="Dislipidemia" />
              <UCheckbox v-model="questionnaire.obesidad" label="Obesidad" />
              <UCheckbox v-model="questionnaire.enfermedadesVasculares" label="Enf. vasculares" />
            </div>
            <UInput v-model="questionnaire.otrasEnfermedades" placeholder="Otras enfermedades" class="w-full" />
          </div>

          <div class="space-y-3">
            <h4 class="font-medium text-slate-800 dark:text-slate-200 text-sm border-b pb-2 dark:border-slate-700">Historial</h4>
            <UCheckbox v-model="questionnaire.ulcerasAnteriores" label="Úlceras anteriores" />
            <UCheckbox v-model="questionnaire.deformidadesPies" label="Deformidades en pies" />
            <UTextarea v-model="questionnaire.factoresRiesgoAdicionales" placeholder="Factores de riesgo adicionales..." class="w-full" :rows="3" />
          </div>

          <div class="flex justify-end">
            <UButton :loading="loadingQuestionnaire" icon="i-heroicons-check" @click="saveQuestionnaire">
              Guardar cuestionario
            </UButton>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>
