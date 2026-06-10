<script setup lang="ts">
import type { Evaluation } from '~/stores/patients'

definePageMeta({ layout: 'dashboard', middleware: 'doctor-only' })

const { data, pending } = await useFetch<{ success: boolean; data: Evaluation[] }>('/api/evaluaciones')
const evaluaciones = computed(() => data.value?.data ?? [])

const search = ref('')
const filtered = computed(() =>
  evaluaciones.value.filter(e =>
    e.patient?.nombre.toLowerCase().includes(search.value.toLowerCase()) ||
    e.doctor?.nombre.toLowerCase().includes(search.value.toLowerCase())
  )
)

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const avatarGrads = [
  'linear-gradient(135deg,#0ea5e9,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
</script>

<template>
  <div class="space-y-4 max-w-7xl">

    <div
      class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 rounded-2xl"
      style="background: var(--surface-1); border: 1px solid var(--surface-border)"
    >
      <div class="flex items-center gap-3 flex-1">
        <div class="relative flex-1 max-w-sm">
          <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style="color: var(--text-3)" />
          <input
            v-model="search"
            placeholder="Buscar por paciente o doctor..."
            class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl transition-all duration-200"
            style="background: var(--surface-2); border: 1px solid var(--surface-border); color: var(--text-1); outline: none"
            @focus="($event.target as HTMLInputElement).style.borderColor='#0ea5e9';($event.target as HTMLInputElement).style.boxShadow='0 0 0 3px rgba(14,165,233,0.12)'"
            @blur="($event.target as HTMLInputElement).style.borderColor='var(--surface-border)';($event.target as HTMLInputElement).style.boxShadow='none'"
          />
        </div>
        <span class="text-sm" style="color: var(--text-3)">{{ filtered.length }} evaluaciones</span>
      </div>
      <NuxtLink to="/dashboard/evaluaciones/nueva">
        <button class="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold">
          <UIcon name="i-heroicons-plus-circle" class="text-base" />
          Nueva Evaluación
        </button>
      </NuxtLink>
    </div>

    <div
      class="rounded-2xl overflow-hidden"
      style="background: var(--surface-1); border: 1px solid var(--surface-border)"
    >
      <div v-if="!pending && filtered.length" class="overflow-x-auto">
        <table class="w-full table-premium">
          <thead>
            <tr style="border-bottom: 1px solid var(--surface-border); background: var(--surface-2)">
              <th class="text-left px-6 py-3.5 text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Paciente</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Fecha</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider hidden md:table-cell" style="color: var(--text-3)">Doctor</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Riesgo</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider hidden lg:table-cell" style="color: var(--text-3)">Probabilidad</th>
              <th class="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(ev, i) in filtered"
              :key="ev.id"
              class="group"
              style="border-bottom: 1px solid var(--surface-border)"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    :style="avatarGrads[i % avatarGrads.length]"
                  >
                    {{ initials(ev.patient?.nombre ?? '?') }}
                  </div>
                  <span class="text-sm font-semibold" style="color: var(--text-1)">{{ ev.patient?.nombre }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-sm" style="color: var(--text-2)">{{ formatDate(ev.fecha) }}</td>
              <td class="px-4 py-4 text-sm hidden md:table-cell" style="color: var(--text-2)">{{ ev.doctor?.nombre }}</td>
              <td class="px-4 py-4">
                <RiskBadge :risk="ev.riesgo" size="sm" />
              </td>
              <td class="px-4 py-4 hidden lg:table-cell">
                <span class="text-sm font-semibold" style="color: var(--text-2)">
                  {{ ev.probabilidad != null ? `${ev.probabilidad.toFixed(1)}%` : '—' }}
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <NuxtLink :to="`/dashboard/evaluaciones/${ev.id}`">
                    <button
                      class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all duration-150"
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

      <div v-else-if="!pending" class="flex flex-col items-center justify-center py-20">
        <div class="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
             style="background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(14,165,233,0.1))">
          <UIcon name="i-heroicons-clipboard-document-list" class="text-3xl" style="color: #8b5cf6" />
        </div>
        <h3 class="font-bold text-lg" style="color: var(--text-1)">
          {{ search ? 'Sin resultados' : 'Sin evaluaciones registradas' }}
        </h3>
        <p class="text-sm mt-1.5" style="color: var(--text-3)">
          {{ search ? `No hay coincidencias para "${search}"` : 'Crea la primera evaluación para comenzar' }}
        </p>
        <NuxtLink v-if="!search" to="/dashboard/evaluaciones/nueva" class="mt-5">
          <button class="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
            <UIcon name="i-heroicons-plus-circle" />
            Nueva evaluación
          </button>
        </NuxtLink>
      </div>

      <div v-else class="p-6 space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton-box h-16 rounded-xl" />
      </div>
    </div>
  </div>
</template>
