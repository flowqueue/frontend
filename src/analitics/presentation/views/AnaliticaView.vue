<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/shared/components/AppLayout.vue'
import { useAnalyticsStore } from '@/analitics/application/anaytics.store.js'

const analytics = useAnalyticsStore()
const selectedSede = ref(1)

onMounted(() => analytics.loadDashboard(selectedSede.value))

async function changeSede() {
  await analytics.changeSede(Number(selectedSede.value))
}

const maxAtendidos = computed(() => Math.max(...analytics.metricas.map(m => m.atendidos), 1))
const peakHour = computed(() => {
  if (!analytics.metricas.length) return 'N/A'
  const best = [...analytics.metricas].sort((a, b) => b.atendidos - a.atendidos)[0]
  return `${String(best.hora).padStart(2, '0')}:00`
})
const absenceRate = computed(() => {
  const total = analytics.totalAtendidos + analytics.totalAusentes
  if (!total) return '0%'
  return `${((analytics.totalAusentes / total) * 100).toFixed(1)}%`
})
const serviceLoad = computed(() => {
  const groups = {}
  analytics.tickets.forEach(t => { groups[t.servicioId] = (groups[t.servicioId] ?? 0) + 1 })
  return Object.entries(groups).map(([servicioId, total]) => ({ servicioId, total })).sort((a, b) => b.total - a.total)
})
function serviceName(id) {
  return analytics.mostradores.find(m => String(m.servicioId) === String(id))?.servicioNombre ?? `Servicio ${id}`
}
</script>

<template>
  <AppLayout title="Analítica" subtitle="Indicadores para tomar decisiones por sede y horario">
    <template #actions>
      <select v-model="selectedSede" class="sede-select" @change="changeSede">
        <option v-for="s in analytics.sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
      </select>
    </template>

    <div v-if="analytics.loading" class="loading-screen"><div class="spinner"></div><p>Cargando analítica...</p></div>

    <template v-else>
      <div class="kpi-grid">
        <div class="card kpi-card"><span class="kpi-label">Atendidos</span><strong>{{ analytics.totalAtendidos }}</strong><p>Turnos completados hoy</p></div>
        <div class="card kpi-card"><span class="kpi-label">Tiempo promedio</span><strong>{{ analytics.tiempoPromedio }} min</strong><p>Promedio de espera estimado</p></div>
        <div class="card kpi-card"><span class="kpi-label">Hora pico</span><strong>{{ peakHour }}</strong><p>Mayor volumen de atención</p></div>
        <div class="card kpi-card"><span class="kpi-label">Ausencias</span><strong>{{ absenceRate }}</strong><p>Ratio sobre turnos procesados</p></div>
      </div>

      <section class="card chart-card">
        <div class="section-head">
          <div><p class="eyebrow">Demanda horaria</p><h2>Atenciones por hora</h2></div>
          <span class="badge badge-blue">{{ analytics.metricas.length }} bloques</span>
        </div>
        <div class="bar-chart">
          <div v-for="m in analytics.metricas" :key="m.id" class="bar-item">
            <div class="bar-track"><div class="bar-fill" :style="{ height: `${Math.max(8, (m.atendidos / maxAtendidos) * 100)}%` }"></div></div>
            <span>{{ m.hora }}h</span>
          </div>
        </div>
      </section>

      <div class="analytics-grid">
        <section class="card insight-card">
          <p class="eyebrow">Carga por servicio</p>
          <h2>Servicios con más demanda</h2>
          <div class="service-list">
            <div v-for="s in serviceLoad" :key="s.servicioId" class="service-row">
              <div><strong>{{ serviceName(s.servicioId) }}</strong><span>{{ s.total }} turnos</span></div>
              <div class="progress"><span :style="{ width: `${Math.min(100, s.total * 10)}%` }"></span></div>
            </div>
          </div>
        </section>

        <section class="card insight-card">
          <p class="eyebrow">Recomendaciones</p>
          <h2>Acciones sugeridas</h2>
          <ul class="recommendations">
            <li>Reforzar ventanillas cerca de la hora pico {{ peakHour }}.</li>
            <li>Monitorear los servicios con mayor carga antes de abrir nuevos tickets.</li>
            <li>Revisar ausencias para ajustar notificaciones y llamados.</li>
          </ul>
        </section>
      </div>
    </template>
  </AppLayout>
</template>

<style scoped>
.sede-select { border: 1.5px solid var(--border); border-radius: 8px; padding: .45rem .7rem; background: #fff; color: var(--text); }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .875rem; margin-bottom: 1rem; }
.kpi-card { padding: 1.1rem 1.25rem; border-top: 3px solid var(--primary); }
.kpi-label, .eyebrow { font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); }
.kpi-card strong { display: block; font-size: 2rem; color: var(--primary); margin: .35rem 0 .2rem; }
.kpi-card p { color: var(--text-muted); font-size: .78rem; }
.chart-card, .insight-card { padding: 1.25rem; }
.section-head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 1.2rem; }
h2 { font-size: 1.05rem; color: var(--text); margin-top: .2rem; }
.bar-chart { height: 250px; display: flex; align-items: end; gap: .75rem; padding: 1rem .25rem .25rem; }
.bar-item { flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; gap: .5rem; color: var(--text-muted); font-size: .72rem; }
.bar-track { flex: 1; width: 100%; max-width: 36px; border-radius: 999px; background: #e2e8f0; display: flex; align-items: end; overflow: hidden; }
.bar-fill { width: 100%; border-radius: 999px 999px 0 0; background: linear-gradient(180deg, var(--teal), var(--primary)); }
.analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
.service-list { display: flex; flex-direction: column; gap: .9rem; margin-top: 1rem; }
.service-row { display: grid; grid-template-columns: 180px 1fr; gap: .8rem; align-items: center; }
.service-row strong { display: block; font-size: .86rem; }
.service-row span { display: block; color: var(--text-muted); font-size: .75rem; margin-top: .15rem; }
.progress { height: 9px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.progress span { display: block; height: 100%; background: var(--green); }
.recommendations { margin-top: 1rem; padding-left: 1.1rem; color: var(--text-muted); line-height: 1.8; font-size: .88rem; }
.loading-screen { min-height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-muted); }
.spinner { width: 34px; height: 34px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media(max-width:1000px){ .kpi-grid, .analytics-grid { grid-template-columns: repeat(2,1fr); } }
@media(max-width:640px){ .kpi-grid, .analytics-grid, .service-row { grid-template-columns: 1fr; } }
</style>
