<script setup lang="ts">
import { gsap } from 'gsap'
import type { Patient } from '~/stores/patients'

definePageMeta({ layout: 'dashboard', middleware: 'doctor-only' })

const { data, pending } = await useFetch<{ success: boolean; data: Patient[] }>('/api/pacientes')
const patients = computed(() => data.value?.data ?? [])

const search = ref('')
const filtered = computed(() =>
  patients.value.filter(p =>
    p.nombre.toLowerCase().includes(search.value.toLowerCase())
    || p.telefono.includes(search.value)
    || p.user?.email?.toLowerCase().includes(search.value.toLowerCase()),
  ),
)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const avatarGradients = [
  'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #0ea5e9, #10b981)',
]

function avatarGrad(i: number) { return avatarGradients[i % avatarGradients.length]! }

onMounted(() => {
  gsap.from('.patient-row', { y: 12, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.2 })
})
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
            placeholder="Buscar paciente, email o teléfono..."
            class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl transition-all duration-200"
            style="background: var(--surface-2); border: 1px solid var(--surface-border); color: var(--text-1); outline: none"
            @focus="($event.target as HTMLInputElement).style.borderColor = '#0ea5e9'; ($event.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(14,165,233,0.12)'"
            @blur="($event.target as HTMLInputElement).style.borderColor = 'var(--surface-border)'; ($event.target as HTMLInputElement).style.boxShadow = 'none'"
          />
        </div>
        <span class="text-sm" style="color: var(--text-3)">{{ filtered.length }} pacientes</span>
      </div>
      <NuxtLink to="/dashboard/pacientes/nuevo">
        <button class="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold">
          <UIcon name="i-heroicons-user-plus" class="text-base" />
          Nuevo Paciente
        </button>
      </NuxtLink>
    </div>

    <div
      class="rounded-2xl overflow-hidden"
      style="background: var(--surface-1); border: 1px solid var(--surface-border); box-shadow: var(--shadow-sm)"
    >
      <div v-if="!pending && filtered.length" class="overflow-x-auto">
        <table class="w-full table-premium">
          <thead>
            <tr style="border-bottom: 1px solid var(--surface-border); background: var(--surface-2)">
              <th class="text-left px-6 py-3.5 text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Paciente</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider hidden sm:table-cell" style="color: var(--text-3)">Contacto</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider hidden lg:table-cell" style="color: var(--text-3)">Edad / Sexo</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider" style="color: var(--text-3)">Último riesgo</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider hidden xl:table-cell" style="color: var(--text-3)">Registrado</th>
              <th class="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(patient, i) in filtered"
              :key="patient.id"
              class="patient-row group"
              style="border-bottom: 1px solid var(--surface-border)"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    :style="avatarGrad(i)"
                  >
                    {{ initials(patient.nombre) }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold" style="color: var(--text-1)">{{ patient.nombre }}</p>
                    <p class="text-xs" style="color: var(--text-3)">{{ patient.user?.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 hidden sm:table-cell">
                <p class="text-sm" style="color: var(--text-2)">{{ patient.telefono }}</p>
              </td>
              <td class="px-4 py-4 hidden lg:table-cell">
                <span class="text-sm" style="color: var(--text-2)">{{ patient.edad }} años</span>
                <span class="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                      :style="patient.sexo === 'MASCULINO' ? 'background:rgba(14,165,233,0.1);color:#0ea5e9' : 'background:rgba(236,72,153,0.1);color:#ec4899'">
                  {{ patient.sexo === 'MASCULINO' ? 'M' : 'F' }}
                </span>
              </td>
              <td class="px-4 py-4">
                <RiskBadge :risk="patient.evaluations?.[0]?.riesgo" size="sm" />
              </td>
              <td class="px-4 py-4 hidden xl:table-cell">
                <p class="text-xs" style="color: var(--text-3)">{{ formatDate(patient.createdAt) }}</p>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <NuxtLink :to="`/dashboard/evaluaciones/nueva?patientId=${patient.id}`">
                    <button
                      class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all duration-150"
                      style="background: rgba(14,165,233,0.1); color: #0ea5e9"
                      title="Nueva evaluación"
                    >
                      <UIcon name="i-heroicons-plus" />
                    </button>
                  </NuxtLink>
                  <NuxtLink :to="`/dashboard/pacientes/${patient.id}`">
                    <button
                      class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all duration-150"
                      style="background: var(--surface-2); color: var(--text-2)"
                    >
                      <UIcon name="i-heroicons-eye" />
                    </button>
                  </NuxtLink>
                  <NuxtLink :to="`/dashboard/pacientes/${patient.id}/editar`">
                    <button
                      class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all duration-150"
                      style="background: var(--surface-2); color: var(--text-2)"
                    >
                      <UIcon name="i-heroicons-pencil-square" />
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
             style="background: linear-gradient(135deg, rgba(14,165,233,0.1), rgba(6,182,212,0.1))">
          <UIcon name="i-heroicons-users" class="text-3xl" style="color: #0ea5e9" />
        </div>
        <h3 class="font-bold text-lg" style="color: var(--text-1)">
          {{ search ? 'Sin resultados' : 'Sin pacientes registrados' }}
        </h3>
        <p class="text-sm mt-1.5" style="color: var(--text-3)">
          {{ search ? `No hay coincidencias para "${search}"` : 'Registra el primer paciente para comenzar' }}
        </p>
        <NuxtLink v-if="!search" to="/dashboard/pacientes/nuevo" class="mt-5">
          <button class="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
            <UIcon name="i-heroicons-user-plus" />
            Registrar primer paciente
          </button>
        </NuxtLink>
      </div>

      <div v-else class="p-6 space-y-3">
        <div v-for="i in 6" :key="i" class="skeleton-box h-16 rounded-xl" />
      </div>
    </div>
  </div>
</template>
