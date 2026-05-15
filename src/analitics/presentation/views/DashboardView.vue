<script setup>
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useAnalyticsStore } from '@/analitics/application/anaytics.store.js'
import Sidebar from '@/shared/components/Sidebar.vue'

const auth      = useAuthStore()
const analytics = useAnalyticsStore()

onMounted(() => analytics.loadDashboard(auth.user.sedeId))

const today = new Date().toLocaleDateString('es-PE', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

const currentSede = computed(() =>
  analytics.sedes.find(s => String(s.id) === String(analytics.sedeId))
)

/* Chart */
const maxAtendidos = computed(() => Math.max(...analytics.metricas.map(m => m.atendidos), 1))
function barPct(val) { return `${Math.round((val / maxAtendidos.value) * 100)}%` }

/* KPIs — 4 cards como en el Figma */
const kpis = computed(() => [
  { label: 'En espera',      value: analytics.totalPendientes, unit: 'personas', color: 'blue'   },
  { label: 'Atendidos hoy', value: analytics.totalAtendidos,  unit: 'turnos',   color: 'green'  },
  { label: 'T. espera prom.',value: `${analytics.tiempoPromedio}`, unit: 'minutos', color: 'orange' },
  { label: 'Satisfacción',  value: '87',                      unit: '%',        color: 'teal'   },
])

/* Operadores en la sede */
const operadores = computed(() => analytics.mostradores.filter(m => m.operadorNombre))

/* Tabla historial */
const recentTickets = computed(() =>
  [...analytics.tickets]
    .filter(t => t.estado !== 'en_espera')
    .sort((a, b) => new Date(b.horaLlamado ?? b.horaIngreso) - new Date(a.horaLlamado ?? a.horaIngreso))
    .slice(0, 10)
)

const ticketBadge = e => ({ en_atencion:'badge-blue', atendido:'badge-green', ausente:'badge-red', en_espera:'badge-orange' }[e] ?? 'badge-gray')
const ticketLabel = e => ({ en_atencion:'En atención', atendido:'Atendido', ausente:'Ausente', en_espera:'En espera' }[e] ?? e)
const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' }) : '--:--'
const waitMin  = (a, b) => a && b ? Math.floor((new Date(b) - new Date(a)) / 60000) + ' min' : '--'
</script>

<template>
  <div class="app-shell">
    <Sidebar />

    <div class="app-main">
      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar-left">
          <p class="topbar-greeting">Buenos días, {{ auth.user?.nombre?.split(' ')[0] }}</p>
          <p class="topbar-sub" style="text-transform:capitalize">
            {{ today }} · {{ currentSede?.nombre ?? 'Sede' }}
          </p>
        </div>
        <div class="topbar-actions">
          <select class="sede-select" @change="analytics.changeSede(+$event.target.value)" :value="analytics.sedeId">
            <option v-for="s in analytics.sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
          <div class="user-bubble">{{ auth.user?.nombre?.charAt(0) }}</div>
        </div>
      </header>

      <main class="page-content" v-if="!analytics.loading">

        <!-- KPI row — 4 cards -->
        <div class="kpi-row">
          <div class="kpi-card card" v-for="k in kpis" :key="k.label">
            <div class="kpi-dot" :class="k.color"></div>
            <div class="kpi-body">
              <div class="kpi-value">{{ k.value }}<span class="kpi-unit"> {{ k.unit }}</span></div>
              <div class="kpi-label">{{ k.label }}</div>
            </div>
          </div>
        </div>

        <!-- Middle: chart + operadores -->
        <div class="mid-row">

          <!-- Bar chart -->
          <section class="card chart-card">
            <div class="card-header">
              <div>
                <p class="section-title">Turnos atendidos por hora</p>
                <p class="section-sub">{{ currentSede?.nombre ?? 'Sede' }} · hoy</p>
              </div>
              <span class="badge badge-gray">En vivo</span>
            </div>
            <div class="chart-body">
              <div class="chart-grid">
                <div class="y-labels">
                  <span>{{ maxAtendidos }}</span>
                  <span>{{ Math.round(maxAtendidos * 0.66) }}</span>
                  <span>{{ Math.round(maxAtendidos * 0.33) }}</span>
                  <span>0</span>
                </div>
                <div class="bars-area">
                  <div class="grid-lines">
                    <div class="grid-line" v-for="i in 4" :key="i"></div>
                  </div>
                  <div class="bars">
                    <div class="bar-col" v-for="m in analytics.metricas" :key="m.id">
                      <div class="bar" :style="{ height: barPct(m.atendidos) }" :title="`${m.hora}h: ${m.atendidos} atendidos`">
                        <span class="bar-tip">{{ m.atendidos }}</span>
                      </div>
                      <span class="bar-x">{{ m.hora }}h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Operadores -->
          <section class="card operators-card">
            <div class="card-header">
              <p class="section-title">Rendimiento de operadores</p>
            </div>
            <table class="inner-table">
              <thead>
                <tr>
                  <th>Operador</th>
                  <th>Ventana</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in operadores" :key="m.id">
                  <td>
                    <div class="op-cell">
                      <div class="op-av">{{ m.operadorNombre.charAt(0) }}</div>
                      <span class="op-name">{{ m.operadorNombre.split(' ')[0] }} {{ m.operadorNombre.split(' ')[1] }}</span>
                    </div>
                  </td>
                  <td class="td-muted">M{{ m.numero }}</td>
                  <td>
                    <span class="badge" :class="m.estado === 'activo' ? 'badge-green' : 'badge-gray'">
                      {{ m.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!operadores.length">
                  <td colspan="3" class="empty-cell">Sin operadores</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <!-- History table -->
        <section class="card history-card">
          <div class="card-header">
            <p class="section-title">Historial del día</p>
            <span class="badge badge-gray">{{ recentTickets.length }} registros</span>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Turno</th>
                  <th>Ciudadano</th>
                  <th>DNI</th>
                  <th>Institución</th>
                  <th>Ingreso</th>
                  <th>Llamado</th>
                  <th>T. espera</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in recentTickets" :key="t.id">
                  <td class="td-code">{{ t.codigo }}</td>
                  <td>{{ t.ciudadanoNombre }}</td>
                  <td class="td-muted">{{ t.ciudadanoDNI }}</td>
                  <td class="td-muted">RENIEC</td>
                  <td class="td-muted">{{ fmtTime(t.horaIngreso) }}</td>
                  <td class="td-muted">{{ fmtTime(t.horaLlamado) }}</td>
                  <td class="td-muted">{{ waitMin(t.horaIngreso, t.horaLlamado) }}</td>
                  <td><span class="badge" :class="ticketBadge(t.estado)">{{ ticketLabel(t.estado) }}</span></td>
                </tr>
                <tr v-if="!recentTickets.length">
                  <td colspan="8" class="empty-cell">Sin registros</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>

      <div v-else class="loading-screen">
        <div class="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Topbar */
.topbar-left { flex: 1; }
.topbar-greeting { font-size: 1rem; font-weight: 700; color: var(--text); }
.topbar-sub      { font-size: 0.78rem; color: var(--text-muted); margin-top: 1px; }
.topbar-actions  { display: flex; align-items: center; gap: 0.75rem; }
.sede-select {
  padding: 0.4rem 0.875rem;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 0.82rem;
  color: var(--text);
  background: var(--surface);
  cursor: pointer; outline: none;
}
.sede-select:focus { border-color: var(--primary); }
.user-bubble {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--primary);
  color: #fff; font-weight: 700; font-size: 0.875rem;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
}

/* KPI row — 4 cards */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.875rem;
  margin-bottom: 0.875rem;
}
@media (max-width: 1100px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }

.kpi-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
}
.kpi-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.kpi-dot.blue   { background: #3b82f6; }
.kpi-dot.green  { background: #22c55e; }
.kpi-dot.orange { background: #f59e0b; }
.kpi-dot.teal   { background: #5DCAA5; }

.kpi-body { display: flex; flex-direction: column; }
.kpi-value { font-size: 1.7rem; font-weight: 800; color: var(--text); line-height: 1; }
.kpi-unit  { font-size: 0.8rem; font-weight: 400; color: var(--text-muted); }
.kpi-label { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem; }

/* Mid row */
.mid-row {
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  gap: 0.875rem;
  margin-bottom: 0.875rem;
}
@media (max-width: 960px) { .mid-row { grid-template-columns: 1fr; } }

/* Card header */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}
.section-title { font-size: 0.9rem; font-weight: 600; color: var(--text); }
.section-sub   { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

/* Bar chart */
.chart-card { display: flex; flex-direction: column; }
.chart-body { padding: 1rem 1.25rem 0.875rem; flex: 1; }
.chart-grid { display: flex; gap: 0.5rem; height: 190px; }

.y-labels {
  display: flex; flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 0.65rem; color: var(--text-light);
  padding-bottom: 1.4rem;
  width: 24px; flex-shrink: 0;
}

.bars-area {
  flex: 1; position: relative;
  display: flex; flex-direction: column;
}
.grid-lines {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  justify-content: space-between;
  padding-bottom: 1.4rem;
  pointer-events: none;
}
.grid-line {
  width: 100%; height: 1px;
  background: var(--border);
}

.bars {
  position: absolute; inset: 0;
  display: flex;
  align-items: flex-end;
  gap: 0.3rem;
  padding-bottom: 1.4rem;
}
.bar-col {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center;
  height: 100%; justify-content: flex-end;
}
.bar {
  width: 100%; max-width: 28px;
  background: #334155;
  border-radius: 3px 3px 0 0;
  min-height: 3px;
  position: relative;
  transition: height 0.35s ease;
}
.bar:hover { background: var(--primary); }
.bar-tip {
  position: absolute;
  top: -18px; left: 50%; transform: translateX(-50%);
  font-size: 0.62rem; font-weight: 600;
  color: var(--text-muted); white-space: nowrap;
}
.bar-x {
  font-size: 0.65rem; color: var(--text-light);
  margin-top: 4px; position: absolute; bottom: 0;
}

/* Operators */
.operators-card { display: flex; flex-direction: column; overflow: hidden; }
.inner-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.inner-table thead tr { background: #1e293b; }
.inner-table th {
  padding: 0.55rem 1rem; text-align: left;
  font-size: 0.72rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: #94a3b8;
}
.inner-table td { padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); }
.inner-table tbody tr:last-child td { border-bottom: none; }
.inner-table tbody tr:hover td { background: #f8fafc; }
.op-cell { display: flex; align-items: center; gap: 0.5rem; }
.op-av {
  width: 26px; height: 26px; border-radius: 50%;
  background: #e2e8f0; color: var(--text);
  font-size: 0.72rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.op-name { font-size: 0.82rem; font-weight: 500; }
.td-muted { color: var(--text-muted); }
.empty-cell { text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem; }

/* History */
.history-card { overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.data-table thead tr { background: #1e293b; }
.data-table th {
  padding: 0.6rem 1rem; text-align: left;
  font-size: 0.72rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;
}
.data-table td { padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #f8fafc; }
.td-code { font-weight: 700; color: var(--primary); }

/* Loading */
.loading-screen {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1rem;
  color: var(--text-muted);
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--border); border-top-color: var(--primary);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
