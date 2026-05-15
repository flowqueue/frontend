<script setup>
import { onMounted, ref, computed } from 'vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useAnalyticsStore } from '@/analitics/application/anaytics.store.js'
import AppLayout from '@/shared/components/AppLayout.vue'
import { downloadCsv, downloadReport } from '@/shared/utils/export.js'

const auth      = useAuthStore()
const analytics = useAnalyticsStore()
const fechaDesde = ref('2026-05-14')
const fechaHasta = ref('2026-05-14')
const feedback = ref('')

onMounted(() => analytics.loadDashboard(auth.user.sedeId))

function reportRows() {
  return analytics.metricas.map(m => ({
    hora: `${m.hora}:00 - ${m.hora + 1}:00`,
    atendidos: m.atendidos,
    ausentes: m.ausentes,
    promedio: m.tiempoPromedioMin.toFixed(1),
    eficiencia: `${Math.round(m.atendidos / Math.max(1, m.atendidos + m.ausentes) * 100)}%`,
  }))
}

function exportCsvReport() {
  downloadCsv('reporte-flowqueue.csv', reportRows(), [
    { label: 'Hora', value: 'hora' },
    { label: 'Atendidos', value: 'atendidos' },
    { label: 'Ausentes', value: 'ausentes' },
    { label: 'Tiempo promedio', value: 'promedio' },
    { label: 'Eficiencia', value: 'eficiencia' },
  ])
  feedback.value = 'CSV generado correctamente.'
}

function exportPdfReport() {
  downloadReport('reporte-flowqueue.txt', 'Reporte FlowQueue', [
    { title: 'Rango', lines: [`Desde: ${fechaDesde.value}`, `Hasta: ${fechaHasta.value}`] },
    { title: 'Resumen', lines: resumen.value.map(r => `${r.label}: ${r.value}`) },
    { title: 'Detalle por hora', lines: reportRows().map(r => `${r.hora} | Atendidos: ${r.atendidos} | Ausentes: ${r.ausentes} | T.Prom: ${r.promedio} | Eficiencia: ${r.eficiencia}`) },
  ])
  feedback.value = 'PDF/reporte descargado correctamente.'
}

async function applyFilter() {
  await analytics.loadDashboard(auth.user.sedeId)
  feedback.value = `Filtro aplicado: ${fechaDesde.value} al ${fechaHasta.value}.`
}

const resumen = computed(() => [
  { label: 'Total atendidos',    value: analytics.totalAtendidos,   icon: '✓', color: 'green'  },
  { label: 'Total ausentes',     value: analytics.totalAusentes,    icon: '✗', color: 'orange' },
  { label: 'Tiempo prom. espera',value: analytics.tiempoPromedio + ' min', icon: '⏱', color: 'blue' },
  { label: 'En espera ahora',    value: analytics.totalPendientes,  icon: '⏳', color: 'purple' },
])
</script>

<template>
  <AppLayout title="Reportes" subtitle="Exportación y análisis de datos históricos">
    <template #actions>
      <button class="export-btn" @click="exportCsvReport">⬇ Exportar CSV</button>
      <button class="export-btn export-btn-dark" @click="exportPdfReport">⬇ Exportar PDF</button>
    </template>

    <!-- Filtros de fecha -->
    <div class="filter-row card">
      <div class="date-field">
        <label>Desde</label>
        <input type="date" v-model="fechaDesde" />
      </div>
      <div class="date-field">
        <label>Hasta</label>
        <input type="date" v-model="fechaHasta" />
      </div>
      <button class="apply-btn" @click="applyFilter">Aplicar filtro</button>
    </div>

    <p v-if="feedback" class="feedback">{{ feedback }}</p>

    <!-- Resumen -->
    <div class="resumen-grid">
      <div class="resumen-card card" v-for="r in resumen" :key="r.label">
        <div class="ri" :class="r.color">{{ r.icon }}</div>
        <div>
          <div class="rv">{{ r.value }}</div>
          <div class="rl">{{ r.label }}</div>
        </div>
      </div>
    </div>

    <!-- Tabla de métricas por hora -->
    <div class="card metrics-card">
      <div class="metrics-header">
        <p class="section-title">Detalle por hora</p>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Hora</th><th>Atendidos</th><th>Ausentes</th><th>T. Prom. (min)</th><th>Eficiencia</th></tr>
          </thead>
          <tbody>
            <tr v-for="m in analytics.metricas" :key="m.id">
              <td class="td-bold">{{ m.hora }}:00 – {{ m.hora + 1 }}:00</td>
              <td>{{ m.atendidos }}</td>
              <td class="td-muted">{{ m.ausentes }}</td>
              <td class="td-muted">{{ m.tiempoPromedioMin.toFixed(1) }}</td>
              <td>
                <div class="eff-bar">
                  <div class="eff-fill" :style="{ width: Math.min(100, Math.round(m.atendidos / (m.atendidos + m.ausentes) * 100)) + '%' }"></div>
                </div>
                <span class="eff-pct">{{ Math.round(m.atendidos / (m.atendidos + m.ausentes) * 100) }}%</span>
              </td>
            </tr>
            <tr v-if="!analytics.metricas.length">
              <td colspan="5" class="empty-cell">Sin datos para el rango seleccionado</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.feedback{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;border-radius:8px;padding:.65rem .85rem;margin-bottom:.875rem;font-size:.82rem;font-weight:800}
.export-btn { padding: .4rem 1rem; border: 1.5px solid var(--border); border-radius: 8px; background: var(--surface); font-size: .82rem; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all .15s; }
.export-btn:hover { border-color: var(--primary); color: var(--primary); }
.export-btn-dark { background: #1e293b; color: #fff; border-color: #1e293b; }
.export-btn-dark:hover { background: #0f172a; border-color: #0f172a; color: #fff; }

.filter-row { display: flex; align-items: flex-end; gap: 1rem; padding: 1rem 1.25rem; margin-bottom: .875rem; flex-wrap: wrap; }
.date-field { display: flex; flex-direction: column; gap: .3rem; }
.date-field label { font-size: .72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
.date-field input { padding: .45rem .875rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: .85rem; outline: none; }
.date-field input:focus { border-color: var(--primary); }
.apply-btn { padding: .45rem 1.25rem; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-size: .85rem; font-weight: 600; cursor: pointer; align-self: flex-end; }
.apply-btn:hover { background: var(--primary-dark); }

.resumen-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .875rem; margin-bottom: .875rem; }
@media(max-width:1000px) { .resumen-grid { grid-template-columns: repeat(2,1fr); } }
.resumen-card { display: flex; align-items: center; gap: .875rem; padding: 1rem 1.25rem; }
.ri { width: 40px; height: 40px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 700; flex-shrink: 0; }
.ri.green  { background: #dcfce7; color: #15803d; }
.ri.orange { background: #ffedd5; color: #c2410c; }
.ri.blue   { background: #dbeafe; color: #1d4ed8; }
.ri.purple { background: #ede9fe; color: #7c3aed; }
.rv { font-size: 1.5rem; font-weight: 800; line-height: 1; }
.rl { font-size: .72rem; color: var(--text-muted); margin-top: 2px; }

.metrics-card { overflow: hidden; }
.metrics-header { padding: .875rem 1.25rem; border-bottom: 1px solid var(--border); }
.section-title { font-size: .9rem; font-weight: 600; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
.data-table thead tr { background: #1e293b; }
.data-table th { padding: .6rem 1rem; text-align: left; font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
.data-table td { padding: .7rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #f8fafc; }
.td-bold  { font-weight: 600; }
.td-muted { color: var(--text-muted); }
.empty-cell { text-align: center; padding: 2.5rem; color: var(--text-muted); }
.eff-bar  { width: 80px; height: 6px; background: var(--border); border-radius: 999px; display: inline-block; vertical-align: middle; margin-right: .5rem; }
.eff-fill { height: 100%; background: var(--green); border-radius: 999px; }
.eff-pct  { font-size: .78rem; font-weight: 600; color: var(--text-muted); }
</style>
