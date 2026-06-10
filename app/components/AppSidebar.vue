<script setup lang="ts">
const props = defineProps<{ mobileOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

const authStore = useAuthStore()
const route = useRoute()
const collapsed = ref(false)

const doctorLinks = [
  { label: 'Dashboard', icon: 'i-heroicons-squares-2x2', to: '/dashboard' },
  { label: 'Pacientes', icon: 'i-heroicons-users', to: '/dashboard/pacientes' },
  { label: 'Nueva Evaluación', icon: 'i-heroicons-plus-circle', to: '/dashboard/evaluaciones/nueva' },
  { label: 'Evaluaciones', icon: 'i-heroicons-clipboard-document-list', to: '/dashboard/evaluaciones' },
  { label: 'Reportes', icon: 'i-heroicons-chart-bar-square', to: '/dashboard/reportes' },
  { label: 'Doctores', icon: 'i-heroicons-user-group', to: '/dashboard/doctores' },
]
const patientLinks = [
  { label: 'Mi Panel', icon: 'i-heroicons-home', to: '/paciente' },
]
const links = computed(() => authStore.isDoctor ? doctorLinks : patientLinks)

function isActive(to: string) {
  if (to === '/dashboard' || to === '/paciente') return route.path === to
  return route.path.startsWith(to)
}

function handleLinkClick() {
  emit('close')
}

const initials = computed(() => {
  const name = authStore.user?.nombre || ''
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
})
</script>

<template>
  <aside
    class="sidebar-root flex flex-col flex-shrink-0 transition-all duration-300
           fixed inset-y-0 left-0 z-50 w-64
           lg:relative lg:inset-y-auto lg:left-auto lg:z-auto"
    :class="[
      props.mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0',
      collapsed ? 'lg:w-[72px]' : 'lg:w-64',
    ]"
    style="height: 100%"
  >
    <div
      class="flex items-center gap-3 px-4 border-b"
      style="min-height: 64px; border-color: rgba(255,255,255,0.05)"
    >
      <div
        class="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-lg"
        style="background: linear-gradient(135deg, #060d1f, #0f2045)"
      >
        <img :src="'/images/logo.png'" alt="Diabeterm" class="w-full h-full object-contain" />
      </div>
      <div
        class="overflow-hidden transition-all duration-300"
        :class="collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'"
      >
        <p class="text-white font-bold text-sm leading-none whitespace-nowrap">Diabeterm</p>
        <p class="text-xs font-semibold whitespace-nowrap" style="color: #38bdf8">Evalúa</p>
      </div>

      <button
        class="ml-auto lg:hidden flex items-center justify-center w-8 h-8 rounded-lg"
        style="color: #475569"
        @click="emit('close')"
      >
        <UIcon name="i-heroicons-x-mark" class="text-lg" />
      </button>
    </div>

    <div
      class="px-4 pt-5 pb-2 overflow-hidden transition-all duration-300"
      :class="collapsed ? 'lg:h-0 lg:py-0' : ''"
    >
      <p class="text-[10px] font-bold uppercase tracking-[0.12em]" style="color: #334155">
        {{ authStore.isDoctor ? 'Menú principal' : 'Mi cuenta' }}
      </p>
    </div>

    <nav class="flex-1 px-3 space-y-0.5 overflow-y-auto">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="sidebar-item"
        :class="[
          collapsed ? 'lg:justify-center lg:px-0' : '',
          isActive(link.to) ? 'active' : '',
        ]"
        @click="handleLinkClick"
      >
        <UIcon :name="link.icon" class="text-lg flex-shrink-0" />
        <span
          class="overflow-hidden whitespace-nowrap transition-all duration-300"
          :class="collapsed ? 'lg:w-0 lg:opacity-0' : 'flex-1'"
        >{{ link.label }}</span>
      </NuxtLink>
    </nav>

    <div class="p-3 border-t space-y-1" style="border-color: rgba(255,255,255,0.05)">
      <div
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
        :class="collapsed ? 'lg:justify-center lg:px-0' : 'hover:bg-white/5'"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
          style="background: linear-gradient(135deg, #0ea5e9, #8b5cf6)"
        >
          {{ initials }}
        </div>
        <div
          class="min-w-0 overflow-hidden transition-all duration-300"
          :class="collapsed ? 'lg:w-0 lg:opacity-0' : 'flex-1'"
        >
          <p class="text-sm font-medium text-white truncate leading-none">{{ authStore.user?.nombre }}</p>
          <p class="text-[11px] mt-0.5 truncate" style="color: #475569">
            {{ authStore.user?.role === 'DOCTOR' ? 'Doctor' : 'Paciente' }}
          </p>
        </div>
      </div>

      <button
        class="sidebar-item w-full"
        :class="collapsed ? 'lg:justify-center' : ''"
        style="color: #475569"
        @mouseenter="($event.currentTarget as HTMLElement).style.color = '#f87171'; ($event.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'"
        @mouseleave="($event.currentTarget as HTMLElement).style.color = '#475569'; ($event.currentTarget as HTMLElement).style.background = ''"
        @click="authStore.logout()"
      >
        <UIcon name="i-heroicons-arrow-right-on-rectangle" class="text-lg flex-shrink-0" />
        <span
          class="overflow-hidden whitespace-nowrap transition-all duration-300 text-sm"
          :class="collapsed ? 'lg:w-0 lg:opacity-0' : 'flex-1'"
        >Cerrar sesión</span>
      </button>

      <button
        class="sidebar-item w-full hidden lg:flex"
        :class="collapsed ? 'justify-center' : ''"
        @click="collapsed = !collapsed"
      >
        <UIcon
          :name="collapsed ? 'i-heroicons-chevron-double-right' : 'i-heroicons-chevron-double-left'"
          class="text-base flex-shrink-0"
        />
        <span
          class="overflow-hidden whitespace-nowrap transition-all duration-300 text-sm"
          :class="collapsed ? 'w-0 opacity-0' : 'flex-1'"
        >Colapsar</span>
      </button>
    </div>
  </aside>
</template>
