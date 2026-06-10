<script setup lang="ts">
import { gsap } from 'gsap'

definePageMeta({ layout: 'dashboard', middleware: 'doctor-only' })

const { data: evalData, pending: evalPending } = await useFetch<{ success: boolean; data: any[] }>('/api/evaluaciones')
const { data: dsData, pending: dsPending } = await useFetch<{ success: boolean; data: any }>('/api/dataset/export')

const evaluaciones = computed(() => evalData.value?.data ?? [])
const dataset = computed(() => dsData.value?.data)
const meta = computed(() => dataset.value?.meta)
const samples = computed(() => dataset.value?.samples ?? [])

const riskItems = [
  { key: 'BAJO',    label: 'Bajo',    color: '#10b981', grad: 'linear-gradient(90deg,#10b981,#059669)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  { key: 'MEDIO',   label: 'Medio',   color: '#f59e0b', grad: 'linear-gradient(90deg,#f59e0b,#d97706)', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  { key: 'ALTO',    label: 'Alto',    color: '#f97316', grad: 'linear-gradient(90deg,#f97316,#ea580c)', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)' },
  { key: 'CRITICO', label: 'Crítico', color: '#ef4444', grad: 'linear-gradient(90deg,#ef4444,#dc2626)', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
]

const total = computed(() => meta.value?.total_samples ?? 0)

function riskPct(key: string) {
  if (!total.value || !meta.value) return 0
  return Math.round(((meta.value.class_distribution[key] ?? 0) / total.value) * 100)
}

const balanceScore = computed(() => {
  if (!meta.value || total.value === 0) return 0
  const counts = Object.values(meta.value.class_distribution) as number[]
  const ideal = total.value / 4
  const deviation = counts.reduce((acc, c) => acc + Math.abs(c - ideal), 0)
  const maxDeviation = ideal * 3 * 2
  return Math.max(0, Math.round((1 - deviation / maxDeviation) * 100))
})

const qualityItems = computed(() => [
  {
    label: 'Con cuestionario completo',
    value: meta.value?.samples_with_questionnaire ?? 0,
    total: total.value,
    color: '#0ea5e9',
    icon: 'i-heroicons-document-text',
  },
  {
    label: 'Con imagen térmica',
    value: meta.value?.samples_with_images ?? 0,
    total: total.value,
    color: '#8b5cf6',
    icon: 'i-heroicons-camera',
  },
  {
    label: 'Con ambos pies',
    value: meta.value?.samples_with_both_images ?? 0,
    total: total.value,
    color: '#10b981',
    icon: 'i-heroicons-photo',
  },
])

const featureStats = computed(() => {
  if (!samples.value.length) return []
  const fields = [
    { key: 'amputaciones',         label: 'Amputaciones previas' },
    { key: 'ulceraEnPie',          label: 'Úlcera en pie' },
    { key: 'ulcerasAnteriores',    label: 'Úlceras anteriores' },
    { key: 'perdidaSensibilidad',  label: 'Pérdida sensibilidad' },
    { key: 'diagnosticoPrevio',    label: 'Dx. previo de diabetes' },
    { key: 'infeccionesPies',      label: 'Infecciones en pies' },
    { key: 'cambiosTemperatura',   label: 'Cambios de temperatura' },
    { key: 'lesionesLentas',       label: 'Lesiones de cicatrización lenta' },
    { key: 'deformidadesPies',     label: 'Deformidades en pies' },
    { key: 'enfermedadesVasculares', label: 'Enf. vasculares' },
    { key: 'hipertension',         label: 'Hipertensión' },
    { key: 'obesidad',             label: 'Obesidad' },
    { key: 'antecedentesFamiliares', label: 'Antecedentes familiares' },
  ]
  const withQ = samples.value.filter(s => s.questionnaire)
  if (!withQ.length) return []
  return fields.map(f => ({
    ...f,
    count: withQ.filter((s: any) => s.questionnaire?.[f.key] === true).length,
    pct: Math.round((withQ.filter((s: any) => s.questionnaire?.[f.key] === true).length / withQ.length) * 100),
  })).sort((a, b) => b.count - a.count)
})

function downloadDataset() {
  if (!dataset.value) return
  const blob = new Blob([JSON.stringify(dataset.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `diabeterm-dataset-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadCSV() {
  if (!samples.value.length) return
  const headers = [
    'id', 'fecha', 'label', 'probability',
    'edad', 'sexo',
    'imagen_izquierdo', 'imagen_derecho',
    'diagnosticoPrevio', 'tipoDiabetes', 'anosEvolucion', 'usoInsulina',
    'antecedentesFamiliares', 'planAlimentacion',
    'ulceraEnPie', 'cambiosTemperatura',
    'frecuenciaEjercicio', 'tipoCalzado',
    'perdidaSensibilidad', 'amputaciones', 'infeccionesPies', 'lesionesLentas',
    'hipertension', 'dislipidemia', 'obesidad', 'enfermedadesVasculares',
    'ulcerasAnteriores', 'deformidadesPies',
  ]
  const rows = samples.value.map((s: any) => [
    s.id, s.fecha, s.label, s.probability,
    s.patient.edad, s.patient.sexo,
    s.images.izquierdo ?? '', s.images.derecho ?? '',
    ...(s.questionnaire ? [
      s.questionnaire.diagnosticoPrevio, s.questionnaire.tipoDiabetes ?? '',
      s.questionnaire.anosEvolucion ?? '', s.questionnaire.usoInsulina,
      s.questionnaire.antecedentesFamiliares, s.questionnaire.planAlimentacion,
      s.questionnaire.ulceraEnPie, s.questionnaire.cambiosTemperatura,
      s.questionnaire.frecuenciaEjercicio ?? '', s.questionnaire.tipoCalzado ?? '',
      s.questionnaire.perdidaSensibilidad, s.questionnaire.amputaciones,
      s.questionnaire.infeccionesPies, s.questionnaire.lesionesLentas,
      s.questionnaire.hipertension, s.questionnaire.dislipidemia,
      s.questionnaire.obesidad, s.questionnaire.enfermedadesVasculares,
      s.questionnaire.ulcerasAnteriores, s.questionnaire.deformidadesPies,
    ] : Array(20).fill('')),
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `diabeterm-dataset-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  gsap.from('.stat-card', { y: 16, opacity: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out', delay: 0.2 })
  gsap.from('.feature-row', { x: -12, opacity: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out', delay: 0.5 })
})
</script>

<template>
  <div class="space-y-5 max-w-6xl">

    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div>
        <h2 class="font-black text-xl" style="color: var(--text-1)">Dataset y Reportes</h2>
        <p class="text-sm mt-0.5" style="color: var(--text-3)">Estadísticas clínicas y exportación de datos para entrenamiento del modelo</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          :disabled="!total"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style="background: var(--surface-1); border: 1px solid var(--surface-border); color: var(--text-2)"
          @click="downloadCSV"
        >
          <UIcon name="i-heroicons-table-cells" class="text-base" />
          CSV
        </button>
        <button
          :disabled="!total"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style="background: linear-gradient(135deg,#8b5cf6,#6d28d9); box-shadow: 0 4px 16px rgba(139,92,246,0.3)"
          @click="downloadDataset"
        >
          <UIcon name="i-heroicons-arrow-down-tray" class="text-base" />
          JSON Dataset
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="item in [
          { label: 'Muestras totales', value: meta?.total_samples ?? 0, icon: 'i-heroicons-circle-stack', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', grad: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' },
          { label: 'Con cuestionario', value: meta?.samples_with_questionnaire ?? 0, icon: 'i-heroicons-document-text', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
          { label: 'Con imágenes', value: meta?.samples_with_images ?? 0, icon: 'i-heroicons-camera', color: '#10b981', bg: 'rgba(16,185,129,0.1)', grad: 'linear-gradient(135deg,#10b981,#059669)' },
          { label: 'Ambos pies', value: meta?.samples_with_both_images ?? 0, icon: 'i-heroicons-photo', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', grad: 'linear-gradient(135deg,#f59e0b,#d97706)' },
        ]"
        :key="item.label"
        class="stat-card rounded-2xl p-4"
        style="background: var(--surface-1); border: 1px solid var(--surface-border)"
      >
        <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3" :style="`background: ${item.grad}`">
          <UIcon :name="item.icon" class="text-white text-lg" />
        </div>
        <p class="text-2xl font-black" style="color: var(--text-1)">{{ item.value }}</p>
        <p class="text-xs mt-0.5" style="color: var(--text-3)">{{ item.label }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

      <div class="rounded-2xl overflow-hidden" style="background: var(--surface-1); border: 1px solid var(--surface-border)">
        <div class="px-5 py-4 border-b flex items-center gap-3" style="border-color: var(--surface-border)">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: rgba(14,165,233,0.1)">
            <UIcon name="i-heroicons-chart-bar" class="text-sm" style="color: #0ea5e9" />
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-bold" style="color: var(--text-1)">Distribución de clases</h3>
            <p class="text-xs" style="color: var(--text-3)">Balance del dataset para entrenamiento</p>
          </div>
          <div
            v-if="total > 0"
            class="text-xs font-bold px-2.5 py-1 rounded-full"
            :style="balanceScore >= 70 ? 'background:rgba(16,185,129,0.1);color:#10b981' : balanceScore >= 40 ? 'background:rgba(245,158,11,0.1);color:#f59e0b' : 'background:rgba(239,68,68,0.1);color:#ef4444'"
          >
            Balance {{ balanceScore }}%
          </div>
        </div>
        <div class="p-5 space-y-4">
          <div v-if="!dsPending && total > 0">
            <div v-for="item in riskItems" :key="item.key" class="space-y-1.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :style="`background: ${item.color}`" />
                  <span class="text-sm font-semibold" style="color: var(--text-2)">{{ item.label }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold" :style="`color: ${item.color}`">
                    {{ meta?.class_distribution[item.key] ?? 0 }}
                  </span>
                  <span class="text-xs" style="color: var(--text-3)">({{ riskPct(item.key) }}%)</span>
                </div>
              </div>
              <div class="h-2.5 rounded-full overflow-hidden" style="background: var(--surface-3)">
                <div
                  class="h-full rounded-full transition-all duration-1000 ease-out"
                  :style="`width: ${riskPct(item.key)}%; background: ${item.grad}`"
                />
              </div>
            </div>

            <div
              v-if="balanceScore < 60"
              class="mt-4 flex items-start gap-2.5 p-3 rounded-xl"
              style="background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.15)"
            >
              <UIcon name="i-heroicons-exclamation-triangle" class="text-sm flex-shrink-0 mt-0.5" style="color: #f59e0b" />
              <p class="text-xs" style="color: var(--text-2)">
                El dataset está desbalanceado. Para un mejor modelo se recomienda recolectar más muestras de las clases con menos datos.
              </p>
            </div>
          </div>
          <div v-else-if="!dsPending" class="flex flex-col items-center justify-center py-8">
            <UIcon name="i-heroicons-chart-bar" class="text-3xl mb-2" style="color: var(--text-3)" />
            <p class="text-xs" style="color: var(--text-3)">Sin datos aún</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="i in 4" :key="i" class="skeleton-box h-6 rounded-lg" />
          </div>
        </div>
      </div>

      <div class="rounded-2xl overflow-hidden" style="background: var(--surface-1); border: 1px solid var(--surface-border)">
        <div class="px-5 py-4 border-b flex items-center gap-3" style="border-color: var(--surface-border)">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: rgba(16,185,129,0.1)">
            <UIcon name="i-heroicons-shield-check" class="text-sm" style="color: #10b981" />
          </div>
          <div>
            <h3 class="text-sm font-bold" style="color: var(--text-1)">Calidad del dataset</h3>
            <p class="text-xs" style="color: var(--text-3)">Completitud de los datos por muestra</p>
          </div>
        </div>
        <div class="p-5 space-y-5">
          <div v-for="q in qualityItems" :key="q.label">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <UIcon :name="q.icon" class="text-sm" :style="`color: ${q.color}`" />
                <span class="text-sm" style="color: var(--text-2)">{{ q.label }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-bold" :style="`color: ${q.color}`">{{ q.value }}</span>
                <span class="text-xs" style="color: var(--text-3)">/ {{ q.total }}</span>
              </div>
            </div>
            <div class="h-2.5 rounded-full overflow-hidden" style="background: var(--surface-3)">
              <div
                class="h-full rounded-full transition-all duration-1000"
                :style="`width: ${q.total ? Math.round((q.value / q.total) * 100) : 0}%; background: ${q.color}`"
              />
            </div>
            <p class="text-[11px] mt-1 text-right" style="color: var(--text-3)">
              {{ q.total ? Math.round((q.value / q.total) * 100) : 0 }}% completitud
            </p>
          </div>

          <div class="flex items-start gap-2.5 p-3 rounded-xl" style="background: rgba(14,165,233,0.05); border: 1px solid rgba(14,165,233,0.12)">
            <UIcon name="i-heroicons-light-bulb" class="text-sm flex-shrink-0 mt-0.5" style="color: #0ea5e9" />
            <p class="text-xs" style="color: var(--text-2)">
              Para el modelo de visión, cada muestra necesita <strong style="color: var(--text-1)">ambas imágenes térmicas</strong> etiquetadas con el nivel de riesgo confirmado.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl overflow-hidden" style="background: var(--surface-1); border: 1px solid var(--surface-border)">
      <div class="px-5 py-4 border-b flex items-center gap-3" style="border-color: var(--surface-border)">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: rgba(239,68,68,0.1)">
          <UIcon name="i-heroicons-variable" class="text-sm" style="color: #ef4444" />
        </div>
        <div>
          <h3 class="text-sm font-bold" style="color: var(--text-1)">Frecuencia de factores de riesgo</h3>
          <p class="text-xs" style="color: var(--text-3)">Prevalencia de cada variable clínica en el dataset</p>
        </div>
      </div>
      <div class="p-5">
        <div v-if="featureStats.length" class="space-y-2.5">
          <div v-for="f in featureStats" :key="f.key" class="feature-row flex items-center gap-3">
            <span class="text-xs w-52 flex-shrink-0 truncate" style="color: var(--text-2)">{{ f.label }}</span>
            <div class="flex-1 h-2 rounded-full overflow-hidden" style="background: var(--surface-3)">
              <div
                class="h-full rounded-full"
                :style="`width: ${f.pct}%; background: ${f.pct > 60 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : f.pct > 30 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#0ea5e9,#06b6d4)'}`"
              />
            </div>
            <div class="flex items-center gap-1.5 w-20 flex-shrink-0 justify-end">
              <span class="text-xs font-bold" style="color: var(--text-1)">{{ f.count }}</span>
              <span class="text-[10px]" style="color: var(--text-3)">({{ f.pct }}%)</span>
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-10">
          <UIcon name="i-heroicons-variable" class="text-3xl mb-2" style="color: var(--text-3)" />
          <p class="text-xs" style="color: var(--text-3)">Se mostrará cuando haya muestras con cuestionario</p>
        </div>
      </div>
    </div>

    <div
      class="rounded-2xl p-5 relative overflow-hidden"
      style="background: linear-gradient(135deg,#060d1f,#1e0a3c); border: 1px solid rgba(139,92,246,0.2)"
    >
      <div class="absolute inset-0 opacity-[0.04]"
           style="background-image:linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px);background-size:24px 24px" />
      <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <UIcon name="i-heroicons-cpu-chip" class="text-base" style="color: #a78bfa" />
            <h3 class="text-white font-bold text-sm">Exportar para entrenamiento ML</h3>
          </div>
          <p class="text-xs" style="color: rgba(255,255,255,0.45)">
            El JSON incluye todas las muestras con etiqueta de riesgo, cuestionario completo y URLs de imágenes térmicas.
            El CSV incluye solo features tabulares sin imágenes.
          </p>
          <div class="flex flex-wrap gap-2 mt-3">
            <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" style="background:rgba(139,92,246,0.15);color:#a78bfa">{{ meta?.total_samples ?? 0 }} muestras</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" style="background:rgba(14,165,233,0.15);color:#38bdf8">{{ meta?.samples_with_both_images ?? 0 }} con imágenes</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" style="background:rgba(16,185,129,0.15);color:#34d399">28 features clínicas</span>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            :disabled="!total"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.8)"
            @click="downloadCSV"
          >
            <UIcon name="i-heroicons-table-cells" class="text-base" />
            CSV
          </button>
          <button
            :disabled="!total"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);box-shadow:0 4px 20px rgba(139,92,246,0.4)"
            @click="downloadDataset"
          >
            <UIcon name="i-heroicons-arrow-down-tray" class="text-base" />
            JSON
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
