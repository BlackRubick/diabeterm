<script setup lang="ts">
import { gsap } from 'gsap'

definePageMeta({
  layout: 'auth',
  middleware: [
    function () {
      const authStore = useAuthStore()
      if (authStore.isAuthenticated) {
        return navigateTo(authStore.isDoctor ? '/dashboard' : '/paciente')
      }
    },
  ],
})

const authStore = useAuthStore()
const toast = useToast()

const state = reactive({ email: '', password: '' })
const loading = ref(false)
const showPass = ref(false)


onMounted(() => {
  gsap.fromTo('.logo-wrap',
    { scale: 0.6, opacity: 0 },
    { scale: 1, opacity: 1, duration: 1.1, ease: 'back.out(1.6)', delay: 0.1 },
  )
  gsap.fromTo('.ring',
    { scale: 0.4, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.5 },
  )
  gsap.fromTo('.brand-text',
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.8 },
  )
  gsap.fromTo('.stat-pill',
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.7)', stagger: 0.1, delay: 1.0 },
  )
  gsap.fromTo('.form-card',
    { x: 40, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.2 },
  )
  gsap.fromTo('.f-row',
    { y: 16, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.08, delay: 0.7 },
  )
})

async function onSubmit() {
  if (!state.email || !state.password) {
    toast.add({ title: 'Completa todos los campos', color: 'red' })
    return
  }
  loading.value = true
  try {
    const { data } = await $fetch<{ success: boolean; data: { user: any } }>('/api/auth/login', {
      method: 'POST',
      body: state,
    })
    authStore.setUser(data.user)
    await navigateTo(data.user.role === 'DOCTOR' ? '/dashboard' : '/paciente')
  }
  catch (err: any) {
    toast.add({
      title: 'Credenciales incorrectas',
      description: err?.data?.statusMessage || 'Revisa tu correo y contraseña',
      color: 'red',
    })
    gsap.to('.form-card', { keyframes: [{ x: -10 }, { x: 10 }, { x: -7 }, { x: 7 }, { x: 0 }], duration: 0.4 })
  }
  finally { loading.value = false }
}
</script>

<template>
  <div class="login-root min-h-screen flex overflow-hidden">

    <div
      class="hidden lg:flex flex-col items-center justify-center relative overflow-hidden"
      style="width: 58%; background: radial-gradient(ellipse at 60% 40%, #0c2a5e 0%, #060f24 50%, #020811 100%)"
    >
      <div class="absolute inset-0 pointer-events-none" style="
        background-image: radial-gradient(circle, rgba(56,189,248,0.18) 1px, transparent 1px);
        background-size: 32px 32px;
        mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
        -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
      " />

      <div class="absolute pointer-events-none" style="width:600px;height:600px;top:50%;left:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(14,165,233,0.12) 0%,transparent 65%);filter:blur(20px)" />
      <div class="absolute pointer-events-none" style="width:300px;height:300px;top:15%;right:5%;background:radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%);filter:blur(30px)" />
      <div class="absolute pointer-events-none" style="width:250px;height:250px;bottom:10%;left:8%;background:radial-gradient(circle,rgba(6,182,212,0.07) 0%,transparent 70%);filter:blur(30px)" />

      <div class="relative z-10 flex flex-col items-center text-center px-12">

        <div class="logo-wrap relative flex items-center justify-center mb-10" style="width:300px;height:300px">

          <div class="ring absolute rounded-full" style="width:290px;height:290px;border:1.5px solid rgba(239,68,68,0.18);animation:expandRing 4s ease-out infinite" />
          <div class="ring absolute rounded-full" style="width:255px;height:255px;border:1.5px solid rgba(249,115,22,0.22);animation:expandRing 4s ease-out infinite 0.6s" />
          <div class="ring absolute rounded-full" style="width:220px;height:220px;border:1.5px solid rgba(234,179,8,0.28);animation:expandRing 4s ease-out infinite 1.2s" />
          <div class="ring absolute rounded-full" style="width:185px;height:185px;border:1.5px solid rgba(16,185,129,0.32);animation:expandRing 4s ease-out infinite 1.8s" />

          <div class="absolute rounded-full" style="width:170px;height:170px;background:radial-gradient(circle,rgba(14,165,233,0.22) 0%,transparent 70%);filter:blur(16px)" />

          <div class="relative rounded-3xl overflow-hidden shadow-2xl"
               style="width:160px;height:160px;background:linear-gradient(135deg,#060d1f,#0a1a3e);border:1px solid rgba(56,189,248,0.15)">
            <img :src="'/images/logo.png'" alt="Diabeterm" class="w-full h-full object-cover" />
            <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(135deg,rgba(255,255,255,0.05) 0%,transparent 50%)" />
          </div>
        </div>

        <div class="brand-text">
          <h1 class="font-black leading-none tracking-tight" style="font-size:3.2rem;color:#f0f9ff;letter-spacing:-0.03em">
            Diabeterm <span style="background:linear-gradient(135deg,#38bdf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Evalúa</span>
          </h1>
          <p class="mt-3 text-lg leading-relaxed max-w-sm mx-auto" style="color:#475569">
            Preclasificación de pie diabético mediante<br>termografía e inteligencia artificial
          </p>

          <div class="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full" style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.2)">
            <div class="w-2 h-2 rounded-full" style="background:#38bdf8;box-shadow:0 0 8px #38bdf8;animation:pulseGlow 2s infinite" />
            <span class="text-sm font-semibold" style="color:#38bdf8">IA Médica · Termografía Avanzada</span>
          </div>
        </div>

      </div>

      <p class="absolute bottom-6 text-xs" style="color:#1e3a5f">
        © 2026 Diabeterm Evalúa — Sistema de diagnóstico médico
      </p>
    </div>

    <div
      class="flex-1 flex items-center justify-center p-6 lg:p-10"
      style="background:#04080f"
    >
      <div class="w-full max-w-[400px]">

        <div class="lg:hidden flex flex-col items-center mb-8">
          <div class="w-28 h-28 rounded-3xl overflow-hidden mb-4 shadow-2xl"
               style="background:linear-gradient(135deg,#060d1f,#0a1a3e);border:1px solid rgba(56,189,248,0.15)">
            <img :src="'/images/logo.png'" alt="Diabeterm" class="w-full h-full object-cover" />
          </div>
          <h2 class="text-2xl font-black" style="color:#f0f9ff">Diabeterm Evalúa</h2>
        </div>

        <div class="form-card rounded-3xl p-8"
             style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(40px);box-shadow:0 40px 100px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.05)">

          <div class="f-row mb-8">
            <h2 class="text-2xl font-bold leading-tight" style="color:#f1f5f9">Bienvenido</h2>
            <p class="text-sm mt-1.5" style="color:#475569">Accede a tu panel de diagnóstico médico</p>
          </div>

          <form class="space-y-4" @submit.prevent="onSubmit">

            <div class="f-row">
              <label class="block text-xs font-semibold mb-2 uppercase tracking-wider" style="color:#64748b">
                Correo electrónico
              </label>
              <div class="input-wrap relative">
                <UIcon name="i-heroicons-envelope" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none" style="color:#334155;z-index:1" />
                <input
                  v-model="state.email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  autocomplete="email"
                  class="w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all duration-200"
                  style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;"
                  @focus="($event.target as HTMLElement).style.borderColor='rgba(56,189,248,0.5)';($event.target as HTMLElement).style.background='rgba(14,165,233,0.06)';($event.target as HTMLElement).style.boxShadow='0 0 0 3px rgba(14,165,233,0.1)'"
                  @blur="($event.target as HTMLElement).style.borderColor='rgba(255,255,255,0.08)';($event.target as HTMLElement).style.background='rgba(255,255,255,0.05)';($event.target as HTMLElement).style.boxShadow='none'"
                />
              </div>
            </div>

            <div class="f-row">
              <label class="block text-xs font-semibold mb-2 uppercase tracking-wider" style="color:#64748b">
                Contraseña
              </label>
              <div class="input-wrap relative">
                <UIcon name="i-heroicons-lock-closed" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none" style="color:#334155;z-index:1" />
                <input
                  v-model="state.password"
                  :type="showPass ? 'text' : 'password'"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  class="w-full pl-10 pr-12 py-3 text-sm rounded-xl outline-none transition-all duration-200"
                  style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;"
                  @focus="($event.target as HTMLElement).style.borderColor='rgba(56,189,248,0.5)';($event.target as HTMLElement).style.background='rgba(14,165,233,0.06)';($event.target as HTMLElement).style.boxShadow='0 0 0 3px rgba(14,165,233,0.1)'"
                  @blur="($event.target as HTMLElement).style.borderColor='rgba(255,255,255,0.08)';($event.target as HTMLElement).style.background='rgba(255,255,255,0.05)';($event.target as HTMLElement).style.boxShadow='none'"
                />
                <button
                  type="button"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style="color:#334155"
                  @mouseenter="($event.currentTarget as HTMLElement).style.color='#38bdf8'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.color='#334155'"
                  @click="showPass = !showPass"
                >
                  <UIcon :name="showPass ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="text-base" />
                </button>
              </div>
            </div>

            <div class="f-row pt-2">
              <button
                type="submit"
                :disabled="loading"
                class="w-full py-3.5 rounded-xl font-bold text-sm text-white relative overflow-hidden transition-all duration-300"
                style="background:linear-gradient(135deg,#0ea5e9,#06b6d4)"
                :class="loading ? 'opacity-60 cursor-not-allowed' : ''"
                @mouseenter="if(!loading) { ($event.currentTarget as HTMLElement).style.transform='translateY(-2px)'; ($event.currentTarget as HTMLElement).style.boxShadow='0 12px 35px rgba(14,165,233,0.4)' }"
                @mouseleave="($event.currentTarget as HTMLElement).style.transform=''; ($event.currentTarget as HTMLElement).style.boxShadow=''"
              >
                <span v-if="!loading" class="flex items-center justify-center gap-2">
                  <UIcon name="i-heroicons-arrow-right-on-rectangle" />
                  Iniciar sesión
                </span>
                <span v-else class="flex items-center justify-center gap-2">
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
              </button>
            </div>
          </form>

        </div>

        <p class="text-center text-xs mt-5" style="color:#1e293b">
          Datos cifrados · TLS 1.3 · Acceso seguro
        </p>
      </div>
    </div>
  </div>
</template>

<style>
.login-root {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
}

@keyframes expandRing {
  0%   { transform: scale(1);    opacity: 0.6; }
  60%  { transform: scale(1.08); opacity: 0.15; }
  100% { transform: scale(1.14); opacity: 0; }
}

.login-root input::placeholder { color: #1e3a5f; }
</style>
