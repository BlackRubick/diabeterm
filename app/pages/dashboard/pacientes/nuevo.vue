<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'doctor-only' })

const toast = useToast()
const router = useRouter()

const step = ref(1)
const createdPatientId = ref('')

const p = reactive({
  nombre: '',
  email: '',
  password: '',
  fechaNacimiento: '',
  edad: '' as string | number,
  sexo: 'FEMENINO' as 'MASCULINO' | 'FEMENINO',
  domicilio: '',
  telefono: '',
  estadoCivil: '',
})
const loadingS1 = ref(false)

const q = reactive({
  diagnosticoPrevio: false,
  tipoDiabetes: 'No tengo diabetes',
  anosEvolucion: 0,
  antecedentesFamiliares: false,
  planAlimentacion: false,
  usoInsulina: false,
  trabajoPesado: false,
  ulceraEnPie: false,
  frecuenciaCorteUnas: 1,
  cambiosTemperatura: false,
  amputaciones: false,
  infeccionesPies: false,
  lesionesLentas: false,
  ulcerasAnteriores: false,
  deformidadesPies: false,
  frecuenciaEjercicio: 'Nunca',
  tipoCalzado: 'Tenis',
  perdidaSensibilidad: false,
  enfermedadesVasculares: false,
  hipertension: false,
  dislipidemia: false,
  obesidad: false,
  otrasEnfermedades: '',
  factoresRiesgoAdicionales: '',
})
const loadingS2 = ref(false)

watch(() => p.fechaNacimiento, (fecha) => {
  if (!fecha) return
  const hoy = new Date()
  const nac = new Date(fecha)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  p.edad = edad
})

const estadoCivilOpts = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre']
const tipoDiabetesOpts = ['No tengo diabetes', 'Tipo 1', 'Tipo 2', 'Gestacional']
const frecuenciaCorteOpts = [
  { label: 'Nunca', value: 0 },
  { label: '1 vez al mes', value: 1 },
  { label: '2 veces o más al mes', value: 2 },
]
const frecuenciaEjercicioOpts = ['Nunca', '1-2 veces por semana', '3 veces por semana', '4 veces o más por semana']
const tipoCalzadoOpts = ['Tenis', 'Zapatos de cuero', 'Sandalias', 'Zapatos de seguridad', 'Descalzo', 'Otro']

async function submitStep1() {
  const required = ['nombre', 'email', 'password', 'fechaNacimiento', 'sexo', 'domicilio', 'telefono', 'estadoCivil'] as const
  if (required.some(k => !p[k])) {
    toast.add({ title: 'Completa todos los campos requeridos', color: 'red' })
    return
  }
  if (p.password.length < 6) {
    toast.add({ title: 'La contraseña debe tener al menos 6 caracteres', color: 'red' })
    return
  }
  loadingS1.value = true
  try {
    const { data } = await $fetch<{ success: boolean; data: { id: string } }>('/api/pacientes', {
      method: 'POST',
      body: { ...p, edad: Number(p.edad) || 0 },
    })
    createdPatientId.value = data.id
    step.value = 2
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  catch (err: any) {
    toast.add({ title: 'Error al registrar', description: err?.data?.statusMessage || 'Intenta de nuevo', color: 'red' })
  }
  finally { loadingS1.value = false }
}

async function submitStep2() {
  loadingS2.value = true
  try {
    await $fetch(`/api/pacientes/${createdPatientId.value}/cuestionario`, {
      method: 'PUT',
      body: q,
    })
    toast.add({ title: 'Paciente registrado correctamente', color: 'green' })
    router.push(`/dashboard/pacientes/${createdPatientId.value}`)
  }
  catch {
    toast.add({ title: 'Error al guardar cuestionario', color: 'red' })
  }
  finally { loadingS2.value = false }
}

const stepsInfo = [
  { label: 'Datos Personales', icon: 'i-heroicons-user' },
  { label: 'Cuestionario', icon: 'i-heroicons-clipboard-document-list' },
]
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-5 pb-10">

    <div class="rounded-2xl p-4" style="background:var(--surface-1);border:1px solid var(--surface-border)">
      <div class="flex items-center gap-2">
        <template v-for="(s, i) in stepsInfo" :key="i">
          <div class="flex items-center gap-2 min-w-0">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all duration-300"
              :style="step > i + 1
                ? 'background:#10b981;color:#fff'
                : step === i + 1
                  ? 'background:#0ea5e9;color:#fff'
                  : 'background:var(--surface-2);color:var(--text-3)'"
            >
              <UIcon v-if="step > i + 1" name="i-heroicons-check" class="text-sm" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="text-xs font-semibold hidden sm:block whitespace-nowrap"
              :style="step >= i + 1 ? 'color:var(--text-1)' : 'color:var(--text-3)'"
            >{{ s.label }}</span>
          </div>
          <div
            v-if="i < 2"
            class="flex-1 h-0.5 mx-1 transition-all duration-500"
            :style="step > i + 1 ? 'background:#10b981' : 'background:var(--surface-border)'"
          />
        </template>
      </div>
    </div>

    <template v-if="step === 1">
      <div class="rounded-2xl overflow-hidden" style="background:var(--surface-1);border:1px solid var(--surface-border)">
        <div class="px-5 py-4 border-b flex items-center gap-3" style="border-color:var(--surface-border)">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background:rgba(14,165,233,0.1)">
            <UIcon name="i-heroicons-user" class="text-sm" style="color:#0ea5e9" />
          </div>
          <div>
            <h3 class="font-bold text-sm" style="color:var(--text-1)">I. Datos Personales</h3>
            <p class="text-xs" style="color:var(--text-3)">Información básica del paciente</p>
          </div>
        </div>

        <div class="p-5 space-y-4">
          <div>
            <label class="field-label">Nombre completo *</label>
            <input v-model="p.nombre" type="text" placeholder="Nombre completo del paciente" class="field-input" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="field-label">Fecha de nacimiento *</label>
              <input v-model="p.fechaNacimiento" type="date" class="field-input" />
            </div>
            <div>
              <label class="field-label">Edad (calculada)</label>
              <input :value="p.edad || '—'" type="text" readonly class="field-input" style="opacity:0.7;cursor:default" />
            </div>
            <div>
              <label class="field-label">Estado civil *</label>
              <select v-model="p.estadoCivil" class="field-input">
                <option value="" disabled>Seleccionar...</option>
                <option v-for="o in estadoCivilOpts" :key="o" :value="o">{{ o }}</option>
              </select>
            </div>
            <div>
              <label class="field-label">Número telefónico *</label>
              <input v-model="p.telefono" type="tel" placeholder="555-123-4567" class="field-input" />
            </div>
          </div>

          <div>
            <label class="field-label">Domicilio *</label>
            <input v-model="p.domicilio" type="text" placeholder="Calle, número, colonia, ciudad" class="field-input" />
          </div>

          <div>
            <label class="field-label">Sexo *</label>
            <div class="flex gap-2 mt-1.5">
              <button
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border flex items-center justify-center"
                :style="p.sexo === 'FEMENINO'
                  ? 'background:rgba(236,72,153,0.1);border-color:rgba(236,72,153,0.4);color:#ec4899'
                  : 'background:var(--surface-2);border-color:var(--surface-border);color:var(--text-3)'"
                @click="p.sexo = 'FEMENINO'"
              >
                <UIcon name="i-heroicons-user-circle" class="mr-1.5" />
                Femenino
              </button>
              <button
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border flex items-center justify-center"
                :style="p.sexo === 'MASCULINO'
                  ? 'background:rgba(14,165,233,0.1);border-color:rgba(14,165,233,0.4);color:#0ea5e9'
                  : 'background:var(--surface-2);border-color:var(--surface-border);color:var(--text-3)'"
                @click="p.sexo = 'MASCULINO'"
              >
                <UIcon name="i-heroicons-user-circle" class="mr-1.5" />
                Masculino
              </button>
            </div>
          </div>

          <div class="pt-1">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1 h-px" style="background:var(--surface-border)" />
              <span class="text-[10px] font-bold uppercase tracking-widest px-2" style="color:var(--text-3)">Acceso al sistema</span>
              <div class="flex-1 h-px" style="background:var(--surface-border)" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label">Correo electrónico *</label>
                <input v-model="p.email" type="email" placeholder="correo@ejemplo.com" class="field-input" />
              </div>
              <div>
                <label class="field-label">Contraseña inicial *</label>
                <input v-model="p.password" type="password" placeholder="Mínimo 6 caracteres" class="field-input" />
              </div>
            </div>
          </div>
        </div>

        <div class="px-5 py-4 flex items-center justify-between border-t" style="border-color:var(--surface-border)">
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style="background:var(--surface-2);color:var(--text-2)"
            @click="router.push('/dashboard/pacientes')"
          >
            <UIcon name="i-heroicons-arrow-left" /> Volver
          </button>
          <button
            :disabled="loadingS1"
            class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60"
            style="background:linear-gradient(135deg,#0ea5e9,#0284c7);box-shadow:0 6px 20px rgba(14,165,233,0.3)"
            @click="submitStep1"
          >
            <span v-if="loadingS1" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <UIcon v-else name="i-heroicons-arrow-right" />
            {{ loadingS1 ? 'Guardando...' : 'Siguiente' }}
          </button>
        </div>
      </div>
    </template>

    <template v-if="step === 2">

      <div class="q-section">
        <div class="q-section-header" style="background:linear-gradient(135deg,#78350f,#b45309)">
          <div class="q-section-letter" style="background:rgba(245,158,11,0.25);color:#fcd34d">A</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <UIcon name="i-heroicons-beaker" class="text-sm" style="color:#fcd34d" />
              <span class="text-[10px] font-bold uppercase tracking-widest" style="color:#fcd34d">Sección A · 7 preguntas</span>
            </div>
            <h3 class="text-white font-black text-base">Antecedentes de Diabetes</h3>
            <p class="text-xs mt-0.5" style="color:rgba(255,255,255,0.6)">Historia clínica relacionada con la diabetes</p>
          </div>
        </div>

        <div class="q-body">
          <div class="q-card" :class="q.diagnosticoPrevio ? 'q-risk' : 'q-safe'">
            <div class="q-num amber">1</div>
            <p class="q-question">¿He sido diagnosticado previamente con diabetes?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.diagnosticoPrevio ? 'ans-si-on' : '']" @click="q.diagnosticoPrevio = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.diagnosticoPrevio ? 'ans-no-on' : '']" @click="q.diagnosticoPrevio = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> No
              </button>
            </div>
          </div>

          <Transition name="slide-down">
            <div v-if="q.diagnosticoPrevio" class="q-card q-indented q-risk">
              <div class="q-num amber">2</div>
              <div class="flex-1 min-w-0">
                <p class="q-question mb-2">¿Qué tipo de diabetes tiene?</p>
                <div class="pill-group">
                  <button
                    v-for="o in tipoDiabetesOpts"
                    :key="o"
                    :class="['pill-opt', q.tipoDiabetes === o ? 'pill-amber' : '']"
                    @click="q.tipoDiabetes = o"
                  >{{ o }}</button>
                </div>
              </div>
            </div>
          </Transition>

          <Transition name="slide-down">
            <div v-if="q.diagnosticoPrevio" class="q-card q-indented">
              <div class="q-num amber">3</div>
              <p class="q-question">¿Cuántos años de evolución tiene su diabetes?</p>
              <div class="q-controls">
                <div class="years-input-wrap">
                  <input v-model.number="q.anosEvolucion" type="number" min="0" max="80" class="years-input" placeholder="0" />
                  <span class="years-label">años</span>
                </div>
              </div>
            </div>
          </Transition>

          <div class="q-card" :class="q.antecedentesFamiliares ? 'q-risk' : 'q-safe'">
            <div class="q-num amber">4</div>
            <p class="q-question">¿Tiene antecedentes familiares con pie diabético?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.antecedentesFamiliares ? 'ans-si-on' : '']" @click="q.antecedentesFamiliares = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.antecedentesFamiliares ? 'ans-no-on' : '']" @click="q.antecedentesFamiliares = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> No
              </button>
            </div>
          </div>

          <div class="q-card" :class="q.planAlimentacion ? 'q-safe' : 'q-risk'">
            <div class="q-num amber">5</div>
            <p class="q-question">¿Está siguiendo algún plan de alimentación adecuado a su enfermedad?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.planAlimentacion ? 'ans-si-on' : '']" @click="q.planAlimentacion = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.planAlimentacion ? 'ans-no-on' : '']" @click="q.planAlimentacion = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> No
              </button>
            </div>
          </div>

          <div class="q-card" :class="q.usoInsulina ? 'q-safe' : ''">
            <div class="q-num amber">6</div>
            <p class="q-question">¿Está tomando insulina y/o medicamento para control de glucosa?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.usoInsulina ? 'ans-si-on' : '']" @click="q.usoInsulina = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.usoInsulina ? 'ans-no-on' : '']" @click="q.usoInsulina = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> No
              </button>
            </div>
          </div>

          <div class="q-card" :class="q.trabajoPesado ? 'q-risk' : 'q-safe'">
            <div class="q-num amber">7</div>
            <p class="q-question">¿Realiza trabajo pesado?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.trabajoPesado ? 'ans-si-on' : '']" @click="q.trabajoPesado = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.trabajoPesado ? 'ans-no-on' : '']" @click="q.trabajoPesado = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> No
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="q-section">
        <div class="q-section-header" style="background:linear-gradient(135deg,#7f1d1d,#b91c1c)">
          <div class="q-section-letter" style="background:rgba(239,68,68,0.25);color:#fca5a5">B</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <UIcon name="i-heroicons-exclamation-triangle" class="text-sm" style="color:#fca5a5" />
              <span class="text-[10px] font-bold uppercase tracking-widest" style="color:#fca5a5">Sección B · 8 preguntas</span>
            </div>
            <h3 class="text-white font-black text-base">Lesiones y Síntomas</h3>
            <p class="text-xs mt-0.5" style="color:rgba(255,255,255,0.6)">Historial de lesiones y síntomas en los pies</p>
          </div>
        </div>

        <div class="q-body">
          <div class="q-card" :class="q.ulceraEnPie ? 'q-risk' : 'q-safe'">
            <div class="q-num red">1</div>
            <p class="q-question">¿Ha tenido alguna vez úlceras en el pie?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.ulceraEnPie ? 'ans-si-on' : '']" @click="q.ulceraEnPie = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.ulceraEnPie ? 'ans-no-on' : '']" @click="q.ulceraEnPie = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> No
              </button>
            </div>
          </div>

          <div class="q-card">
            <div class="q-num red">2</div>
            <div class="flex-1 min-w-0">
              <p class="q-question mb-2">¿Qué tan seguido se corta las uñas de los pies?</p>
              <div class="pill-group">
                <button
                  v-for="o in frecuenciaCorteOpts"
                  :key="o.value"
                  :class="['pill-opt', q.frecuenciaCorteUnas === o.value ? 'pill-red' : '']"
                  @click="q.frecuenciaCorteUnas = o.value"
                >{{ o.label }}</button>
              </div>
            </div>
          </div>

          <div class="q-card" :class="q.cambiosTemperatura ? 'q-risk' : 'q-safe'">
            <div class="q-num red">3</div>
            <p class="q-question">¿Tiene cambios de temperatura en los pies (color, roce excesivo)?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.cambiosTemperatura ? 'ans-si-on' : '']" @click="q.cambiosTemperatura = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.cambiosTemperatura ? 'ans-no-on' : '']" @click="q.cambiosTemperatura = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> No
              </button>
            </div>
          </div>

          <div class="q-card" :class="q.amputaciones ? 'q-risk' : 'q-safe'">
            <div class="q-num red">4</div>
            <p class="q-question">¿Ha tenido alguna vez una amputación en el pie?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.amputaciones ? 'ans-si-on' : '']" @click="q.amputaciones = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.amputaciones ? 'ans-no-on' : '']" @click="q.amputaciones = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> Nunca
              </button>
            </div>
          </div>

          <div class="q-card" :class="q.infeccionesPies ? 'q-risk' : 'q-safe'">
            <div class="q-num red">5</div>
            <p class="q-question">¿Ha tenido alguna vez infecciones en los pies?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.infeccionesPies ? 'ans-si-on' : '']" @click="q.infeccionesPies = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.infeccionesPies ? 'ans-no-on' : '']" @click="q.infeccionesPies = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> Nunca
              </button>
            </div>
          </div>

          <div class="q-card" :class="q.lesionesLentas ? 'q-risk' : 'q-safe'">
            <div class="q-num red">6</div>
            <p class="q-question">¿Ha tenido lesiones en el pie que hayan tardado en sanar?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.lesionesLentas ? 'ans-si-on' : '']" @click="q.lesionesLentas = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.lesionesLentas ? 'ans-no-on' : '']" @click="q.lesionesLentas = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> Nunca
              </button>
            </div>
          </div>

          <div class="q-card" :class="q.ulcerasAnteriores ? 'q-risk' : 'q-safe'">
            <div class="q-num red">7</div>
            <p class="q-question">¿Ha presentado alguna úlcera venosa anteriormente?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.ulcerasAnteriores ? 'ans-si-on' : '']" @click="q.ulcerasAnteriores = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.ulcerasAnteriores ? 'ans-no-on' : '']" @click="q.ulcerasAnteriores = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> Ninguna
              </button>
            </div>
          </div>

          <div class="q-card" :class="q.deformidadesPies ? 'q-risk' : 'q-safe'">
            <div class="q-num red">8</div>
            <p class="q-question">¿Ha notado cambios en la estructura de sus pies (deformidades)?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.deformidadesPies ? 'ans-si-on' : '']" @click="q.deformidadesPies = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.deformidadesPies ? 'ans-no-on' : '']" @click="q.deformidadesPies = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> No
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="q-section">
        <div class="q-section-header" style="background:linear-gradient(135deg,#3b0764,#6d28d9)">
          <div class="q-section-letter" style="background:rgba(139,92,246,0.3);color:#c4b5fd">C</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <UIcon name="i-heroicons-heart" class="text-sm" style="color:#c4b5fd" />
              <span class="text-[10px] font-bold uppercase tracking-widest" style="color:#c4b5fd">Sección C · 5 preguntas</span>
            </div>
            <h3 class="text-white font-black text-base">Hábitos y Factores de Riesgo</h3>
            <p class="text-xs mt-0.5" style="color:rgba(255,255,255,0.6)">Estilo de vida y condiciones adicionales</p>
          </div>
        </div>

        <div class="q-body">
          <div class="q-card">
            <div class="q-num purple">1</div>
            <div class="flex-1 min-w-0">
              <p class="q-question mb-2">¿Con qué frecuencia realiza ejercicio a la semana?</p>
              <div class="pill-group">
                <button
                  v-for="o in frecuenciaEjercicioOpts"
                  :key="o"
                  :class="['pill-opt', q.frecuenciaEjercicio === o ? 'pill-purple' : '']"
                  @click="q.frecuenciaEjercicio = o"
                >{{ o }}</button>
              </div>
            </div>
          </div>

          <div class="q-card">
            <div class="q-num purple">2</div>
            <div class="flex-1 min-w-0">
              <p class="q-question mb-2">¿Qué tipo de zapatos usa regularmente?</p>
              <div class="pill-group">
                <button
                  v-for="o in tipoCalzadoOpts"
                  :key="o"
                  :class="['pill-opt', q.tipoCalzado === o ? 'pill-purple' : '']"
                  @click="q.tipoCalzado = o"
                >{{ o }}</button>
              </div>
            </div>
          </div>

          <div class="q-card" :class="q.perdidaSensibilidad ? 'q-risk' : 'q-safe'">
            <div class="q-num purple">3</div>
            <p class="q-question">¿Ha tenido cambios en la sensibilidad o circulación de sus pies?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.perdidaSensibilidad ? 'ans-si-on' : '']" @click="q.perdidaSensibilidad = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.perdidaSensibilidad ? 'ans-no-on' : '']" @click="q.perdidaSensibilidad = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> No
              </button>
            </div>
          </div>

          <div class="q-card" :class="q.enfermedadesVasculares ? 'q-risk' : 'q-safe'">
            <div class="q-num purple">4</div>
            <p class="q-question">¿Tiene antecedentes de enfermedades vasculares periféricas (várices, etc.)?</p>
            <div class="q-controls">
              <button :class="['ans-btn ans-si', q.enfermedadesVasculares ? 'ans-si-on' : '']" @click="q.enfermedadesVasculares = true">
                <UIcon name="i-heroicons-check-circle" class="text-base" /> Sí
              </button>
              <button :class="['ans-btn ans-no', !q.enfermedadesVasculares ? 'ans-no-on' : '']" @click="q.enfermedadesVasculares = false">
                <UIcon name="i-heroicons-x-circle" class="text-base" /> No
              </button>
            </div>
          </div>

          <div class="q-card q-card-tall">
            <div class="q-num purple" style="align-self:flex-start;margin-top:2px">5</div>
            <div class="flex-1 min-w-0">
              <p class="q-question mb-3">¿Tiene otros factores de riesgo?</p>
              <div class="flex flex-wrap gap-2 mb-3">
                <button
                  :class="['risk-chip', q.obesidad ? 'risk-chip-on' : '']"
                  @click="q.obesidad = !q.obesidad"
                >
                  <span class="risk-chip-dot" />
                  Obesidad
                  <UIcon v-if="q.obesidad" name="i-heroicons-check" class="text-xs ml-1" />
                </button>
                <button
                  :class="['risk-chip', q.hipertension ? 'risk-chip-on' : '']"
                  @click="q.hipertension = !q.hipertension"
                >
                  <span class="risk-chip-dot" />
                  Hipertensión arterial
                  <UIcon v-if="q.hipertension" name="i-heroicons-check" class="text-xs ml-1" />
                </button>
                <button
                  :class="['risk-chip', q.dislipidemia ? 'risk-chip-on' : '']"
                  @click="q.dislipidemia = !q.dislipidemia"
                >
                  <span class="risk-chip-dot" />
                  Dislipidemia
                  <UIcon v-if="q.dislipidemia" name="i-heroicons-check" class="text-xs ml-1" />
                </button>
              </div>
              <input
                v-model="q.otrasEnfermedades"
                type="text"
                placeholder="Otros factores de riesgo (especificar)..."
                class="field-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          style="background:var(--surface-2);color:var(--text-2)"
          @click="step = 1"
        >
          <UIcon name="i-heroicons-arrow-left" /> Anterior
        </button>
        <button
          :disabled="loadingS2"
          class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60"
          style="background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 6px 20px rgba(16,185,129,0.3)"
          @click="submitStep2"
        >
          <span v-if="loadingS2" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <UIcon v-else name="i-heroicons-check" />
          {{ loadingS2 ? 'Guardando...' : 'Guardar paciente' }}
        </button>
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
.q-section {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
}
.q-section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
}
.q-section-letter {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 900;
  flex-shrink: 0;
}
.q-body {
  background: var(--surface-1);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
}
.q-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  background: var(--surface-2);
  flex-wrap: wrap;
}
.q-card:hover {
  filter: brightness(1.04);
}
.q-card-tall {
  align-items: flex-start;
}
.q-indented {
  margin-left: 16px;
}
.q-safe {
  border-left-color: rgba(16, 185, 129, 0.5);
}
.q-risk {
  border-left-color: rgba(239, 68, 68, 0.45);
}
.q-question {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
  flex: 1;
  min-width: 150px;
  line-height: 1.5;
}
.q-num {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}
.q-num.amber { background: rgba(245,158,11,0.15); color: #f59e0b; }
.q-num.red   { background: rgba(239,68,68,0.15);  color: #ef4444; }
.q-num.purple{ background: rgba(139,92,246,0.15); color: #8b5cf6; }
.q-controls {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.ans-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.18s;
  border: 1.5px solid var(--surface-border);
  background: var(--surface-1);
  color: var(--text-3);
  cursor: pointer;
  white-space: nowrap;
}
.ans-btn:hover { color: var(--text-1); }
.ans-si-on {
  background: rgba(16,185,129,0.12) !important;
  border-color: rgba(16,185,129,0.5) !important;
  color: #10b981 !important;
}
.ans-no-on {
  background: rgba(100,116,139,0.12) !important;
  border-color: rgba(100,116,139,0.4) !important;
  color: var(--text-2) !important;
}
.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pill-opt {
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.18s;
  border: 1.5px solid var(--surface-border);
  background: var(--surface-1);
  color: var(--text-3);
  cursor: pointer;
}
.pill-opt:hover { color: var(--text-1); }
.pill-amber { background: rgba(245,158,11,0.12) !important; border-color: rgba(245,158,11,0.5) !important; color: #f59e0b !important; }
.pill-red   { background: rgba(239,68,68,0.12)  !important; border-color: rgba(239,68,68,0.5)  !important; color: #ef4444 !important; }
.pill-purple{ background: rgba(139,92,246,0.12) !important; border-color: rgba(139,92,246,0.5) !important; color: #8b5cf6 !important; }
.years-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-1);
  border: 1.5px solid var(--surface-border);
  border-radius: 10px;
  padding: 6px 12px;
}
.years-input {
  width: 52px;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-1);
  text-align: center;
}
.years-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
}
.risk-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.18s;
  border: 1.5px solid var(--surface-border);
  background: var(--surface-1);
  color: var(--text-3);
  cursor: pointer;
}
.risk-chip:hover { border-color: rgba(239,68,68,0.35); color: var(--text-1); }
.risk-chip-on {
  background: rgba(239,68,68,0.1) !important;
  border-color: rgba(239,68,68,0.5) !important;
  color: #f87171 !important;
}
.risk-chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 200px;
}
</style>
