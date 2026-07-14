<script setup lang="ts">
import type { Evaluation } from '~/stores/patients'

definePageMeta({ layout: false, middleware: 'doctor-only' })

const route = useRoute()
const id = route.params.id as string

const { data } = await useFetch<{ success: boolean; data: Evaluation }>(`/api/evaluaciones/${id}`)
const ev = computed(() => data.value?.data)

// ── Helpers de formato ──────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}
function displayId(rawId: string) {
  const num = rawId.replace(/\D/g, '').slice(-6).padStart(6, '0')
  return `EV-${num}`
}

// ── Parseo de arrays guardados como JSON string ─────────────────────
const hallazgos = computed<string[]>(() => {
  try { return JSON.parse(ev.value?.hallazgos || '[]') } catch { return [] }
})
const recomendaciones = computed<string[]>(() => {
  try { return JSON.parse(ev.value?.recomendaciones || '[]') } catch { return [] }
})

// ── Extracción de datos térmicos desde hallazgos ────────────────────
function parseThermal(label: 'izquierdo' | 'derecho') {
  const tag = label === 'izquierdo' ? 'Pie izquierdo' : 'Pie derecho'
  const line = hallazgos.value.find(h =>
    h.toLowerCase().startsWith(tag.toLowerCase()) && h.includes('temperatura media')
  )
  if (!line) return null
  const mean = line.match(/temperatura media ([\d.]+)°C/)
  const rango = line.match(/rango ([\d.]+)–([\d.]+)°C/)
  return {
    mean: mean ? mean[1] : '—',
    min: rango ? rango[1] : '—',
    max: rango ? rango[2] : '—',
  }
}

const thermalL = computed(() => parseThermal('izquierdo'))
const thermalR = computed(() => parseThermal('derecho'))

const symmetry = computed(() => {
  const line = hallazgos.value.find(h =>
    h.toLowerCase().includes('simetría térmica') || h.toLowerCase().includes('asimetría')
  )
  if (!line) return null
  const diff = line.match(/diferencia[:\s]+([\d.]+)°C/)
  const isNormal = line.toLowerCase().includes('normal')
  const isMod    = line.toLowerCase().includes('moderada')
  const isSig    = line.toLowerCase().includes('significativa')
  return {
    label: isNormal ? 'NORMAL' : isMod ? 'MODERADA' : isSig ? 'SIGNIFICATIVA' : 'ANORMAL',
    color: isNormal ? '#16a34a' : isMod ? '#d97706' : '#dc2626',
    diff: diff ? diff[1] : '—',
  }
})

const imageL = computed(() =>
  ev.value?.thermalImages?.find(i => i.tipoPie === 'IZQUIERDO')?.rutaImagen
)
const imageR = computed(() =>
  ev.value?.thermalImages?.find(i => i.tipoPie === 'DERECHO')?.rutaImagen
)

const riskColor: Record<string, string> = {
  BAJO: '#16a34a', MEDIO: '#d97706', ALTO: '#ea580c', CRITICO: '#dc2626',
}

function printPage() { window.print() }
</script>

<template>
  <div v-if="ev" class="report-root">

    <!-- ── Toolbar (solo en pantalla) ──────────────────────────────── -->
    <div class="toolbar no-print">
      <NuxtLink :to="`/dashboard/evaluaciones/${id}`" class="back-btn">
        ← Volver
      </NuxtLink>
      <button class="print-btn" @click="printPage">
        🖨 Imprimir / Guardar PDF
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         HOJA A4
    ══════════════════════════════════════════════════════════════ -->
    <div class="page">

      <!-- ── ENCABEZADO ─────────────────────────────────────────── -->
      <header class="header">
        <div class="header-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="rgba(255,255,255,0.15)" />
            <path d="M15 10 Q13 16 14 22 Q15 28 18 32 Q20 34 22 32 Q25 28 26 22 Q27 16 25 10 Q22 8 20 9 Q17 8 15 10Z"
                  fill="white" opacity="0.9"/>
            <circle cx="16" cy="34" r="2" fill="white" opacity="0.7"/>
            <circle cx="20" cy="36" r="2.2" fill="white" opacity="0.8"/>
            <circle cx="24" cy="34" r="1.8" fill="white" opacity="0.7"/>
            <circle cx="27" cy="32" r="1.5" fill="white" opacity="0.6"/>
            <circle cx="13" cy="32" r="1.5" fill="white" opacity="0.6"/>
          </svg>
          <div>
            <div class="logo-name">TERMOFOOT</div>
            <div class="logo-sub">SISTEMA DE TERMOGRAFÍA PLANTAR</div>
          </div>
        </div>

        <div class="header-title">
          <div class="title-main">REPORTE DE</div>
          <div class="title-main">EVALUACIÓN TERMOGRÁFICA</div>
        </div>

        <div class="header-meta">
          <div class="meta-row">
            <span class="meta-icon">📋</span>
            <span class="meta-label">ID Evaluación:</span>
            <span class="meta-value">{{ displayId(ev.id) }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-icon">📅</span>
            <span class="meta-label">Fecha:</span>
            <span class="meta-value">{{ formatDate(ev.fecha) }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-icon">🕐</span>
            <span class="meta-label">Hora:</span>
            <span class="meta-value">{{ formatTime(ev.fecha) }}</span>
          </div>
        </div>
      </header>

      <!-- ── INFO ROW ───────────────────────────────────────────── -->
      <section class="info-row">
        <div class="info-card">
          <div class="info-card-title">
            <span>👤</span> DATOS DEL PACIENTE
          </div>
          <div class="info-field"><span>Nombre:</span> {{ ev.patient?.nombre }}</div>
          <div class="info-field" v-if="ev.patient?.edad"><span>Edad:</span> {{ ev.patient.edad }} años</div>
          <div class="info-field" v-if="ev.patient?.sexo">
            <span>Sexo:</span> {{ ev.patient.sexo === 'MASCULINO' ? 'Masculino' : 'Femenino' }}
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-title">
            <span>🩺</span> MÉDICO RESPONSABLE
          </div>
          <div class="info-field">{{ ev.doctor?.nombre }}</div>
          <div class="info-field info-sub">Especialista en Pie Diabético</div>
        </div>

        <div class="info-card">
          <div class="info-card-title">
            <span>ℹ️</span> INFORMACIÓN DEL ESTUDIO
          </div>
          <div class="info-field"><span>Tipo de estudio:</span> Termografía plantar</div>
          <div class="info-field"><span>Sistema:</span> Diabeterm Evalúa</div>
          <div class="info-field">
            <span>Resultado:</span>
            <strong :style="`color: ${riskColor[ev.riesgo ?? 'BAJO']}`">
              {{ ev.riesgo }}
            </strong>
          </div>
        </div>
      </section>

      <!-- ── RESUMEN CLÍNICO ────────────────────────────────────── -->
      <section class="section">
        <div class="section-title">RESUMEN CLÍNICO</div>
        <div class="summary-row">
          <div class="summary-card">
            <div class="summary-card-header">
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <path d="M15 6 Q13 12 14 18 Q15 24 18 28 Q20 30 22 28 Q25 24 26 18 Q27 12 25 6 Q22 4 20 5 Q17 4 15 6Z" fill="#1e4fa8"/>
                <circle cx="16" cy="30" r="2" fill="#1e4fa8"/>
                <circle cx="20" cy="32" r="2.2" fill="#1e4fa8"/>
                <circle cx="24" cy="30" r="1.8" fill="#1e4fa8"/>
              </svg>
              PIE IZQUIERDO
            </div>
            <div class="summary-temp">
              {{ thermalL?.mean ?? '—' }} <span class="temp-unit">°C</span>
            </div>
            <div class="summary-range" v-if="thermalL">
              Rango: {{ thermalL.min }} – {{ thermalL.max }} °C
            </div>
            <div class="summary-range" v-else>Sin imagen térmica</div>
          </div>

          <div class="summary-card">
            <div class="summary-card-header">
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <path d="M15 6 Q13 12 14 18 Q15 24 18 28 Q20 30 22 28 Q25 24 26 18 Q27 12 25 6 Q22 4 20 5 Q17 4 15 6Z" fill="#1e4fa8"/>
                <circle cx="16" cy="30" r="2" fill="#1e4fa8"/>
                <circle cx="20" cy="32" r="2.2" fill="#1e4fa8"/>
                <circle cx="24" cy="30" r="1.8" fill="#1e4fa8"/>
              </svg>
              PIE DERECHO
            </div>
            <div class="summary-temp">
              {{ thermalR?.mean ?? '—' }} <span class="temp-unit">°C</span>
            </div>
            <div class="summary-range" v-if="thermalR">
              Rango: {{ thermalR.min }} – {{ thermalR.max }} °C
            </div>
            <div class="summary-range" v-else>Sin imagen térmica</div>
          </div>

          <div class="summary-card">
            <div class="summary-card-header">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L14 8H20L15 12L17 18L11 14L5 18L7 12L2 8H8L11 2Z" fill="none" stroke="#1e4fa8" stroke-width="1.5"/>
                <line x1="4" y1="11" x2="18" y2="11" stroke="#1e4fa8" stroke-width="1.5"/>
              </svg>
              SIMETRÍA TÉRMICA
            </div>
            <div
              class="symmetry-label"
              :style="symmetry ? `color: ${symmetry.color}` : 'color: #16a34a'"
            >
              {{ symmetry?.label ?? 'NORMAL' }}
            </div>
            <div class="summary-range" v-if="symmetry">
              Diferencia: {{ symmetry.diff }} °C (entre pies)
            </div>
            <div class="summary-range" v-else>Sin datos de comparación</div>
          </div>
        </div>
      </section>

      <!-- ── IMÁGENES TERMOGRÁFICAS ─────────────────────────────── -->
      <section v-if="imageL || imageR" class="section">
        <div class="section-title">IMÁGENES TERMOGRÁFICAS</div>
        <div class="images-row">
          <div class="image-block" v-if="imageL">
            <div class="image-label">PIE IZQUIERDO</div>
            <div class="image-wrap">
              <img :src="imageL" alt="Pie izquierdo" />
            </div>
          </div>
          <div class="image-block" v-if="imageR">
            <div class="image-label">PIE DERECHO</div>
            <div class="image-wrap">
              <img :src="imageR" alt="Pie derecho" />
            </div>
          </div>
        </div>
      </section>

      <!-- ── HALLAZGOS + RECOMENDACIONES ───────────────────────── -->
      <section class="two-col-section">
        <div class="two-col-card">
          <div class="two-col-header findings-header">
            <span>📋</span> HALLAZGOS TERMOGRÁFICOS
          </div>
          <ul class="findings-list">
            <li v-for="(h, i) in hallazgos" :key="i" class="finding-item">
              <span class="finding-check">✔</span>
              <span>{{ h }}</span>
            </li>
          </ul>
        </div>

        <div class="two-col-card">
          <div class="two-col-header recs-header">
            <span>❤️</span> RECOMENDACIONES CLÍNICAS
          </div>
          <ul class="recs-list">
            <li v-for="(r, i) in recomendaciones" :key="i" class="rec-item">
              <span class="rec-bullet">•</span>
              <span>{{ r }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- ── OBSERVACIONES + FIRMA ─────────────────────────────── -->
      <section class="two-col-section">
        <div class="two-col-card">
          <div class="two-col-header obs-header">
            <span>📝</span> OBSERVACIONES DEL MÉDICO
          </div>
          <div class="obs-box">
            {{ ev.observaciones || 'Sin observaciones adicionales.' }}
          </div>
        </div>

        <div class="two-col-card signature-card">
          <div class="two-col-header sig-header">
            <span>✏️</span> FIRMA DEL MÉDICO
          </div>
          <div class="signature-area">
            <svg width="160" height="60" viewBox="0 0 160 60">
              <path d="M20 45 Q40 20 60 38 Q80 55 100 25 Q120 5 140 35"
                    stroke="#1a3a6b" stroke-width="2" fill="none" stroke-linecap="round"/>
            </svg>
            <div class="sig-line" />
            <div class="sig-name">{{ ev.doctor?.nombre }}</div>
            <div class="sig-sub">Especialista en Pie Diabético</div>
          </div>
        </div>
      </section>

      <!-- ── FOOTER ─────────────────────────────────────────────── -->
      <footer class="report-footer">
        <div class="footer-left">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <path d="M15 6 Q13 12 14 18 Q15 24 18 28 Q20 30 22 28 Q25 24 26 18 Q27 12 25 6 Q22 4 20 5 Q17 4 15 6Z" fill="#1a3a6b"/>
            <circle cx="16" cy="30" r="2" fill="#1a3a6b"/>
            <circle cx="20" cy="32" r="2.2" fill="#1a3a6b"/>
            <circle cx="24" cy="30" r="1.8" fill="#1a3a6b"/>
          </svg>
          <div>
            <div class="footer-brand">Sistema Inteligente de Termografía Plantar</div>
            <div class="footer-sub">Reporte generado automáticamente</div>
          </div>
        </div>
        <div class="footer-qr">
          <!-- QR simbólico -->
          <svg width="44" height="44" viewBox="0 0 44 44">
            <rect width="44" height="44" fill="white"/>
            <rect x="2" y="2" width="16" height="16" fill="none" stroke="#1a3a6b" stroke-width="2"/>
            <rect x="5" y="5" width="10" height="10" fill="#1a3a6b"/>
            <rect x="26" y="2" width="16" height="16" fill="none" stroke="#1a3a6b" stroke-width="2"/>
            <rect x="29" y="5" width="10" height="10" fill="#1a3a6b"/>
            <rect x="2" y="26" width="16" height="16" fill="none" stroke="#1a3a6b" stroke-width="2"/>
            <rect x="5" y="29" width="10" height="10" fill="#1a3a6b"/>
            <rect x="26" y="26" width="4" height="4" fill="#1a3a6b"/>
            <rect x="32" y="26" width="4" height="4" fill="#1a3a6b"/>
            <rect x="26" y="32" width="4" height="4" fill="#1a3a6b"/>
            <rect x="32" y="36" width="4" height="4" fill="#1a3a6b"/>
            <rect x="38" y="32" width="4" height="4" fill="#1a3a6b"/>
          </svg>
        </div>
        <div class="footer-page">Página 1 de 1</div>
      </footer>

    </div><!-- /page -->
  </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body { background: #e5e7eb; font-family: 'Arial', sans-serif; }

/* ── Toolbar ───────────────────────────────────────── */
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px;
  background: #1a3a6b; color: white;
}
.back-btn {
  color: rgba(255,255,255,0.85); text-decoration: none; font-size: 14px; font-weight: 600;
}
.back-btn:hover { color: white; }
.print-btn {
  background: white; color: #1a3a6b;
  border: none; padding: 8px 20px; border-radius: 8px;
  font-size: 14px; font-weight: 700; cursor: pointer;
}
.print-btn:hover { background: #f0f4ff; }

/* ── Wrapper que centra la hoja ────────────────────── */
.report-root {
  min-height: 100vh;
}

/* ── Hoja A4 ───────────────────────────────────────── */
.page {
  width: 794px; margin: 24px auto;
  background: white;
  padding: 0 0 0 0;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
}

/* ── Header ─────────────────────────────────────────── */
.header {
  background: #1a3a6b;
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; gap: 16px;
  border-bottom: 4px solid #f59e0b;
}
.header-logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.logo-name { color: white; font-size: 22px; font-weight: 900; letter-spacing: 1px; }
.logo-sub  { color: rgba(255,255,255,0.65); font-size: 8px; letter-spacing: 1.5px; font-weight: 600; }

.header-title { text-align: center; flex: 1; }
.title-main { color: white; font-size: 17px; font-weight: 900; letter-spacing: 0.5px; line-height: 1.25; }

.header-meta { flex-shrink: 0; }
.meta-row { display: flex; align-items: center; gap: 6px; color: white; font-size: 11px; margin-bottom: 4px; }
.meta-icon { font-size: 12px; }
.meta-label { color: rgba(255,255,255,0.7); }
.meta-value { font-weight: 700; }

/* ── Info row ────────────────────────────────────────── */
.info-row {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 0; border-bottom: 1px solid #d1d5db;
}
.info-card {
  padding: 12px 16px;
  background: #f0f4f9;
  border-right: 1px solid #d1d5db;
}
.info-card:last-child { border-right: none; }
.info-card-title {
  font-size: 10px; font-weight: 800; color: #1a3a6b;
  letter-spacing: 0.5px; margin-bottom: 8px;
  display: flex; align-items: center; gap: 5px;
  border-bottom: 1.5px solid #1a3a6b; padding-bottom: 5px;
}
.info-field { font-size: 11px; color: #374151; margin-bottom: 3px; }
.info-field span { font-weight: 700; color: #1a3a6b; margin-right: 4px; }
.info-sub { color: #6b7280; font-style: italic; }

/* ── Secciones ───────────────────────────────────────── */
.section { padding: 14px 20px; border-bottom: 1px solid #e5e7eb; }
.section-title {
  font-size: 11px; font-weight: 800; color: #1a3a6b;
  letter-spacing: 1px; margin-bottom: 10px;
  padding-bottom: 5px; border-bottom: 2px solid #1a3a6b;
}

/* ── Resumen clínico ─────────────────────────────────── */
.summary-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.summary-card {
  border: 1.5px solid #cbd5e1; border-radius: 8px;
  padding: 12px 14px; background: #f8fafc;
}
.summary-card-header {
  font-size: 10px; font-weight: 800; color: #1a3a6b;
  letter-spacing: 0.5px; margin-bottom: 8px;
  display: flex; align-items: center; gap: 6px;
}
.summary-temp {
  font-size: 30px; font-weight: 900; color: #1a3a6b; line-height: 1;
}
.temp-unit { font-size: 16px; font-weight: 700; }
.summary-range { font-size: 10px; color: #6b7280; margin-top: 4px; }
.symmetry-label { font-size: 22px; font-weight: 900; margin-top: 4px; }

/* ── Imágenes ────────────────────────────────────────── */
.images-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.image-block { border-radius: 6px; overflow: hidden; border: 1px solid #374151; }
.image-label {
  background: #1a3a6b; color: white;
  font-size: 10px; font-weight: 800; letter-spacing: 1px;
  text-align: center; padding: 5px;
}
.image-wrap { background: #111827; text-align: center; }
.image-wrap img { width: 100%; max-height: 200px; object-fit: contain; }

/* ── Dos columnas ────────────────────────────────────── */
.two-col-section {
  display: grid; grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #e5e7eb;
}
.two-col-card { padding: 14px 16px; border-right: 1px solid #e5e7eb; }
.two-col-card:last-child { border-right: none; }
.two-col-header {
  font-size: 10px; font-weight: 800; letter-spacing: 0.5px;
  margin-bottom: 10px; padding-bottom: 5px;
  display: flex; align-items: center; gap: 5px;
  border-bottom: 1.5px solid;
}
.findings-header { color: #1a3a6b; border-color: #1a3a6b; }
.recs-header     { color: #0d6e6e; border-color: #0d6e6e; }
.obs-header      { color: #4b5563; border-color: #9ca3af; }
.sig-header      { color: #4b5563; border-color: #9ca3af; }

/* hallazgos */
.findings-list { list-style: none; }
.finding-item {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 10px; color: #374151; margin-bottom: 5px; line-height: 1.4;
}
.finding-check { color: #1a3a6b; font-weight: 900; flex-shrink: 0; margin-top: 1px; }

/* recomendaciones */
.recs-list { list-style: none; }
.rec-item {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 10px; color: #374151; margin-bottom: 5px; line-height: 1.4;
}
.rec-bullet { color: #0d6e6e; font-size: 16px; line-height: 1; flex-shrink: 0; }

/* observaciones */
.obs-box {
  font-size: 10px; color: #374151; line-height: 1.6;
  min-height: 80px; padding: 8px;
  border: 1px solid #d1d5db; border-radius: 6px;
  background: #fafafa;
}

/* firma */
.signature-card { display: flex; flex-direction: column; }
.signature-area { display: flex; flex-direction: column; align-items: center; padding-top: 4px; }
.sig-line { width: 180px; border-top: 1.5px solid #374151; margin-top: 4px; }
.sig-name { font-size: 11px; font-weight: 700; color: #1a3a6b; margin-top: 4px; }
.sig-sub  { font-size: 9px; color: #6b7280; }

/* ── Footer ──────────────────────────────────────────── */
.report-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 20px;
  background: #f0f4f9; border-top: 2px solid #1a3a6b;
}
.footer-left { display: flex; align-items: center; gap: 8px; }
.footer-brand { font-size: 10px; font-weight: 700; color: #1a3a6b; }
.footer-sub   { font-size: 8px; color: #6b7280; }
.footer-page  { font-size: 9px; color: #6b7280; font-weight: 600; }

/* ── Print ───────────────────────────────────────────── */
@media print {
  body { background: white !important; }
  .no-print { display: none !important; }
  .page {
    width: 100%; margin: 0; box-shadow: none;
    page-break-inside: avoid;
  }
  .two-col-section { page-break-inside: avoid; }
  @page {
    size: A4;
    margin: 0;
  }
}
</style>
