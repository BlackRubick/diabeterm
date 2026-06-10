<script setup lang="ts">
import type { Patient } from '~/stores/patients'

definePageMeta({ layout: 'dashboard', middleware: 'doctor-only' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const { data: patientsData } = await useFetch<{ success: boolean; data: Patient[] }>('/api/pacientes')
const patients = computed(() => patientsData.value?.data ?? [])

const selectedPatientId = ref((route.query.patientId as string) || '')
const fecha = ref(new Date().toISOString().split('T')[0])
const observaciones = ref('')
const imagenDerecho = ref('')
const imagenIzquierdo = ref('')

const step = ref<'form' | 'prediction' | 'results'>('form')
const evaluation = ref<any>(null)
const loadingCreate = ref(false)
const loadingPrediction = ref(false)

const selectedPatient = computed(() =>
  patients.value.find(p => p.id === selectedPatientId.value)
)

const stepIndex = computed(() => ['form', 'prediction', 'results'].indexOf(step.value))

async function createEvaluation() {
  if (!selectedPatientId.value) {
    toast.add({ title: 'Selecciona un paciente', color: 'red' })
    return
  }
  loadingCreate.value = true
  try {
    const { data } = await $fetch<{ success: boolean; data: any }>('/api/evaluaciones', {
      method: 'POST',
      body: { patientId: selectedPatientId.value, fecha: fecha.value, observaciones: observaciones.value },
    })
    evaluation.value = data
    step.value = 'prediction'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.statusMessage, color: 'red' })
  }
  finally { loadingCreate.value = false }
}

async function runPrediction() {
  if (!evaluation.value) return
  loadingPrediction.value = true
  try {
    const respuestas = selectedPatient.value?.questionnaire ?? {}
    const { data } = await $fetch<{ success: boolean; data: any }>('/api/prediccion', {
      method: 'POST',
      body: {
        evaluationId: evaluation.value.id,
        pieDerecho: imagenDerecho.value || undefined,
        pieIzquierdo: imagenIzquierdo.value || undefined,
        respuestas,
      },
    })
    evaluation.value = { ...evaluation.value, ...data.evaluation }
    step.value = 'results'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.add({ title: 'Análisis completado', color: 'green' })
  }
  catch {
    toast.add({ title: 'Error en el análisis', color: 'red' })
  }
  finally { loadingPrediction.value = false }
}

function handleImageUpload(url: string, tipoPie: 'DERECHO' | 'IZQUIERDO') {
  if (tipoPie === 'DERECHO') imagenDerecho.value = url
  else imagenIzquierdo.value = url
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const stepsInfo = [
  { key: 'form',       label: 'Evaluación', icon: 'i-heroicons-document-text' },
  { key: 'prediction', label: 'Análisis',   icon: 'i-heroicons-cpu-chip' },
  { key: 'results',    label: 'Resultados', icon: 'i-heroicons-chart-bar' },
]
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-5 pb-10">

    <div class="rounded-2xl p-4" style="background:var(--surface-1);border:1px solid var(--surface-border)">
      <div class="flex items-center gap-2">
        <template v-for="(s, i) in stepsInfo" :key="s.key">
          <div class="flex items-center gap-2 min-w-0">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
              :style="stepIndex > i
                ? 'background:#10b981;color:#fff'
                : stepIndex === i
                  ? 'background:#0ea5e9;color:#fff;box-shadow:0 0 0 4px rgba(14,165,233,0.2)'
                  : 'background:var(--surface-2);color:var(--text-3)'"
            >
              <UIcon v-if="stepIndex > i" name="i-heroicons-check" class="text-sm" />
              <UIcon v-else :name="s.icon" class="text-sm" />
            </div>
            <span
              class="text-xs font-semibold hidden sm:block whitespace-nowrap"
              :style="stepIndex >= i ? 'color:var(--text-1)' : 'color:var(--text-3)'"
            >{{ s.label }}</span>
          </div>
          <div
            v-if="i < 2"
            class="flex-1 h-0.5 mx-1 transition-all duration-500"
            :style="stepIndex > i ? 'background:#10b981' : 'background:var(--surface-border)'"
          />
        </template>
      </div>
    </div>

    <template v-if="step === 'form'">

      <div
        class="relative rounded-3xl overflow-hidden p-6"
        style="background:linear-gradient(135deg,#060d1f,#0c2050,#0d3a7a)"
      >
        <div class="absolute inset-0 opacity-[0.04]"
             style="background-image:linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px);background-size:24px 24px" />
        <div class="absolute right-0 top-0 w-56 h-56 rounded-full pointer-events-none"
             style="background:radial-gradient(circle,rgba(14,165,233,0.18) 0%,transparent 70%);filter:blur(35px);transform:translate(20%,-20%)" />
        <div class="relative z-10">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:rgba(14,165,233,0.2)">
              <UIcon name="i-heroicons-clipboard-document-list" class="text-xs" style="color:#38bdf8" />
            </div>
            <span class="text-xs font-bold uppercase tracking-widest" style="color:#38bdf8">Nueva evaluación</span>
          </div>
          <h1 class="text-white font-black text-xl tracking-tight">Evaluación Podológica</h1>
          <p class="text-sm mt-1" style="color:rgba(255,255,255,0.5)">
            Selecciona el paciente, sube evidencia fotográfica y ejecuta el análisis de riesgo
          </p>
        </div>
      </div>

      <div class="rounded-2xl overflow-hidden" style="background:var(--surface-1);border:1px solid var(--surface-border)">
        <div class="px-5 py-4 border-b flex items-center gap-3" style="border-color:var(--surface-border)">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background:rgba(14,165,233,0.1)">
            <UIcon name="i-heroicons-user-circle" class="text-sm" style="color:#0ea5e9" />
          </div>
          <div>
            <h3 class="font-bold text-sm" style="color:var(--text-1)">1. Selección de Paciente</h3>
            <p class="text-xs" style="color:var(--text-3)">Elige al paciente que se va a evaluar</p>
          </div>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="field-label">Paciente *</label>
            <select v-model="selectedPatientId" class="field-input">
              <option value="" disabled>Seleccionar paciente...</option>
              <option v-for="p in patients" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>

          <Transition name="fade-up">
            <div
              v-if="selectedPatient"
              class="flex items-center gap-4 p-4 rounded-2xl"
              style="background:var(--surface-2);border:1px solid rgba(14,165,233,0.2)"
            >
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6)"
              >
                {{ initials(selectedPatient.nombre) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm" style="color:var(--text-1)">{{ selectedPatient.nombre }}</p>
                <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span class="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style="background:rgba(14,165,233,0.1);color:#0ea5e9">
                    {{ selectedPatient.edad }} años
                  </span>
                  <span class="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                        style="background:rgba(139,92,246,0.1);color:#8b5cf6">
                    <UIcon name="i-heroicons-user-circle" class="text-xs" />
                    {{ selectedPatient.sexo === 'MASCULINO' ? 'Masculino' : 'Femenino' }}
                  </span>
                  <span
                    v-if="selectedPatient.questionnaire"
                    class="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                    style="background:rgba(16,185,129,0.1);color:#10b981"
                  >
                    <UIcon name="i-heroicons-check-circle" class="text-xs" />
                    Cuestionario completo
                  </span>
                  <span
                    v-else
                    class="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                    style="background:rgba(245,158,11,0.1);color:#f59e0b"
                  >
                    <UIcon name="i-heroicons-exclamation-triangle" class="text-xs" />
                    Sin cuestionario
                  </span>
                </div>
              </div>
              <NuxtLink
                :to="`/dashboard/pacientes/${selectedPatient.id}`"
                class="flex items-center gap-1 text-xs font-semibold flex-shrink-0 transition-all hover:opacity-70"
                style="color:#0ea5e9"
              >
                Ver perfil
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="text-xs" />
              </NuxtLink>
            </div>
          </Transition>
        </div>
      </div>

      <div class="rounded-2xl overflow-hidden" style="background:var(--surface-1);border:1px solid var(--surface-border)">
        <div class="px-5 py-4 border-b flex items-center gap-3" style="border-color:var(--surface-border)">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background:rgba(139,92,246,0.1)">
            <UIcon name="i-heroicons-calendar-days" class="text-sm" style="color:#8b5cf6" />
          </div>
          <div>
            <h3 class="font-bold text-sm" style="color:var(--text-1)">2. Datos de la Evaluación</h3>
            <p class="text-xs" style="color:var(--text-3)">Fecha, responsable y observaciones clínicas</p>
          </div>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="field-label">Fecha de evaluación *</label>
              <input v-model="fecha" type="date" class="field-input" />
            </div>
            <div>
              <label class="field-label">Doctor responsable</label>
              <input :value="authStore.user?.nombre" type="text" readonly class="field-input" style="opacity:0.6;cursor:default" />
            </div>
          </div>
          <div>
            <label class="field-label">Observaciones clínicas</label>
            <textarea
              v-model="observaciones"
              rows="3"
              placeholder="Hallazgos clínicos, notas del doctor..."
              class="obs-textarea"
            />
          </div>
        </div>
      </div>

      <div class="rounded-2xl overflow-hidden" style="background:var(--surface-1);border:1px solid var(--surface-border)">
        <div class="px-5 py-4 border-b flex items-center justify-between" style="border-color:var(--surface-border)">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background:rgba(14,165,233,0.1)">
              <UIcon name="i-heroicons-camera" class="text-sm" style="color:#0ea5e9" />
            </div>
            <div>
              <h3 class="font-bold text-sm" style="color:var(--text-1)">3. Evidencia Fotográfica</h3>
              <p class="text-xs" style="color:var(--text-3)">Imágenes térmicas para el análisis</p>
            </div>
          </div>
          <span
            class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style="background:rgba(14,165,233,0.1);color:#0ea5e9;border:1px solid rgba(14,165,233,0.2)"
          >Opcional</span>
        </div>
        <div class="p-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ThermalImageUpload
              v-model="imagenIzquierdo"
              label="Pie Izquierdo"
              tipoPie="IZQUIERDO"
              @upload="handleImageUpload"
            />
            <ThermalImageUpload
              v-model="imagenDerecho"
              label="Pie Derecho"
              tipoPie="DERECHO"
              @upload="handleImageUpload"
            />
          </div>
          <div class="flex items-center gap-2 mt-4 p-3 rounded-xl" style="background:var(--surface-2)">
            <UIcon name="i-heroicons-information-circle" class="text-sm flex-shrink-0" style="color:#0ea5e9" />
            <p class="text-xs" style="color:var(--text-3)">
              Las imágenes térmicas son opcionales pero mejoran significativamente la precisión del diagnóstico
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          style="background:var(--surface-2);color:var(--text-2)"
          @click="router.push('/dashboard/evaluaciones')"
        >
          <UIcon name="i-heroicons-arrow-left" /> Cancelar
        </button>
        <button
          :disabled="loadingCreate || !selectedPatientId"
          class="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-black text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6);box-shadow:0 8px 24px rgba(14,165,233,0.35)"
          @click="createEvaluation"
        >
          <span v-if="loadingCreate" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <UIcon v-else name="i-heroicons-cpu-chip" />
          {{ loadingCreate ? 'Creando...' : 'Continuar al Análisis' }}
        </button>
      </div>
    </template>

    <template v-if="step === 'prediction'">

      <div
        class="relative rounded-3xl overflow-hidden"
        style="background:linear-gradient(145deg,#060d1f,#080f28,#050c1a);border:1px solid rgba(14,165,233,0.15)"
      >
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div class="ai-ring" style="width:260px;height:260px;animation-delay:0s" />
          <div class="ai-ring" style="width:360px;height:360px;animation-delay:0.8s" />
          <div class="ai-ring" style="width:460px;height:460px;animation-delay:1.6s" />
        </div>
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style="width:200px;height:200px;background:radial-gradient(circle,rgba(14,165,233,0.12) 0%,transparent 70%);filter:blur(30px)" />
        </div>

        <div class="relative z-10 p-6 lg:p-8">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(14,165,233,0.15);border:1px solid rgba(14,165,233,0.2)">
              <UIcon name="i-heroicons-cpu-chip" class="text-lg" style="color:#38bdf8" />
            </div>
            <div>
              <h3 class="text-white font-black text-lg">Motor de Análisis IA</h3>
              <p class="text-xs" style="color:rgba(255,255,255,0.4)">Diabeterm Evalúa · Sistema de predicción de riesgo</p>
            </div>
            <div class="ml-auto flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span class="text-xs font-semibold" style="color:#38bdf8">Listo</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div
              class="flex items-center gap-3 p-3 rounded-xl"
              :style="imagenIzquierdo
                ? 'background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2)'
                : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)'"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :style="imagenIzquierdo ? 'background:rgba(16,185,129,0.15)' : 'background:rgba(255,255,255,0.05)'"
              >
                <UIcon
                  :name="imagenIzquierdo ? 'i-heroicons-check' : 'i-heroicons-photo'"
                  class="text-sm"
                  :style="imagenIzquierdo ? 'color:#10b981' : 'color:rgba(255,255,255,0.3)'"
                />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-white">Imagen Pie I.</p>
                <p class="text-[10px]" :style="imagenIzquierdo ? 'color:#10b981' : 'color:rgba(255,255,255,0.3)'">
                  {{ imagenIzquierdo ? 'Cargada' : 'No cargada' }}
                </p>
              </div>
            </div>

            <div
              class="flex items-center gap-3 p-3 rounded-xl"
              :style="imagenDerecho
                ? 'background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2)'
                : 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)'"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :style="imagenDerecho ? 'background:rgba(16,185,129,0.15)' : 'background:rgba(255,255,255,0.05)'"
              >
                <UIcon
                  :name="imagenDerecho ? 'i-heroicons-check' : 'i-heroicons-photo'"
                  class="text-sm"
                  :style="imagenDerecho ? 'color:#10b981' : 'color:rgba(255,255,255,0.3)'"
                />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-white">Imagen Pie D.</p>
                <p class="text-[10px]" :style="imagenDerecho ? 'color:#10b981' : 'color:rgba(255,255,255,0.3)'">
                  {{ imagenDerecho ? 'Cargada' : 'No cargada' }}
                </p>
              </div>
            </div>

            <div
              class="flex items-center gap-3 p-3 rounded-xl"
              :style="selectedPatient?.questionnaire
                ? 'background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2)'
                : 'background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.18)'"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                :style="selectedPatient?.questionnaire ? 'background:rgba(16,185,129,0.15)' : 'background:rgba(245,158,11,0.12)'"
              >
                <UIcon
                  :name="selectedPatient?.questionnaire ? 'i-heroicons-check' : 'i-heroicons-exclamation-triangle'"
                  class="text-sm"
                  :style="selectedPatient?.questionnaire ? 'color:#10b981' : 'color:#f59e0b'"
                />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-white">Cuestionario</p>
                <p class="text-[10px]" :style="selectedPatient?.questionnaire ? 'color:#10b981' : 'color:#f59e0b'">
                  {{ selectedPatient?.questionnaire ? 'Completo' : 'Incompleto' }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 p-4 rounded-2xl mb-6" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
              style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6)"
            >
              {{ initials(selectedPatient?.nombre ?? '') }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-white">{{ selectedPatient?.nombre }}</p>
              <p class="text-xs" style="color:rgba(255,255,255,0.4)">
                {{ selectedPatient?.edad }} años ·
                {{ selectedPatient?.sexo === 'MASCULINO' ? 'Masculino' : 'Femenino' }} ·
                {{ fecha }}
              </p>
            </div>
          </div>

          <p class="text-sm text-center mb-6" style="color:rgba(255,255,255,0.45)">
            El sistema analizará los factores clínicos, el historial podológico
            y las imágenes térmicas para determinar el nivel de riesgo de pie diabético.
          </p>

          <div class="flex justify-center">
            <button
              :disabled="loadingPrediction"
              class="run-btn relative flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-black text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
              @click="runPrediction"
            >
              <span
                v-if="loadingPrediction"
                class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
              <UIcon v-else name="i-heroicons-play-circle" class="text-xl" />
              {{ loadingPrediction ? 'Analizando datos...' : 'Ejecutar Análisis de Riesgo' }}
            </button>
          </div>

          <Transition name="fade">
            <div v-if="loadingPrediction" class="mt-5 flex flex-col items-center gap-2">
              <div class="flex items-center gap-1.5">
                <span v-for="i in 4" :key="i"
                  class="w-1.5 h-1.5 rounded-full bg-sky-400"
                  :style="`animation: bounce 1s infinite ${(i - 1) * 0.15}s`"
                />
              </div>
              <p class="text-xs" style="color:rgba(255,255,255,0.4)">Procesando factores clínicos e imágenes...</p>
            </div>
          </Transition>
        </div>
      </div>

      <div class="flex justify-start">
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          style="background:var(--surface-2);color:var(--text-2)"
          @click="step = 'form'"
        >
          <UIcon name="i-heroicons-arrow-left" /> Volver
        </button>
      </div>
    </template>

    <template v-if="step === 'results' && evaluation">

      <div
        class="rounded-3xl p-5 flex items-center gap-4"
        style="background:linear-gradient(135deg,#052e16,#065f46);border:1px solid rgba(16,185,129,0.25)"
      >
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
             style="background:rgba(16,185,129,0.2)">
          <UIcon name="i-heroicons-check-badge" class="text-2xl" style="color:#34d399" />
        </div>
        <div>
          <h2 class="text-white font-black text-lg">Análisis Completado</h2>
          <p class="text-sm" style="color:rgba(255,255,255,0.55)">
            Los resultados han sido guardados en el historial del paciente
          </p>
        </div>
      </div>

      <EvaluationResults :evaluation="evaluation" />

      <div class="flex items-center justify-between">
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          style="background:var(--surface-2);color:var(--text-2)"
          @click="step = 'prediction'"
        >
          <UIcon name="i-heroicons-arrow-left" /> Volver
        </button>
        <NuxtLink :to="`/dashboard/evaluaciones/${evaluation.id}`">
          <button
            class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
            style="background:linear-gradient(135deg,#0ea5e9,#0284c7);box-shadow:0 6px 20px rgba(14,165,233,0.3)"
          >
            <UIcon name="i-heroicons-eye" />
            Ver evaluación completa
          </button>
        </NuxtLink>
      </div>
    </template>

  </div>
</template>

<style scoped>
.field-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  margin-bottom: 6px;
}
.field-input {
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s;
  background: var(--surface-2);
  border: 1px solid var(--surface-border);
  color: var(--text-1);
}
.field-input:focus {
  border-color: rgba(14, 165, 233, 0.5);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}
.obs-textarea {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s;
  resize: none;
  background: var(--surface-2);
  border: 1px solid var(--surface-border);
  color: var(--text-1);
}
.obs-textarea:focus {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
.run-btn {
  background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
  box-shadow: 0 0 40px rgba(14, 165, 233, 0.4);
  transition: box-shadow 0.3s, transform 0.2s;
}
.run-btn:hover:not(:disabled) {
  box-shadow: 0 0 60px rgba(14, 165, 233, 0.65);
  transform: translateY(-1px);
}
.ai-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(14, 165, 233, 0.12);
  animation: expandRing 4s ease-out infinite;
  pointer-events: none;
}
@keyframes expandRing {
  0%   { opacity: 0.6; transform: scale(0.85); }
  100% { opacity: 0;   transform: scale(1.1); }
}
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
  40%           { transform: translateY(-6px); opacity: 1;   }
}
.fade-up-enter-active  { transition: all 0.3s ease; }
.fade-up-leave-active  { transition: all 0.2s ease; }
.fade-up-enter-from    { opacity: 0; transform: translateY(8px); }
.fade-up-leave-to      { opacity: 0; transform: translateY(4px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
