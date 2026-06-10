<script setup lang="ts">
const props = defineProps<{ risk?: string | null; size?: 'sm' | 'md' | 'lg' }>()

const config: Record<string, { label: string; icon: string; style: string }> = {
  BAJO:    { label: 'Bajo',    icon: 'i-heroicons-check-circle',      style: 'background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.2)' },
  MEDIO:   { label: 'Medio',   icon: 'i-heroicons-exclamation-triangle', style: 'background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.2)' },
  ALTO:    { label: 'Alto',    icon: 'i-heroicons-exclamation-circle', style: 'background:rgba(249,115,22,0.1);color:#f97316;border:1px solid rgba(249,115,22,0.2)' },
  CRITICO: { label: 'Crítico', icon: 'i-heroicons-x-circle',          style: 'background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2)' },
}

const c = computed(() => props.risk ? (config[props.risk] ?? null) : null)
const sizeClass = computed(() => props.size === 'lg' ? 'px-3.5 py-1.5 text-sm gap-1.5' : props.size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1')
</script>

<template>
  <span
    v-if="c"
    class="inline-flex items-center font-semibold rounded-full"
    :class="sizeClass"
    :style="c.style"
  >
    <UIcon :name="c.icon" class="text-sm" />
    {{ c.label }}
  </span>
  <span
    v-else
    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full"
    style="background: rgba(148,163,184,0.1); color: #64748b; border: 1px solid rgba(148,163,184,0.2)"
  >
    <UIcon name="i-heroicons-clock" class="text-sm" />
    Pendiente
  </span>
</template>
