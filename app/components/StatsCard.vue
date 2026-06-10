<script setup lang="ts">
import { gsap } from 'gsap'

const props = defineProps<{
  label: string
  value: number | string
  icon: string
  iconBg?: string
  trend?: { value: number; label: string }
  prefix?: string
  suffix?: string
}>()

const displayValue = ref(0)
const cardRef = ref<HTMLElement>()

onMounted(() => {
  if (typeof props.value === 'number') {
    gsap.fromTo(
      { n: 0 },
      { n: 0 },
      {
        n: props.value,
        duration: 1.8,
        ease: 'power2.out',
        delay: 0.2,
        onUpdate() { displayValue.value = Math.round((this as any).targets()[0].n) },
      },
    )
    const obj = { val: 0 }
    gsap.to(obj, {
      val: props.value,
      duration: 1.8,
      ease: 'power2.out',
      delay: 0.3,
      onUpdate: () => { displayValue.value = Math.round(obj.val) },
    })
  }

  if (cardRef.value) {
    gsap.from(cardRef.value, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
    })
  }
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  return displayValue.value.toLocaleString('es-MX')
})
</script>

<template>
  <div
    ref="cardRef"
    class="card-stat p-6 group cursor-default"
  >
    <div class="flex items-start justify-between mb-5">
      <div
        class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110"
        :style="iconBg || 'background: linear-gradient(135deg, #0ea5e9, #06b6d4)'"
      >
        <UIcon :name="icon" class="text-white text-xl" />
      </div>
      <div v-if="trend" class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
           :style="trend.value >= 0 ? 'background: rgba(16,185,129,0.1); color: #10b981' : 'background: rgba(239,68,68,0.1); color: #ef4444'">
        <UIcon :name="trend.value >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'" class="text-sm" />
        {{ Math.abs(trend.value) }}%
      </div>
    </div>

    <div class="mb-1">
      <div class="flex items-baseline gap-0.5">
        <span v-if="prefix" class="text-sm font-medium" style="color: var(--text-3)">{{ prefix }}</span>
        <span class="text-3xl font-extrabold tracking-tight" style="color: var(--text-1)">{{ formattedValue }}</span>
        <span v-if="suffix" class="text-sm font-medium" style="color: var(--text-3)">{{ suffix }}</span>
      </div>
      <p class="text-sm mt-1" style="color: var(--text-2)">{{ label }}</p>
    </div>

    <p v-if="trend" class="text-xs mt-2" style="color: var(--text-3)">{{ trend.label }}</p>

    <div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div class="h-full" style="background: linear-gradient(90deg, #0ea5e9, #06b6d4)" />
    </div>
  </div>
</template>
