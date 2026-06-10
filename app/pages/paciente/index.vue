<script setup lang="ts">
import { gsap } from 'gsap'
import type { Patient } from '~/stores/patients'

definePageMeta({ layout: 'dashboard', middleware: 'patient-only' })

const authStore = useAuthStore()

const { data: patientData, pending } = await useFetch<{ success: boolean; data: Patient }>('/api/pacientes/me')
const patient = computed(() => patientData.value?.data)
const evaluaciones = computed(() => patient.value?.evaluations ?? [])
const latest = computed(() => evaluaciones.value[0])

function fDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}
function fShort(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const hour = new Date().getHours()
const greeting = computed(() => {
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

onMounted(() => {
  gsap.from('.timeline-item', { x: -20, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.4 })
})
</script>

<template>
  <div class="space-y-5 max-w-4xl mx-auto">

    <div
      class="relative rounded-3xl overflow-hidden"
      style="background: linear-gradient(135deg, #060d1f, #0f2045, #0c4a7a)"
    >
      <div class="absolute inset-0 opacity-[0.06]"
           style="background-image: linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px);background-size:30px 30px" />
      <div class="absolute right-0 top-0 w-64 h-64 rounded-full pointer-events-none"
           style="background:radial-gradient(circle,rgba(14,165,233,0.2) 0%,transparent 70%);filter:blur(40px);transform:translate(30%,-30%)" />

      <div class="relative flex items-start gap-4 p-6 lg:p-7">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
             style="background: rgba(14,165,233,0.2)">
          <UIcon name="i-heroicons-hand-raised" class="text-2xl" style="color: #38bdf8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sky-400 text-sm font-medium">{{ greeting }},</p>
          <h1 class="text-white text-2xl font-bold tracking-tight mt-0.5">{{ authStore.user?.nombre }}</h1>
          <p class="text-slate-400 text-sm mt-1.5">
            Aquí puedes consultar el historial de tus evaluaciones y recomendaciones médicas.
          </p>
        </div>
        <div v-if="latest?.riesgo" class="flex-shrink-0 hidden sm:block">
          <p class="text-slate-500 text-xs mb-1.5 text-right">Último resultado</p>
          <RiskBadge :risk="latest.riesgo" size="lg" />
        </div>
      </div>
    </div>

    <div v-if="!pending" class="grid grid-cols-3 gap-3">
      <div
        v-for="stat in [
          { label: 'Evaluaciones', value: evaluaciones.length, icon: 'i-heroicons-clipboard-document-list', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
          { label: 'Última fecha', value: latest ? fShort(latest.fecha) : '—', icon: 'i-heroicons-calendar-days', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { label: 'Resultado', value: latest?.riesgo ?? 'Sin datos', icon: 'i-heroicons-chart-bar', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ]"
        :key="stat.label"
        class="p-3 sm:p-4 text-center rounded-2xl"
        style="background: var(--surface-1); border: 1px solid var(--surface-border)"
      >
        <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto" :style="`background: ${stat.bg}`">
          <UIcon :name="stat.icon" class="text-lg" :style="`color: ${stat.color}`" />
        </div>
        <p class="text-sm font-bold mt-2 truncate" style="color: var(--text-1)">{{ stat.value }}</p>
        <p class="text-xs" style="color: var(--text-3)">{{ stat.label }}</p>
      </div>
    </div>

    <div v-if="!pending && patient" class="grid grid-cols-1 sm:grid-cols-2 gap-4">

      <div class="rounded-2xl overflow-hidden" style="background: var(--surface-1); border: 1px solid var(--surface-border)">
        <div class="px-4 py-3.5 border-b flex items-center gap-2.5" style="border-color: var(--surface-border)">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background: rgba(14,165,233,0.1)">
            <UIcon name="i-heroicons-user" class="text-xs" style="color: #0ea5e9" />
          </div>
          <h3 class="text-sm font-bold" style="color: var(--text-1)">Mis datos</h3>
        </div>
        <div class="p-4 space-y-2.5">
          <div v-for="item in [
            { label: 'Nombre', value: patient.nombre },
            { label: 'Edad', value: `${patient.edad} años` },
            { label: 'Nacimiento', value: fDate(patient.fechaNacimiento) },
            { label: 'Teléfono', value: patient.telefono },
            { label: 'Domicilio', value: patient.domicilio },
          ]" :key="item.label" class="flex justify-between gap-3">
            <span class="text-xs" style="color: var(--text-3)">{{ item.label }}</span>
            <span class="text-xs font-semibold text-right truncate max-w-[60%]" style="color: var(--text-1)">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl overflow-hidden" style="background: var(--surface-1); border: 1px solid var(--surface-border)">
        <div class="px-4 py-3.5 border-b flex items-center gap-2.5" style="border-color: var(--surface-border)">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background: rgba(139,92,246,0.1)">
            <UIcon name="i-heroicons-document-text" class="text-xs" style="color: #8b5cf6" />
          </div>
          <h3 class="text-sm font-bold" style="color: var(--text-1)">Mi cuestionario</h3>
        </div>
        <div v-if="patient.questionnaire" class="p-4 space-y-2.5">
          <div v-for="item in [
            { label: 'Diagnóstico previo', value: patient.questionnaire.diagnosticoPrevio ? 'Sí' : 'No' },
            { label: 'Tipo de diabetes', value: patient.questionnaire.tipoDiabetes ?? '—' },
            { label: 'Años de evolución', value: patient.questionnaire.anosEvolucion ? `${patient.questionnaire.anosEvolucion} años` : '—' },
            { label: 'Pérdida sensibilidad', value: patient.questionnaire.perdidaSensibilidad ? 'Sí' : 'No' },
            { label: 'Plan alimentación', value: patient.questionnaire.planAlimentacion ? 'Sí' : 'No' },
          ]" :key="item.label" class="flex justify-between gap-3">
            <span class="text-xs" style="color: var(--text-3)">{{ item.label }}</span>
            <span
              class="text-xs font-semibold"
              :style="item.value === 'Sí' ? 'color:#f59e0b' : item.value === 'No' ? 'color:var(--text-1)' : 'color:var(--text-2)'"
            >{{ item.value }}</span>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-8 px-4 text-center">
          <UIcon name="i-heroicons-document-text" class="text-2xl mb-2" style="color: var(--text-3)" />
          <p class="text-xs" style="color: var(--text-3)">Sin cuestionario registrado</p>
          <p class="text-xs mt-0.5" style="color: var(--text-3)">Tu médico lo completará en tu cita</p>
        </div>
      </div>
    </div>

    <div
      class="rounded-2xl overflow-hidden"
      style="background: var(--surface-1); border: 1px solid var(--surface-border)"
    >
      <div class="flex items-center gap-3 px-5 py-4 border-b" style="border-color: var(--surface-border)">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center"
             style="background: rgba(14,165,233,0.1)">
          <UIcon name="i-heroicons-clock" class="text-sm" style="color: #0ea5e9" />
        </div>
        <h3 class="font-semibold text-sm" style="color: var(--text-1)">Historial de Evaluaciones</h3>
      </div>

      <div v-if="!pending && evaluaciones.length" class="p-5 space-y-3">
        <NuxtLink
          v-for="ev in evaluaciones"
          :key="ev.id"
          :to="`/paciente/evaluaciones/${ev.id}`"
          class="timeline-item block"
        >
          <div
            class="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group"
            style="background: var(--surface-2); border: 1px solid var(--surface-border)"
          >
            <div class="text-center flex-shrink-0 w-14">
              <p class="text-xl font-extrabold" style="color: var(--text-1)">
                {{ new Date(ev.fecha).getDate() }}
              </p>
              <p class="text-[11px] font-medium uppercase" style="color: var(--text-3)">
                {{ new Date(ev.fecha).toLocaleDateString('es-MX', { month: 'short' }) }}
              </p>
            </div>
            <div class="w-px h-10 flex-shrink-0" style="background: var(--surface-border)" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <RiskBadge :risk="ev.riesgo" size="sm" />
                <span class="text-xs" style="color: var(--text-3)">
                  {{ ev.probabilidad != null ? `${ev.probabilidad.toFixed(1)}% prob.` : '' }}
                </span>
              </div>
              <p class="text-xs mt-1.5" style="color: var(--text-3)">
                Dr. {{ ev.doctor?.nombre }} · {{ fDate(ev.fecha) }}
              </p>
            </div>
            <UIcon
              name="i-heroicons-chevron-right"
              class="text-base flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style="color: #0ea5e9"
            />
          </div>
        </NuxtLink>
      </div>

      <div v-else-if="!pending" class="flex flex-col items-center justify-center py-14">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style="background: var(--surface-2)">
          <UIcon name="i-heroicons-inbox" class="text-2xl" style="color: var(--text-3)" />
        </div>
        <p class="font-semibold text-sm" style="color: var(--text-2)">Sin evaluaciones aún</p>
        <p class="text-xs mt-1" style="color: var(--text-3)">Tu médico realizará la primera evaluación en tu cita</p>
      </div>

      <div v-else class="p-5 space-y-3">
        <div v-for="i in 3" :key="i" class="skeleton-box h-20 rounded-2xl" />
      </div>
    </div>

  </div>
</template>
