<script setup lang="ts">
import { gsap } from 'gsap'

definePageMeta({ layout: 'dashboard', middleware: 'doctor-only' })

const authStore = useAuthStore()
const { data: statsData, pending } = await useFetch('/api/dashboard/stats')
const stats = computed(() => (statsData.value as any)?.data)

const hour = new Date().getHours()
const greeting = computed(() => {
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

const todayStr = new Date().toLocaleDateString('es-MX', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

const kpis = computed(() => [
  {
    label: 'Pacientes',
    value: stats.value?.totalPacientes ?? 0,
    icon: 'i-heroicons-users',
    grad: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
    shadowColor: 'rgba(14,165,233,0.35)',
    accent: '#0ea5e9',
    accentBg: 'rgba(14,165,233,0.08)',
    trend: null,
    trendUp: true,
    sub: 'registrados',
  },
  {
    label: 'Evaluaciones',
    value: stats.value?.totalEvaluaciones ?? 0,
    icon: 'i-heroicons-clipboard-document-check',
    grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    shadowColor: 'rgba(139,92,246,0.35)',
    accent: '#8b5cf6',
    accentBg: 'rgba(139,92,246,0.08)',
    trend: null,
    trendUp: true,
    sub: 'en total',
  },
  {
    label: 'Pendientes',
    value: stats.value?.evaluacionesPendientes ?? 0,
    icon: 'i-heroicons-clock',
    grad: 'linear-gradient(135deg,#f59e0b,#d97706)',
    shadowColor: 'rgba(245,158,11,0.35)',
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.08)',
    trend: null,
    trendUp: false,
    sub: 'sin resultado',
    alert: true,
  },
  {
    label: 'Completadas',
    value: (stats.value?.totalEvaluaciones ?? 0) - (stats.value?.evaluacionesPendientes ?? 0),
    icon: 'i-heroicons-check-badge',
    grad: 'linear-gradient(135deg,#10b981,#059669)',
    shadowColor: 'rgba(16,185,129,0.35)',
    accent: '#10b981',
    accentBg: 'rgba(16,185,129,0.08)',
    trend: null,
    trendUp: true,
    sub: 'con resultado',
  },
])

const riskItems = [
  { label: 'Bajo', key: 'BAJO', color: '#10b981', gradFrom: '#10b981', gradTo: '#059669' },
  { label: 'Medio', key: 'MEDIO', color: '#f59e0b', gradFrom: '#f59e0b', gradTo: '#d97706' },
  { label: 'Alto', key: 'ALTO', color: '#f97316', gradFrom: '#f97316', gradTo: '#ea580c' },
  { label: 'Crítico', key: 'CRITICO', color: '#ef4444', gradFrom: '#ef4444', gradTo: '#dc2626' },
]

const riskCounts = computed(() => {
  const evs: any[] = stats.value?.ultimasEvaluaciones ?? []
  const c: Record<string, number> = { BAJO: 0, MEDIO: 0, ALTO: 0, CRITICO: 0 }
  evs.forEach(e => { if (e.riesgo && c[e.riesgo] !== undefined) c[e.riesgo]++ })
  return c
})

const riskTotal = computed(() => Object.values(riskCounts.value).reduce((a, b) => a + b, 0))

const quickActions = [
  {
    to: '/dashboard/pacientes/nuevo',
    icon: 'i-heroicons-user-plus',
    label: 'Nuevo Paciente',
    sub: 'Registro completo',
    grad: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
    glow: 'rgba(14,165,233,0.25)',
  },
  {
    to: '/dashboard/evaluaciones/nueva',
    icon: 'i-heroicons-camera',
    label: 'Nueva Evaluación',
    sub: 'Análisis térmico + IA',
    grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    glow: 'rgba(139,92,246,0.25)',
  },
  {
    to: '/dashboard/reportes',
    icon: 'i-heroicons-chart-bar-square',
    label: 'Ver Reportes',
    sub: 'Estadísticas clínicas',
    grad: 'linear-gradient(135deg,#10b981,#059669)',
    glow: 'rgba(16,185,129,0.25)',
  },
]

const counters = ref<number[]>([0, 0, 0, 0])

onMounted(() => {
  gsap.from('.hero-banner', { y: -20, opacity: 0, duration: 0.8, ease: 'power3.out' })

  gsap.from('.kpi-card', {
    y: 28, opacity: 0, duration: 0.65, stagger: 0.09, ease: 'power3.out', delay: 0.2,
  })

  gsap.from('.main-panel', {
    y: 20, opacity: 0, duration: 0.65, stagger: 0.12, ease: 'power3.out', delay: 0.5,
  })

  if (stats.value) {
    const vals = kpis.value.map(k => k.value)
    vals.forEach((target, i) => {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: target,
        duration: 1.6,
        ease: 'power2.out',
        delay: 0.3 + i * 0.1,
        onUpdate: () => { counters.value[i] = Math.round(obj.val) },
      })
    })
  }
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function riskPct(key: string) {
  if (!riskTotal.value) return 0
  return Math.round((riskCounts.value[key] / riskTotal.value) * 100)
}

const avatarGrads = [
  'linear-gradient(135deg,#0ea5e9,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
]
</script>

<template>
  <div class="space-y-5 max-w-[1400px]">

    <div
      class="hero-banner relative rounded-3xl overflow-hidden"
      style="background: linear-gradient(135deg,#060d1f 0%,#0c2050 45%,#0d3a7a 100%)"
    >
      <div class="absolute inset-0 pointer-events-none" style="
        background-image: radial-gradient(circle,rgba(56,189,248,0.14) 1px,transparent 1px);
        background-size: 28px 28px;
        mask-image: radial-gradient(ellipse at 40% 50%,black 20%,transparent 75%);
        -webkit-mask-image: radial-gradient(ellipse at 40% 50%,black 20%,transparent 75%);
      " />

      <div class="absolute pointer-events-none" style="width:500px;height:500px;top:50%;left:35%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(14,165,233,0.12) 0%,transparent 65%);filter:blur(30px)" />
      <div class="absolute pointer-events-none" style="width:280px;height:280px;top:-60px;right:10%;background:radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%);filter:blur(40px)" />

      <div class="absolute top-0 right-0 pointer-events-none hidden md:block" style="width:260px;height:260px;transform:translate(35%,-35%)">
        <div class="absolute inset-0 rounded-full" style="border:1.5px solid rgba(239,68,68,0.18);animation:expandRing 4s ease-out infinite" />
        <div class="absolute inset-[18px] rounded-full" style="border:1.5px solid rgba(249,115,22,0.22);animation:expandRing 4s ease-out infinite 0.7s" />
        <div class="absolute inset-[36px] rounded-full" style="border:1.5px solid rgba(234,179,8,0.26);animation:expandRing 4s ease-out infinite 1.4s" />
        <div class="absolute inset-[54px] rounded-full" style="border:1.5px solid rgba(16,185,129,0.3);animation:expandRing 4s ease-out infinite 2.1s" />
        <div class="absolute inset-[80px] rounded-full" style="background:radial-gradient(circle,rgba(14,165,233,0.15) 0%,transparent 70%)" />
      </div>

      <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-6 lg:p-8">
        <div>
          <div class="flex items-center gap-2.5 mb-3">
            <span class="w-2 h-2 rounded-full" style="background:#38bdf8;box-shadow:0 0 8px #38bdf8;animation:pulseGlow 2s infinite" />
            <span class="text-sky-400 text-sm font-semibold tracking-wide">{{ greeting }}, doctor</span>
          </div>

          <h1 class="text-white font-black tracking-tight" style="font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.1">
            {{ authStore.user?.nombre }}
          </h1>
          <p class="text-slate-400 text-sm mt-1.5 capitalize">{{ todayStr }}</p>

          <div v-if="stats" class="flex flex-wrap items-center gap-2 mt-4">
            <div
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style="background:rgba(14,165,233,0.12);color:#38bdf8;border:1px solid rgba(14,165,233,0.2)"
            >
              <UIcon name="i-heroicons-users" class="text-sm" />
              {{ stats.totalPacientes }} pacientes
            </div>
            <div
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style="background:rgba(139,92,246,0.12);color:#a78bfa;border:1px solid rgba(139,92,246,0.2)"
            >
              <UIcon name="i-heroicons-clipboard-document-check" class="text-sm" />
              {{ stats.totalEvaluaciones }} evaluaciones
            </div>
            <div
              v-if="stats.evaluacionesPendientes > 0"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style="background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.25)"
            >
              <UIcon name="i-heroicons-clock" class="text-sm" />
              {{ stats.evaluacionesPendientes }} pendientes
            </div>
          </div>
        </div>

        <NuxtLink to="/dashboard/evaluaciones/nueva" class="flex-shrink-0">
          <button
            class="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-white relative overflow-hidden transition-all duration-300"
            style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);box-shadow:0 8px 30px rgba(14,165,233,0.35)"
            @mouseenter="($event.currentTarget as HTMLElement).style.transform='translateY(-3px)';($event.currentTarget as HTMLElement).style.boxShadow='0 16px 40px rgba(14,165,233,0.45)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.transform='';($event.currentTarget as HTMLElement).style.boxShadow='0 8px 30px rgba(14,165,233,0.35)'"
          >
            <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <UIcon name="i-heroicons-plus-circle" class="text-lg relative z-10" />
            <span class="relative z-10">Nueva evaluación</span>
          </button>
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <template v-if="!pending && stats">
        <div
          v-for="(kpi, i) in kpis"
          :key="kpi.label"
          class="kpi-card relative rounded-2xl p-5 overflow-hidden cursor-default group transition-all duration-300"
          style="background:var(--surface-1);border:1px solid var(--surface-border)"
          @mouseenter="($event.currentTarget as HTMLElement).style.transform='translateY(-4px)';($event.currentTarget as HTMLElement).style.boxShadow=`0 20px 50px ${kpi.shadowColor}, var(--shadow-md)`;($event.currentTarget as HTMLElement).style.borderColor=kpi.accent+'40'"
          @mouseleave="($event.currentTarget as HTMLElement).style.transform='';($event.currentTarget as HTMLElement).style.boxShadow='';($event.currentTarget as HTMLElement).style.borderColor=''"
        >
          <div class="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" :style="`background:${kpi.grad}`" />

          <div v-if="kpi.alert && kpi.value > 0" class="absolute top-3 right-3">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :style="`background:${kpi.accent}`" />
              <span class="relative inline-flex rounded-full h-2.5 w-2.5" :style="`background:${kpi.accent}`" />
            </span>
          </div>

          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
            :style="`background:${kpi.grad};box-shadow:0 6px 20px ${kpi.shadowColor}`"
          >
            <UIcon :name="kpi.icon" class="text-white text-lg" />
          </div>

          <div class="text-3xl font-black tracking-tight" style="color:var(--text-1)">
            {{ counters[i] ?? kpi.value }}
          </div>
          <div class="text-sm font-semibold mt-0.5" style="color:var(--text-2)">{{ kpi.label }}</div>

          <div class="flex items-center justify-between mt-3">
            <span class="text-xs" style="color:var(--text-3)">{{ kpi.sub }}</span>
            <div
              v-if="kpi.trend"
              class="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md"
              :style="kpi.trendUp
                ? 'background:rgba(16,185,129,0.1);color:#10b981'
                : 'background:rgba(239,68,68,0.1);color:#ef4444'"
            >
              <UIcon :name="kpi.trendUp ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'" class="text-xs" />
              {{ kpi.trend }}
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div v-for="i in 4" :key="i" class="skeleton-box h-36 rounded-2xl" />
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <div
        class="main-panel lg:col-span-2 rounded-2xl overflow-hidden"
        style="background:var(--surface-1);border:1px solid var(--surface-border)"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b" style="border-color:var(--surface-border)">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background:rgba(14,165,233,0.1)">
              <UIcon name="i-heroicons-clipboard-document-list" class="text-sm" style="color:#0ea5e9" />
            </div>
            <div>
              <h3 class="text-sm font-bold" style="color:var(--text-1)">Últimas Evaluaciones</h3>
              <p class="text-xs" style="color:var(--text-3)">Actividad reciente</p>
            </div>
          </div>
          <NuxtLink to="/dashboard/evaluaciones">
            <button
              class="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
              style="background:rgba(14,165,233,0.08);color:#0ea5e9"
              @mouseenter="($event.currentTarget as HTMLElement).style.background='rgba(14,165,233,0.15)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='rgba(14,165,233,0.08)'"
            >
              Ver todas
              <UIcon name="i-heroicons-arrow-right" class="text-xs" />
            </button>
          </NuxtLink>
        </div>

        <div v-if="!pending && stats?.ultimasEvaluaciones?.length" class="divide-y" style="border-color:var(--surface-border)">
          <NuxtLink
            v-for="(ev, idx) in stats.ultimasEvaluaciones"
            :key="ev.id"
            :to="`/dashboard/evaluaciones/${ev.id}`"
            class="flex items-center gap-4 px-5 py-4 group cursor-pointer transition-all duration-200"
            style="border-color:var(--surface-border)"
            @mouseenter="($event.currentTarget as HTMLElement).style.background='var(--surface-2)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background=''"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-md"
              :style="avatarGrads[idx % avatarGrads.length]"
            >
              {{ ev.patient?.nombre?.charAt(0) }}
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-semibold truncate" style="color:var(--text-1)">{{ ev.patient?.nombre }}</span>
                <RiskBadge :risk="ev.riesgo" size="sm" />
              </div>
              <div class="flex items-center gap-3 mt-0.5">
                <span class="text-xs" style="color:var(--text-3)">
                  <UIcon name="i-heroicons-user-circle" class="text-xs inline -mt-0.5" />
                  {{ ev.doctor?.nombre }}
                </span>
                <span class="text-xs" style="color:var(--text-3)">·</span>
                <span class="text-xs" style="color:var(--text-3)">{{ formatDate(ev.fecha) }}</span>
              </div>

              <div v-if="ev.probabilidad != null" class="mt-2 flex items-center gap-2">
                <div class="flex-1 h-1 rounded-full overflow-hidden" style="background:var(--surface-3)">
                  <div
                    class="h-full rounded-full transition-all duration-1000"
                    :style="{
                      width: `${ev.probabilidad}%`,
                      background: ev.riesgo === 'CRITICO' ? '#ef4444'
                        : ev.riesgo === 'ALTO' ? '#f97316'
                        : ev.riesgo === 'MEDIO' ? '#f59e0b' : '#10b981',
                    }"
                  />
                </div>
                <span class="text-[10px] font-semibold flex-shrink-0" style="color:var(--text-3)">
                  {{ ev.probabilidad.toFixed(0) }}%
                </span>
              </div>
            </div>

            <div
              class="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
              style="background:rgba(14,165,233,0.1);color:#0ea5e9"
            >
              <UIcon name="i-heroicons-arrow-right" class="text-xs" />
            </div>
          </NuxtLink>
        </div>

        <div v-else-if="!pending" class="flex flex-col items-center justify-center py-16 px-6">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style="background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(6,182,212,0.1))"
          >
            <UIcon name="i-heroicons-clipboard-document-list" class="text-2xl" style="color:#0ea5e9" />
          </div>
          <p class="font-bold text-base" style="color:var(--text-1)">Sin evaluaciones aún</p>
          <p class="text-sm mt-1 text-center" style="color:var(--text-3)">Crea la primera evaluación para ver actividad aquí</p>
          <NuxtLink to="/dashboard/evaluaciones/nueva" class="mt-5">
            <button class="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
              <UIcon name="i-heroicons-plus" />
              Nueva evaluación
            </button>
          </NuxtLink>
        </div>

        <div v-else class="p-5 space-y-3">
          <div v-for="i in 4" :key="i" class="skeleton-box h-16 rounded-xl" />
        </div>
      </div>

      <div class="space-y-4">

        <div
          class="main-panel rounded-2xl overflow-hidden"
          style="background:var(--surface-1);border:1px solid var(--surface-border)"
        >
          <div class="flex items-center gap-3 px-5 py-4 border-b" style="border-color:var(--surface-border)">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background:rgba(139,92,246,0.1)">
              <UIcon name="i-heroicons-bolt" class="text-sm" style="color:#8b5cf6" />
            </div>
            <h3 class="text-sm font-bold" style="color:var(--text-1)">Acciones rápidas</h3>
          </div>
          <div class="p-3 space-y-2">
            <NuxtLink
              v-for="action in quickActions"
              :key="action.to"
              :to="action.to"
              class="group flex items-center gap-3 p-3 rounded-xl transition-all duration-250 relative overflow-hidden"
              style="background:var(--surface-2)"
              @mouseenter="($event.currentTarget as HTMLElement).style.transform='translateY(-2px)';($event.currentTarget as HTMLElement).style.boxShadow=`0 8px 25px ${action.glow}`"
              @mouseleave="($event.currentTarget as HTMLElement).style.transform='';($event.currentTarget as HTMLElement).style.boxShadow=''"
            >
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                :style="`background:${action.grad};box-shadow:0 4px 14px ${action.glow}`"
              >
                <UIcon :name="action.icon" class="text-white text-base" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold" style="color:var(--text-1)">{{ action.label }}</p>
                <p class="text-xs" style="color:var(--text-3)">{{ action.sub }}</p>
              </div>
              <UIcon
                name="i-heroicons-chevron-right"
                class="ml-auto text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style="color:var(--text-3)"
              />
            </NuxtLink>
          </div>
        </div>

        <div
          class="main-panel rounded-2xl overflow-hidden"
          style="background:var(--surface-1);border:1px solid var(--surface-border)"
        >
          <div class="flex items-center gap-3 px-5 py-4 border-b" style="border-color:var(--surface-border)">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background:rgba(239,68,68,0.1)">
              <UIcon name="i-heroicons-chart-bar" class="text-sm" style="color:#ef4444" />
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-bold" style="color:var(--text-1)">Distribución de riesgo</h3>
              <p class="text-xs" style="color:var(--text-3)">Últimas {{ stats?.ultimasEvaluaciones?.length ?? 0 }} evaluaciones</p>
            </div>
          </div>
          <div class="p-5">
            <div v-if="riskTotal > 0" class="space-y-3">
              <div v-for="item in riskItems" :key="item.key">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :style="`background:${item.color}`" />
                    <span class="text-xs font-semibold" style="color:var(--text-2)">{{ item.label }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold" :style="`color:${item.color}`">{{ riskCounts[item.key] }}</span>
                    <span class="text-[10px]" style="color:var(--text-3)">({{ riskPct(item.key) }}%)</span>
                  </div>
                </div>
                <div class="h-2 rounded-full overflow-hidden" style="background:var(--surface-3)">
                  <div
                    class="h-full rounded-full transition-all duration-1000 ease-out"
                    :style="`width:${riskPct(item.key)}%;background:linear-gradient(90deg,${item.gradFrom},${item.gradTo})`"
                  />
                </div>
              </div>
            </div>
            <div v-else-if="!pending" class="flex flex-col items-center justify-center py-6 text-center">
              <UIcon name="i-heroicons-chart-bar" class="text-3xl mb-2" style="color:var(--text-3)" />
              <p class="text-xs" style="color:var(--text-3)">Sin datos de riesgo aún</p>
            </div>
            <div v-else class="space-y-2.5">
              <div v-for="i in 4" :key="i" class="skeleton-box h-5 rounded-lg" />
            </div>
          </div>
        </div>

        <div
          class="main-panel rounded-2xl p-5 relative overflow-hidden"
          style="background:linear-gradient(135deg,#060d1f,#0f2045);border:1px solid rgba(56,189,248,0.12)"
        >
          <div class="absolute inset-0 opacity-[0.04]"
               style="background-image:linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px);background-size:20px 20px" />
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-2 h-2 rounded-full" style="background:#10b981;box-shadow:0 0 6px #10b981" />
              <span class="text-xs font-semibold" style="color:#10b981">Sistema activo</span>
            </div>
            <p class="text-white font-bold text-sm">Diabeterm Evalúa</p>
            <p class="text-slate-400 text-xs mt-0.5">Motor de predicción IA · v1.0</p>
            <div class="mt-4 pt-3 border-t" style="border-color:rgba(255,255,255,0.06)">
              <div class="flex items-center justify-between">
                <span class="text-xs" style="color:#475569">Encriptado TLS 1.3</span>
                <UIcon name="i-heroicons-shield-check" class="text-sm" style="color:#38bdf8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes expandRing {
  0%   { transform: scale(1);    opacity: 0.5; }
  60%  { transform: scale(1.08); opacity: 0.12; }
  100% { transform: scale(1.14); opacity: 0; }
}
@keyframes pulseGlow {
  0%,100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.5); }
  50%      { box-shadow: 0 0 0 6px rgba(56,189,248,0); }
}
</style>
