<script setup lang="ts">
import { gsap } from 'gsap'

definePageMeta({ layout: 'dashboard', middleware: 'doctor-only' })

const toast = useToast()

const { data, pending, refresh } = await useFetch<{
  success: boolean
  data: {
    doctors: { id: string; nombre: string; email: string; createdAt: string }[]
    isOwner: boolean
  }
}>('/api/doctores')

const doctors = computed(() => data.value?.data.doctors ?? [])
const isOwner = computed(() => data.value?.data.isOwner ?? false)

const showForm = ref(false)
const loading = ref(false)
const form = reactive({ nombre: '', email: '', password: '' })

function resetForm() {
  form.nombre = ''
  form.email = ''
  form.password = ''
  showForm.value = false
}

async function createDoctor() {
  if (!form.nombre || !form.email || !form.password) {
    toast.add({ title: 'Completa todos los campos', color: 'red' })
    return
  }
  if (form.password.length < 6) {
    toast.add({ title: 'La contraseña debe tener al menos 6 caracteres', color: 'red' })
    return
  }
  loading.value = true
  try {
    await $fetch('/api/doctores', {
      method: 'POST',
      body: form,
    })
    toast.add({ title: 'Doctor registrado correctamente', color: 'green' })
    resetForm()
    await refresh()
  }
  catch (err: any) {
    toast.add({
      title: 'Error al registrar',
      description: err?.data?.statusMessage || 'Intenta de nuevo',
      color: 'red',
    })
  }
  finally {
    loading.value = false }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

const avatarGrads = [
  'linear-gradient(135deg,#0ea5e9,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#0ea5e9,#10b981)',
]

onMounted(() => {
  gsap.from('.doctor-card', {
    y: 20, opacity: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out', delay: 0.2,
  })
})
</script>

<template>
  <div class="space-y-5 max-w-4xl">

    <div
      class="relative rounded-3xl overflow-hidden p-6 lg:p-7"
      style="background: linear-gradient(135deg,#060d1f,#0c2050,#0d3a7a)"
    >
      <div class="absolute inset-0 opacity-[0.05]"
           style="background-image:linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px);background-size:28px 28px" />
      <div class="absolute right-0 top-0 w-64 h-64 rounded-full pointer-events-none"
           style="background:radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%);filter:blur(40px);transform:translate(30%,-30%)" />

      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center"
                 style="background:rgba(139,92,246,0.2)">
              <UIcon name="i-heroicons-user-group" class="text-sm" style="color:#a78bfa" />
            </div>
            <span class="text-xs font-semibold" style="color:#a78bfa">Gestión de equipo</span>
          </div>
          <h1 class="text-white font-black text-2xl tracking-tight">Doctores</h1>
          <p class="text-slate-400 text-sm mt-1">
            {{ doctors.length }} {{ doctors.length === 1 ? 'doctor registrado' : 'doctores registrados' }}
          </p>
        </div>

        <button
          v-if="isOwner"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white flex-shrink-0 transition-all duration-300"
          style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);box-shadow:0 8px 25px rgba(139,92,246,0.35)"
          @mouseenter="($event.currentTarget as HTMLElement).style.transform='translateY(-2px)';($event.currentTarget as HTMLElement).style.boxShadow='0 14px 35px rgba(139,92,246,0.45)'"
          @mouseleave="($event.currentTarget as HTMLElement).style.transform='';($event.currentTarget as HTMLElement).style.boxShadow='0 8px 25px rgba(139,92,246,0.35)'"
          @click="showForm = !showForm"
        >
          <UIcon :name="showForm ? 'i-heroicons-x-mark' : 'i-heroicons-user-plus'" class="text-base" />
          {{ showForm ? 'Cancelar' : 'Nuevo Doctor' }}
        </button>
      </div>
    </div>

    <div
      v-if="!isOwner && !pending"
      class="rounded-2xl p-10 flex flex-col items-center text-center"
      style="background:var(--surface-1);border:1px solid var(--surface-border)"
    >
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
           style="background:rgba(245,158,11,0.1)">
        <UIcon name="i-heroicons-lock-closed" class="text-2xl" style="color:#f59e0b" />
      </div>
      <h3 class="font-bold text-base" style="color:var(--text-1)">Acceso restringido</h3>
      <p class="text-sm mt-1.5 max-w-sm" style="color:var(--text-3)">
        Solo el doctor principal puede registrar nuevos doctores en el sistema.
      </p>
    </div>

    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-3"
    >
      <div
        v-if="showForm && isOwner"
        class="rounded-2xl overflow-hidden"
        style="background:var(--surface-1);border:1px solid rgba(139,92,246,0.25);box-shadow:0 0 0 1px rgba(139,92,246,0.1),0 8px 30px rgba(139,92,246,0.08)"
      >
        <div class="flex items-center gap-3 px-5 py-4 border-b" style="border-color:var(--surface-border)">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center"
               style="background:rgba(139,92,246,0.1)">
            <UIcon name="i-heroicons-user-plus" class="text-sm" style="color:#8b5cf6" />
          </div>
          <h3 class="font-bold text-sm" style="color:var(--text-1)">Registrar nuevo doctor</h3>
        </div>

        <div class="p-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style="color:var(--text-3)">
                Nombre completo
              </label>
              <input
                v-model="form.nombre"
                type="text"
                placeholder="Dr. Juan Rodríguez"
                class="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition-all duration-200"
                style="background:var(--surface-2);border:1px solid var(--surface-border);color:var(--text-1)"
                @focus="($event.target as HTMLElement).style.borderColor='rgba(139,92,246,0.5)';($event.target as HTMLElement).style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)'"
                @blur="($event.target as HTMLElement).style.borderColor='var(--surface-border)';($event.target as HTMLElement).style.boxShadow='none'"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style="color:var(--text-3)">
                Correo electrónico
              </label>
              <input
                v-model="form.email"
                type="email"
                placeholder="doctor@ejemplo.com"
                class="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition-all duration-200"
                style="background:var(--surface-2);border:1px solid var(--surface-border);color:var(--text-1)"
                @focus="($event.target as HTMLElement).style.borderColor='rgba(139,92,246,0.5)';($event.target as HTMLElement).style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)'"
                @blur="($event.target as HTMLElement).style.borderColor='var(--surface-border)';($event.target as HTMLElement).style.boxShadow='none'"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style="color:var(--text-3)">
                Contraseña inicial
              </label>
              <input
                v-model="form.password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                class="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition-all duration-200"
                style="background:var(--surface-2);border:1px solid var(--surface-border);color:var(--text-1)"
                @focus="($event.target as HTMLElement).style.borderColor='rgba(139,92,246,0.5)';($event.target as HTMLElement).style.boxShadow='0 0 0 3px rgba(139,92,246,0.1)'"
                @blur="($event.target as HTMLElement).style.borderColor='var(--surface-border)';($event.target as HTMLElement).style.boxShadow='none'"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 mt-5 pt-4 border-t" style="border-color:var(--surface-border)">
            <button
              class="px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200"
              style="background:var(--surface-2);color:var(--text-2)"
              @mouseenter="($event.currentTarget as HTMLElement).style.background='var(--surface-3)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background='var(--surface-2)'"
              @click="resetForm"
            >
              Cancelar
            </button>
            <button
              :disabled="loading"
              class="flex items-center gap-2 px-5 py-2 text-sm rounded-xl font-bold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)"
              @click="createDoctor"
            >
              <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <UIcon v-else name="i-heroicons-check" class="text-base" />
              {{ loading ? 'Guardando...' : 'Registrar doctor' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div
      class="rounded-2xl overflow-hidden"
      style="background:var(--surface-1);border:1px solid var(--surface-border)"
    >
      <div class="flex items-center gap-3 px-5 py-4 border-b" style="border-color:var(--surface-border)">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center"
             style="background:rgba(14,165,233,0.1)">
          <UIcon name="i-heroicons-users" class="text-sm" style="color:#0ea5e9" />
        </div>
        <h3 class="font-bold text-sm" style="color:var(--text-1)">Equipo médico</h3>
      </div>

      <div v-if="!pending && doctors.length" class="divide-y" style="border-color:var(--surface-border)">
        <div
          v-for="(doc, i) in doctors"
          :key="doc.id"
          class="doctor-card flex items-center gap-4 px-5 py-4"
        >
          <div
            class="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-md"
            :style="avatarGrads[i % avatarGrads.length]"
          >
            {{ initials(doc.nombre) }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-semibold" style="color:var(--text-1)">{{ doc.nombre }}</span>
              <span
                v-if="i === 0"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style="background:rgba(14,165,233,0.1);color:#0ea5e9;border:1px solid rgba(14,165,233,0.2)"
              >
                <UIcon name="i-heroicons-star" class="text-[10px]" />
                Principal
              </span>
            </div>
            <p class="text-xs mt-0.5" style="color:var(--text-3)">{{ doc.email }}</p>
          </div>

          <div class="hidden sm:block text-right flex-shrink-0">
            <p class="text-xs" style="color:var(--text-3)">Registrado</p>
            <p class="text-xs font-medium mt-0.5" style="color:var(--text-2)">{{ formatDate(doc.createdAt) }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="!pending" class="flex flex-col items-center justify-center py-14">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
             style="background:var(--surface-2)">
          <UIcon name="i-heroicons-user-group" class="text-2xl" style="color:var(--text-3)" />
        </div>
        <p class="font-semibold" style="color:var(--text-2)">Sin doctores registrados</p>
      </div>

      <div v-else class="p-5 space-y-3">
        <div v-for="i in 3" :key="i" class="skeleton-box h-16 rounded-xl" />
      </div>
    </div>
  </div>
</template>
