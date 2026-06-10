<script setup lang="ts">
import type { Evaluation } from '~/stores/patients'

definePageMeta({ layout: 'dashboard', middleware: 'doctor-only' })

const route = useRoute()
const id = route.params.id as string

const { data, pending } = await useFetch<{ success: boolean; data: Evaluation }>(`/api/evaluaciones/${id}`)
const evaluation = computed(() => data.value?.data)

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-MX', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function printPage() { window.print() }
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-5">

    <div class="flex items-center gap-3">
      <NuxtLink to="/dashboard/evaluaciones">
        <button
          class="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
          style="background: var(--surface-1); border: 1px solid var(--surface-border); color: var(--text-2)"
        >
          <UIcon name="i-heroicons-arrow-left" class="text-base" />
        </button>
      </NuxtLink>
      <div>
        <h2 class="font-bold text-lg" style="color: var(--text-1)">Detalle de Evaluación</h2>
        <p class="text-xs" style="color: var(--text-3)">Resultado del análisis podológico</p>
      </div>
    </div>

    <div v-if="pending" class="space-y-4">
      <div v-for="i in 3" :key="i" class="skeleton-box h-32 rounded-2xl" />
    </div>

    <template v-else-if="evaluation">

      <div
        class="rounded-2xl overflow-hidden"
        style="background: var(--surface-1); border: 1px solid var(--surface-border)"
      >
        <div class="px-5 py-4 border-b flex items-center gap-3" style="border-color: var(--surface-border)">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: rgba(14,165,233,0.1)">
            <UIcon name="i-heroicons-clipboard-document-check" class="text-sm" style="color: #0ea5e9" />
          </div>
          <h3 class="font-bold text-sm" style="color: var(--text-1)">Información de la Evaluación</h3>
        </div>
        <div class="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="item in [
            { label: 'Paciente', value: evaluation.patient?.nombre, icon: 'i-heroicons-user' },
            { label: 'Doctor', value: evaluation.doctor?.nombre, icon: 'i-heroicons-user-circle' },
            { label: 'Fecha', value: formatDate(evaluation.fecha), icon: 'i-heroicons-calendar-days' },
          ]" :key="item.label" class="space-y-1">
            <div class="flex items-center gap-1.5">
              <UIcon :name="item.icon" class="text-xs" style="color: var(--text-3)" />
              <p class="text-xs" style="color: var(--text-3)">{{ item.label }}</p>
            </div>
            <p class="text-sm font-semibold" style="color: var(--text-1)">{{ item.value }}</p>
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-heroicons-shield-check" class="text-xs" style="color: var(--text-3)" />
              <p class="text-xs" style="color: var(--text-3)">Resultado</p>
            </div>
            <RiskBadge :risk="evaluation.riesgo" size="sm" />
          </div>
        </div>
      </div>

      <div
        v-if="evaluation.thermalImages?.length"
        class="rounded-2xl overflow-hidden"
        style="background: var(--surface-1); border: 1px solid var(--surface-border)"
      >
        <div class="px-5 py-4 border-b flex items-center gap-3" style="border-color: var(--surface-border)">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: rgba(14,165,233,0.1)">
            <UIcon name="i-heroicons-camera" class="text-sm" style="color: #0ea5e9" />
          </div>
          <h3 class="font-bold text-sm" style="color: var(--text-1)">Imágenes Térmicas</h3>
        </div>
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="img in evaluation.thermalImages" :key="img.id" class="space-y-2">
            <p class="text-sm font-semibold" style="color: var(--text-2)">
              Pie {{ img.tipoPie === 'DERECHO' ? 'Derecho' : 'Izquierdo' }}
            </p>
            <img
              :src="img.rutaImagen"
              :alt="`Imagen térmica pie ${img.tipoPie.toLowerCase()}`"
              class="w-full rounded-xl object-cover h-48"
              style="border: 1px solid var(--surface-border)"
            />
          </div>
        </div>
      </div>

      <EvaluationResults :evaluation="evaluation" />

      <div class="flex flex-wrap gap-3 justify-between">
        <NuxtLink :to="`/dashboard/pacientes/${evaluation.patientId}`">
          <button
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style="background: var(--surface-1); border: 1px solid var(--surface-border); color: var(--text-2)"
          >
            <UIcon name="i-heroicons-user" class="text-base" />
            Ver paciente
          </button>
        </NuxtLink>
        <button
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style="background: var(--surface-1); border: 1px solid var(--surface-border); color: var(--text-2)"
          @click="printPage"
        >
          <UIcon name="i-heroicons-printer" class="text-base" />
          Imprimir / PDF
        </button>
      </div>
    </template>

    <div v-else class="flex flex-col items-center justify-center py-24">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style="background: var(--surface-2)">
        <UIcon name="i-heroicons-document-minus" class="text-2xl" style="color: var(--text-3)" />
      </div>
      <p class="font-bold" style="color: var(--text-2)">Evaluación no encontrada</p>
    </div>
  </div>
</template>
