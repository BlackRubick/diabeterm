<script setup lang="ts">
import { gsap } from 'gsap'
import type { Evaluation } from '~/stores/patients'

const props = defineProps<{ evaluation: Evaluation }>()

const riskMap = {
  BAJO:    { label: 'Bajo',    color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)', textClass: 'text-emerald-500', icon: 'i-heroicons-check-circle', gaugePct: 20 },
  MEDIO:   { label: 'Medio',   color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', textClass: 'text-amber-500',   icon: 'i-heroicons-exclamation-triangle', gaugePct: 50 },
  ALTO:    { label: 'Alto',    color: '#f97316', gradient: 'linear-gradient(135deg,#f97316,#ea580c)', textClass: 'text-orange-500',  icon: 'i-heroicons-exclamation-circle', gaugePct: 75 },
  CRITICO: { label: 'Crítico', color: '#ef4444', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', textClass: 'text-red-500',     icon: 'i-heroicons-shield-exclamation', gaugePct: 95 },
}

type RiskKey = keyof typeof riskMap
const risk = computed(() => props.evaluation.riesgo ? (riskMap[props.evaluation.riesgo as RiskKey] ?? null) : null)

const R = 70
const circumference = 2 * Math.PI * R
const dashOffset = computed(() => {
  const pct = risk.value?.gaugePct ?? 0
  return circumference - (circumference * pct) / 100
})

const hallazgos = computed<string[]>(() => {
  try { return JSON.parse(props.evaluation.hallazgos || '[]') } catch { return [] }
})
const recomendaciones = computed<string[]>(() => {
  try { return JSON.parse(props.evaluation.recomendaciones || '[]') } catch { return [] }
})

const displayProb = ref(0)
const gaugeOffset = ref(circumference)

onMounted(() => {
  if (props.evaluation.probabilidad != null) {
    const obj = { v: 0 }
    gsap.to(obj, {
      v: props.evaluation.probabilidad,
      duration: 1.8, ease: 'power2.out', delay: 0.4,
      onUpdate: () => { displayProb.value = Math.round(obj.v) },
    })
  }
  const offsetObj = { d: circumference }
  gsap.to(offsetObj, {
    d: dashOffset.value,
    duration: 2, ease: 'power2.out', delay: 0.3,
    onUpdate: () => { gaugeOffset.value = offsetObj.d },
  })

  gsap.from('.finding-card', { y: 16, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.6 })
  gsap.from('.rec-item', { x: -16, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.8 })
})
</script>

<template>
  <div class="space-y-6">
    <div class="hidden print:block text-center mb-6 pb-4 border-b">
      <h1 class="text-2xl font-bold">Diabeterm Evalúa — Reporte de Evaluación</h1>
      <p class="text-sm text-slate-500 mt-1">{{ evaluation.patient?.nombre }} · {{ new Date(evaluation.fecha).toLocaleDateString('es-MX') }}</p>
    </div>

    <div
      class="rounded-3xl p-8 relative overflow-hidden"
      style="background: var(--surface-1); border: 1px solid var(--surface-border); box-shadow: var(--shadow-md)"
    >
      <div
        v-if="risk"
        class="absolute inset-0 pointer-events-none"
        :style="`background: radial-gradient(circle at 30% 50%, ${risk.color}08 0%, transparent 60%)`"
      />

      <div class="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
        <div class="flex-shrink-0 flex flex-col items-center">
          <div class="relative">
            <svg width="180" height="180" viewBox="0 0 180 180" class="-rotate-90">
              <circle
                cx="90" cy="90" :r="R"
                fill="none"
                style="stroke: var(--surface-3)"
                stroke-width="14"
                stroke-linecap="round"
              />
              <circle
                v-if="risk"
                cx="90" cy="90" :r="R"
                fill="none"
                :stroke="risk.color"
                stroke-width="14"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="gaugeOffset"
                style="transition: stroke-dashoffset 0.1s ease"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center rotate-0">
              <UIcon
                :name="risk?.icon ?? 'i-heroicons-question-mark-circle'"
                class="text-3xl"
                :style="risk ? `color: ${risk.color}` : 'color: var(--text-3)'"
              />
              <span class="text-2xl font-extrabold mt-1" :style="risk ? `color: ${risk.color}` : 'color: var(--text-3)'">
                {{ displayProb }}%
              </span>
              <span class="text-xs font-medium" style="color: var(--text-3)">probabilidad</span>
            </div>
          </div>
          <div
            class="mt-2 px-4 py-1.5 rounded-full text-sm font-bold"
            :style="risk ? `background: ${risk.color}15; color: ${risk.color}` : 'background: var(--surface-2); color: var(--text-3)'"
          >
            Riesgo {{ risk?.label ?? 'Sin evaluar' }}
          </div>
        </div>

        <div class="flex-1 space-y-4">
          <div>
            <h3 class="text-xl font-bold" style="color: var(--text-1)">Resultado del Análisis</h3>
            <p class="text-sm mt-1" style="color: var(--text-2)">
              Basado en análisis termográfico y factores clínicos del paciente
            </p>
          </div>

          <div>
            <div class="flex justify-between text-xs font-medium mb-2">
              <span style="color: var(--text-2)">Índice de riesgo acumulado</span>
              <span :style="risk ? `color: ${risk.color}` : ''">{{ evaluation.probabilidad?.toFixed(1) ?? 0 }}%</span>
            </div>
            <div class="h-3 rounded-full overflow-hidden" style="background: var(--surface-3)">
              <div
                class="h-full rounded-full progress-animated transition-all duration-[2s] ease-out"
                :style="`width: ${evaluation.probabilidad ?? 0}%; ${risk ? risk.gradient : 'background: #94a3b8'}`"
              />
            </div>
            <div class="flex justify-between text-[10px] mt-1.5 font-medium" style="color: var(--text-3)">
              <span>0% — Sin riesgo</span>
              <span>50% — Moderado</span>
              <span>100% — Crítico</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-xl" style="background: var(--surface-2)">
              <p class="text-xs" style="color: var(--text-3)">Paciente</p>
              <p class="text-sm font-semibold mt-0.5" style="color: var(--text-1)">{{ evaluation.patient?.nombre }}</p>
            </div>
            <div class="p-3 rounded-xl" style="background: var(--surface-2)">
              <p class="text-xs" style="color: var(--text-3)">Doctor</p>
              <p class="text-sm font-semibold mt-0.5" style="color: var(--text-1)">{{ evaluation.doctor?.nombre }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="hallazgos.length"
      class="rounded-2xl overflow-hidden"
      style="background: var(--surface-1); border: 1px solid var(--surface-border)"
    >
      <div class="flex items-center gap-3 px-6 py-4 border-b" style="border-color: var(--surface-border)">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center"
             style="background: rgba(14,165,233,0.1)">
          <UIcon name="i-heroicons-magnifying-glass" class="text-sm" style="color: #0ea5e9" />
        </div>
        <h4 class="font-semibold" style="color: var(--text-1)">Hallazgos Termográficos</h4>
      </div>
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="(h, i) in hallazgos"
          :key="i"
          class="finding-card flex items-start gap-3 p-4 rounded-xl"
          style="background: rgba(14,165,233,0.04); border: 1px solid rgba(14,165,233,0.12)"
        >
          <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
               style="background: rgba(14,165,233,0.15)">
            <UIcon name="i-heroicons-arrow-right" class="text-xs" style="color: #0ea5e9" />
          </div>
          <p class="text-sm leading-relaxed" style="color: var(--text-2)">{{ h }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="recomendaciones.length"
      class="rounded-2xl overflow-hidden"
      style="background: var(--surface-1); border: 1px solid var(--surface-border)"
    >
      <div class="flex items-center gap-3 px-6 py-4 border-b" style="border-color: var(--surface-border)">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center"
             style="background: rgba(16,185,129,0.1)">
          <UIcon name="i-heroicons-light-bulb" class="text-sm" style="color: #10b981" />
        </div>
        <h4 class="font-semibold" style="color: var(--text-1)">Recomendaciones Clínicas</h4>
      </div>
      <div class="p-6 space-y-2">
        <div
          v-for="(rec, i) in recomendaciones"
          :key="i"
          class="rec-item flex items-start gap-4 p-3.5 rounded-xl transition-all duration-200 hover:translate-x-1"
          style="background: var(--surface-2)"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style="background: linear-gradient(135deg, #10b981, #059669)"
          >
            {{ i + 1 }}
          </div>
          <p class="text-sm leading-relaxed" style="color: var(--text-2)">{{ rec }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="evaluation.observaciones"
      class="rounded-2xl p-6"
      style="background: var(--surface-1); border: 1px solid var(--surface-border)"
    >
      <div class="flex items-center gap-3 mb-4">
        <UIcon name="i-heroicons-document-text" style="color: var(--text-3)" />
        <h4 class="font-semibold" style="color: var(--text-1)">Observaciones del Doctor</h4>
      </div>
      <p class="text-sm leading-relaxed whitespace-pre-wrap" style="color: var(--text-2)">{{ evaluation.observaciones }}</p>
    </div>
  </div>
</template>
