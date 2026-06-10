<script setup lang="ts">
import type { Patient } from '~/stores/patients'

definePageMeta({ layout: 'dashboard', middleware: 'doctor-only' })

const route = useRoute()
const id = route.params.id as string

const { data, pending } = await useFetch<{ success: boolean; data: Patient }>(`/api/pacientes/${id}`)
const patient = computed(() => data.value?.data)

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}
function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const activeTab = ref('historial')
const tabs = [
  { label: 'Historial', value: 'historial', icon: 'i-heroicons-clipboard-document-list' },
  { label: 'Cuestionario', value: 'cuestionario', icon: 'i-heroicons-document-text' },
  { label: 'Datos Personales', value: 'datos', icon: 'i-heroicons-user' },
]

const avatarGrads = [
  'linear-gradient(135deg,#0ea5e9,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
]
</script>

<template>
  <div class="space-y-5 max-w-5xl">

    <div v-if="pending" class="space-y-4">
      <div v-for="i in 3" :key="i" class="skeleton-box h-28 rounded-2xl" />
    </div>

    <template v-else-if="patient">

      <div
        class="relative rounded-3xl overflow-hidden"
        style="background: linear-gradient(135deg,#060d1f,#0c2050,#0d3a7a)"
      >
        <div class="absolute inset-0 opacity-[0.05]"
             style="background-image:linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px);background-size:28px 28px" />
        <div class="absolute right-0 top-0 w-64 h-64 rounded-full pointer-events-none"
             style="background:radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%);filter:blur(40px);transform:translate(30%,-30%)" />

        <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 lg:p-7">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
            :style="avatarGrads[0]"
          >
            {{ initials(patient.nombre) }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <h1 class="text-white font-black text-xl tracking-tight">{{ patient.nombre }}</h1>
              <span
                class="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                :style="patient.sexo === 'MASCULINO'
                  ? 'background:rgba(14,165,233,0.2);color:#38bdf8'
                  : 'background:rgba(236,72,153,0.2);color:#f472b6'"
              >
                {{ patient.sexo === 'MASCULINO' ? 'Masculino' : 'Femenino' }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-3 mt-1">
              <span class="flex items-center gap-1.5 text-xs" style="color:rgba(255,255,255,0.55)">
                <UIcon name="i-heroicons-calendar-days" class="text-xs" />
                {{ patient.edad }} años · {{ formatDate(patient.fechaNacimiento) }}
              </span>
              <span class="flex items-center gap-1.5 text-xs" style="color:rgba(255,255,255,0.55)">
                <UIcon name="i-heroicons-phone" class="text-xs" />
                {{ patient.telefono }}
              </span>
              <span class="flex items-center gap-1.5 text-xs" style="color:rgba(255,255,255,0.55)">
                <UIcon name="i-heroicons-envelope" class="text-xs" />
                {{ patient.user?.email }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <NuxtLink :to="`/dashboard/evaluaciones/nueva?patientId=${patient.id}`">
              <button
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
                style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);box-shadow:0 4px 16px rgba(14,165,233,0.3)"
              >
                <UIcon name="i-heroicons-plus-circle" class="text-base" />
                Nueva evaluación
              </button>
            </NuxtLink>
            <NuxtLink :to="`/dashboard/pacientes/${patient.id}/editar`">
              <button
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.8)"
              >
                <UIcon name="i-heroicons-pencil" class="text-base" />
                Editar
              </button>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div
        class="flex gap-1 p-1 rounded-xl w-full sm:w-fit"
        style="background: var(--surface-1); border: 1px solid var(--surface-border)"
      >
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          :style="activeTab === tab.value
            ? 'background: var(--surface-2); color: var(--text-1); box-shadow: 0 1px 4px rgba(0,0,0,0.1)'
            : 'color: var(--text-3)'"
          @click="activeTab = tab.value"
        >
          <UIcon :name="tab.icon" class="text-sm" />
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'historial'">
        <div
          class="rounded-2xl overflow-hidden"
          style="background: var(--surface-1); border: 1px solid var(--surface-border)"
        >
          <div class="flex items-center justify-between px-5 py-4 border-b" style="border-color: var(--surface-border)">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: rgba(14,165,233,0.1)">
                <UIcon name="i-heroicons-clipboard-document-list" class="text-sm" style="color: #0ea5e9" />
              </div>
              <div>
                <h3 class="text-sm font-bold" style="color: var(--text-1)">Historial de Evaluaciones</h3>
                <p class="text-xs" style="color: var(--text-3)">{{ patient.evaluations?.length ?? 0 }} en total</p>
              </div>
            </div>
            <NuxtLink :to="`/dashboard/evaluaciones/nueva?patientId=${patient.id}`">
              <button
                class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
                style="background: rgba(14,165,233,0.08); color: #0ea5e9"
              >
                <UIcon name="i-heroicons-plus" class="text-xs" />
                Nueva
              </button>
            </NuxtLink>
          </div>

          <div v-if="patient.evaluations?.length" class="overflow-x-auto">
            <table class="w-full table-premium">
              <thead>
                <tr style="border-bottom: 1px solid var(--surface-border); background: var(--surface-2)">
                  <th class="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Fecha</th>
                  <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hidden md:table-cell" style="color: var(--text-3)">Doctor</th>
                  <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Riesgo</th>
                  <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hidden md:table-cell" style="color: var(--text-3)">Probabilidad</th>
                  <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hidden lg:table-cell" style="color: var(--text-3)">Observaciones</th>
                  <th class="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ev in patient.evaluations"
                  :key="ev.id"
                  class="group"
                  style="border-bottom: 1px solid var(--surface-border)"
                >
                  <td class="px-5 py-3.5 text-sm font-medium" style="color: var(--text-1)">{{ formatShortDate(ev.fecha) }}</td>
                  <td class="px-4 py-3.5 text-sm hidden md:table-cell" style="color: var(--text-2)">{{ ev.doctor?.nombre }}</td>
                  <td class="px-4 py-3.5"><RiskBadge :risk="ev.riesgo" size="sm" /></td>
                  <td class="px-4 py-3.5 text-sm hidden md:table-cell" style="color: var(--text-2)">
                    {{ ev.probabilidad != null ? `${ev.probabilidad.toFixed(1)}%` : '—' }}
                  </td>
                  <td class="px-4 py-3.5 text-sm max-w-xs truncate hidden lg:table-cell" style="color: var(--text-3)">
                    {{ ev.observaciones || '—' }}
                  </td>
                  <td class="px-4 py-3.5 text-right">
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <NuxtLink :to="`/dashboard/evaluaciones/${ev.id}`">
                        <button
                          class="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                          style="background: rgba(14,165,233,0.1); color: #0ea5e9"
                        >
                          <UIcon name="i-heroicons-eye" />
                        </button>
                      </NuxtLink>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-14">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style="background: var(--surface-2)">
              <UIcon name="i-heroicons-clipboard-document-list" class="text-2xl" style="color: var(--text-3)" />
            </div>
            <p class="font-semibold text-sm" style="color: var(--text-2)">Sin evaluaciones registradas</p>
            <NuxtLink :to="`/dashboard/evaluaciones/nueva?patientId=${patient.id}`" class="mt-4">
              <button class="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
                <UIcon name="i-heroicons-plus" />
                Nueva evaluación
              </button>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'cuestionario'">
        <div
          class="rounded-2xl overflow-hidden"
          style="background: var(--surface-1); border: 1px solid var(--surface-border)"
        >
          <div class="px-5 py-4 border-b flex items-center justify-between" style="border-color: var(--surface-border)">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: rgba(139,92,246,0.1)">
                <UIcon name="i-heroicons-document-text" class="text-sm" style="color: #8b5cf6" />
              </div>
              <h3 class="text-sm font-bold" style="color: var(--text-1)">Cuestionario de Salud Podológica</h3>
            </div>
            <NuxtLink v-if="patient.questionnaire" :to="`/dashboard/pacientes/${patient.id}/editar`">
              <button class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="background: var(--surface-2); color: var(--text-2)">
                <UIcon name="i-heroicons-pencil" class="mr-1" />
                Editar
              </button>
            </NuxtLink>
          </div>

          <div v-if="patient.questionnaire" class="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="p-4 rounded-xl space-y-2" style="background: var(--surface-2)">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background: rgba(239,68,68,0.1)">
                  <UIcon name="i-heroicons-heart" class="text-xs" style="color: #ef4444" />
                </div>
                <h4 class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Diabetes</h4>
              </div>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span style="color: var(--text-3)">Diagnóstico previo</span>
                  <span class="font-semibold" style="color: var(--text-1)">{{ patient.questionnaire.diagnosticoPrevio ? 'Sí' : 'No' }}</span>
                </div>
                <div v-if="patient.questionnaire.tipoDiabetes" class="flex justify-between">
                  <span style="color: var(--text-3)">Tipo</span>
                  <span class="font-semibold" style="color: var(--text-1)">{{ patient.questionnaire.tipoDiabetes }}</span>
                </div>
                <div v-if="patient.questionnaire.anosEvolucion" class="flex justify-between">
                  <span style="color: var(--text-3)">Años de evolución</span>
                  <span class="font-semibold" style="color: var(--text-1)">{{ patient.questionnaire.anosEvolucion }}</span>
                </div>
              </div>
            </div>

            <div class="p-4 rounded-xl space-y-2" style="background: var(--surface-2)">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background: rgba(14,165,233,0.1)">
                  <UIcon name="i-heroicons-eye" class="text-xs" style="color: #0ea5e9" />
                </div>
                <h4 class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Sensibilidad</h4>
              </div>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span style="color: var(--text-3)">Pérdida de sensibilidad</span>
                  <span class="font-semibold" :style="patient.questionnaire.perdidaSensibilidad ? 'color:#ef4444' : 'color:var(--text-1)'">{{ patient.questionnaire.perdidaSensibilidad ? 'Sí' : 'No' }}</span>
                </div>
                <div class="flex justify-between">
                  <span style="color: var(--text-3)">Amputaciones</span>
                  <span class="font-semibold" :style="patient.questionnaire.amputaciones ? 'color:#ef4444' : 'color:var(--text-1)'">{{ patient.questionnaire.amputaciones ? 'Sí' : 'No' }}</span>
                </div>
                <div class="flex justify-between">
                  <span style="color: var(--text-3)">Infecciones en pies</span>
                  <span class="font-semibold" :style="patient.questionnaire.infeccionesPies ? 'color:#f59e0b' : 'color:var(--text-1)'">{{ patient.questionnaire.infeccionesPies ? 'Sí' : 'No' }}</span>
                </div>
              </div>
            </div>

            <div class="p-4 rounded-xl" style="background: var(--surface-2)">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background: rgba(245,158,11,0.1)">
                  <UIcon name="i-heroicons-exclamation-triangle" class="text-xs" style="color: #f59e0b" />
                </div>
                <h4 class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Enfermedades Asociadas</h4>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-if="patient.questionnaire.hipertension" class="text-xs px-2.5 py-1 rounded-full font-semibold" style="background:rgba(239,68,68,0.1);color:#ef4444">Hipertensión</span>
                <span v-if="patient.questionnaire.dislipidemia" class="text-xs px-2.5 py-1 rounded-full font-semibold" style="background:rgba(249,115,22,0.1);color:#f97316">Dislipidemia</span>
                <span v-if="patient.questionnaire.obesidad" class="text-xs px-2.5 py-1 rounded-full font-semibold" style="background:rgba(245,158,11,0.1);color:#f59e0b">Obesidad</span>
                <span v-if="patient.questionnaire.enfermedadesVasculares" class="text-xs px-2.5 py-1 rounded-full font-semibold" style="background:rgba(139,92,246,0.1);color:#8b5cf6">Enf. Vasculares</span>
                <span
                  v-if="!patient.questionnaire.hipertension && !patient.questionnaire.dislipidemia && !patient.questionnaire.obesidad && !patient.questionnaire.enfermedadesVasculares"
                  class="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style="background:rgba(16,185,129,0.1);color:#10b981"
                >Ninguna reportada</span>
              </div>
            </div>

            <div class="p-4 rounded-xl space-y-2" style="background: var(--surface-2)">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background: rgba(16,185,129,0.1)">
                  <UIcon name="i-heroicons-sparkles" class="text-xs" style="color: #10b981" />
                </div>
                <h4 class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Hábitos</h4>
              </div>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span style="color: var(--text-3)">Frecuencia ejercicio</span>
                  <span class="font-semibold" style="color: var(--text-1)">{{ patient.questionnaire.frecuenciaEjercicio || '—' }}</span>
                </div>
                <div class="flex justify-between">
                  <span style="color: var(--text-3)">Tipo de calzado</span>
                  <span class="font-semibold" style="color: var(--text-1)">{{ patient.questionnaire.tipoCalzado || '—' }}</span>
                </div>
                <div class="flex justify-between">
                  <span style="color: var(--text-3)">Plan de alimentación</span>
                  <span class="font-semibold" :style="patient.questionnaire.planAlimentacion ? 'color:#10b981' : 'color:var(--text-1)'">{{ patient.questionnaire.planAlimentacion ? 'Sí' : 'No' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-14">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style="background: var(--surface-2)">
              <UIcon name="i-heroicons-document-text" class="text-2xl" style="color: var(--text-3)" />
            </div>
            <p class="font-semibold text-sm" style="color: var(--text-2)">Sin cuestionario registrado</p>
            <NuxtLink :to="`/dashboard/pacientes/${patient.id}/editar`" class="mt-4">
              <button class="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
                <UIcon name="i-heroicons-plus" />
                Completar cuestionario
              </button>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'datos'">
        <div
          class="rounded-2xl overflow-hidden"
          style="background: var(--surface-1); border: 1px solid var(--surface-border)"
        >
          <div class="px-5 py-4 border-b flex items-center justify-between" style="border-color: var(--surface-border)">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: rgba(14,165,233,0.1)">
                <UIcon name="i-heroicons-user" class="text-sm" style="color: #0ea5e9" />
              </div>
              <h3 class="text-sm font-bold" style="color: var(--text-1)">Datos Personales</h3>
            </div>
            <NuxtLink :to="`/dashboard/pacientes/${patient.id}/editar`">
              <button class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="background: var(--surface-2); color: var(--text-2)">
                <UIcon name="i-heroicons-pencil" class="mr-1" />
                Editar
              </button>
            </NuxtLink>
          </div>
          <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="item in [
                { label: 'Nombre completo', value: patient.nombre, icon: 'i-heroicons-user' },
                { label: 'Correo electrónico', value: patient.user?.email, icon: 'i-heroicons-envelope' },
                { label: 'Fecha de nacimiento', value: formatDate(patient.fechaNacimiento), icon: 'i-heroicons-calendar' },
                { label: 'Edad', value: `${patient.edad} años`, icon: 'i-heroicons-cake' },
                { label: 'Sexo', value: patient.sexo === 'MASCULINO' ? 'Masculino' : 'Femenino', icon: 'i-heroicons-user-circle' },
                { label: 'Estado civil', value: patient.estadoCivil, icon: 'i-heroicons-heart' },
                { label: 'Teléfono', value: patient.telefono, icon: 'i-heroicons-phone' },
                { label: 'Domicilio', value: patient.domicilio, icon: 'i-heroicons-map-pin' },
              ]"
              :key="item.label"
              class="flex items-start gap-3 p-3 rounded-xl"
              style="background: var(--surface-2)"
            >
              <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style="background: var(--surface-3)">
                <UIcon :name="item.icon" class="text-xs" style="color: var(--text-3)" />
              </div>
              <div class="min-w-0">
                <p class="text-xs" style="color: var(--text-3)">{{ item.label }}</p>
                <p class="text-sm font-semibold mt-0.5 truncate" style="color: var(--text-1)">{{ item.value }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <div v-else class="flex flex-col items-center justify-center py-24">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style="background: var(--surface-2)">
        <UIcon name="i-heroicons-user-minus" class="text-2xl" style="color: var(--text-3)" />
      </div>
      <p class="font-bold" style="color: var(--text-2)">Paciente no encontrado</p>
    </div>
  </div>
</template>
