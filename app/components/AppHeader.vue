<script setup lang="ts">
const emit = defineEmits<{ toggleSidebar: [] }>()

const route = useRoute()
const colorMode = useColorMode()

const breadcrumbs: Record<string, { label: string; icon: string }> = {
  '/dashboard': { label: 'Dashboard', icon: 'i-heroicons-squares-2x2' },
  '/dashboard/pacientes': { label: 'Pacientes', icon: 'i-heroicons-users' },
  '/dashboard/pacientes/nuevo': { label: 'Nuevo Paciente', icon: 'i-heroicons-user-plus' },
  '/dashboard/evaluaciones': { label: 'Evaluaciones', icon: 'i-heroicons-clipboard-document-list' },
  '/dashboard/evaluaciones/nueva': { label: 'Nueva Evaluación', icon: 'i-heroicons-plus-circle' },
  '/dashboard/reportes': { label: 'Reportes', icon: 'i-heroicons-chart-bar-square' },
  '/dashboard/doctores': { label: 'Doctores', icon: 'i-heroicons-user-group' },
  '/paciente': { label: 'Mi Panel', icon: 'i-heroicons-home' },
}

const current = computed(() => breadcrumbs[route.path] || { label: 'Diabeterm Evalúa', icon: 'i-heroicons-heart' })
const isDark = computed(() => colorMode.value === 'dark')

function toggleDark() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <header
    class="flex items-center justify-between px-4 lg:px-6 flex-shrink-0 border-b transition-colors duration-200"
    style="min-height: 64px; background: var(--surface-1); border-color: var(--surface-border)"
  >
    <div class="flex items-center gap-2">
      <button
        class="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
        style="background: var(--surface-2); color: var(--text-2)"
        @click="emit('toggleSidebar')"
      >
        <UIcon name="i-heroicons-bars-3" class="text-lg" />
      </button>

      <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl" style="background: var(--surface-2)">
        <UIcon :name="current.icon" class="text-base" style="color: #0ea5e9" />
        <span class="text-sm font-semibold" style="color: var(--text-1)">{{ current.label }}</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        class="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:scale-105"
        style="background: var(--surface-2); color: var(--text-2)"
        @mouseenter="($event.currentTarget as HTMLElement).style.color = '#0ea5e9'"
        @mouseleave="($event.currentTarget as HTMLElement).style.color = 'var(--text-2)'"
        @click="toggleDark"
      >
        <UIcon
          :name="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
          class="text-base"
        />
      </button>

      <button
        class="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:scale-105"
        style="background: var(--surface-2); color: var(--text-2)"
        @mouseenter="($event.currentTarget as HTMLElement).style.color = '#0ea5e9'"
        @mouseleave="($event.currentTarget as HTMLElement).style.color = 'var(--text-2)'"
      >
        <UIcon name="i-heroicons-bell" class="text-base" />
        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500" />
      </button>
    </div>
  </header>
</template>
