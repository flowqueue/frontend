<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useOperatorStore } from '@/operator/application/Operation.Store.js'
import AppLayout from '@/shared/components/AppLayout.vue'
import { formatTime, minutesSince, formatMinutes } from '@/shared/utils/format.js'

const auth     = useAuthStore()
const operator = useOperatorStore()
const elapsed  = ref('00:00')
let timer = null

function updateElapsed() {
  if (!operator.currentTicket?.horaLlamado) { elapsed.value = '00:00'; return }
  const s = Math.floor((Date.now() - new Date(operator.currentTicket.horaLlamado)) / 1000)
  elapsed.value = `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

onMounted(async () => {
  await operator.loadDashboard(auth.user.mostradorId)
  timer = setInterval(updateElapsed, 1000)
})
onUnmounted(() => clearInterval(timer))

async function callNext() {
  await operator.callNext()
  updateElapsed()
}

const stats = computed(() => [
  { label: 'En espera',  value: operator.queueCount, color: '#3b82f6' },
  { label: 'Atendidos',  value: 4,                   color: '#22c55e' },
  { label: 'Ausentes',   value: 1,                   color: '#f59e0b' },
  { label: 'T. prom.',   value: '12 min',             color: '#8b5cf6' },
])

const subtitle = computed(() =>
  operator.mostrador
    ? `Ventana ${operator.mostrador.numero} · ${operator.mostrador.servicioNombre} · ${operator.mostrador.sedeNombre}`
    : 'Cargando...'
)
</script>

<template>
  <AppLayout title="Panel Operador" :subtitle="subtitle">
    <template #actions>
      <button class="tbtn tbtn-ghost" :disabled="!!operator.currentTicket || !operator.queueCount" @click="callNext()">
        Llamar siguiente
      </button>
      <button class="tbtn tbtn-dark" :disabled="!operator.currentTicket" @click="operator.markComplete()">
        ✓ &nbsp;Completar turno
      </button>
    </template>

    <div v-if="operator.loading" class="loading-screen">
      <div class="spinner"></div><p>Cargando panel...</p>
    </div>

    <template v-else>
      <!-- Turno activo -->
      <div class="attention-card card" v-if="operator.currentTicket">
        <div class="att-left">
          <p class="att-label">En atención ahora</p>
          <div class="att-code">{{ operator.currentTicket.codigo }}</div>
          <div class="att-citizen">{{ operator.currentTicket.ciudadanoNombre }}</div>
          <div class="att-meta">
            DNI {{ operator.currentTicket.ciudadanoDNI }} &nbsp;·&nbsp;
            Llamado {{ formatTime(operator.currentTicket.horaLlamado) }} &nbsp;·&nbsp;
            Ventana {{ operator.mostrador?.numero }}
          </div>
          <div class="att-actions">
            <button class="pill-btn pill-danger" @click="operator.markAbsent()">✗ Marcar ausente</button>
          </div>
        </div>
        <div class="att-right">
          <span class="elapsed-num">{{ elapsed }}</span>
          <span class="elapsed-lbl">tiempo en atención</span>
        </div>
      </div>

      <div class="no-turn card" v-else>
        <div>
          <p class="no-turn-title">Sin turno activo</p>
          <p class="no-turn-sub">Llama el siguiente turno de la cola para iniciar la atención</p>
        </div>
        <button class="pill-btn pill-dark pill-lg" :disabled="!operator.queueCount" @click="callNext()">
          {{ operator.queueCount ? '▶  Llamar siguiente turno' : 'Cola vacía' }}
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card card" v-for="s in stats" :key="s.label">
          <div class="stat-dot" :style="{ background: s.color }"></div>
          <div>
            <div class="stat-val">{{ s.value }}</div>
            <div class="stat-lbl">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Cola -->
      <div class="card table-card">
        <div class="table-hdr">
          <p class="section-title">Cola de espera</p>
          <span class="badge badge-dark">{{ operator.queueCount }} turnos</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Código</th><th>Ciudadano</th><th>DNI</th><th>Espera</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr v-if="!operator.queue.length">
                <td colspan="6" class="empty-cell">No hay turnos en espera</td>
              </tr>
              <tr v-for="(t, i) in operator.queue" :key="t.id" :class="{ 'row-next': i === 0 }">
                <td class="td-num">{{ i + 1 }}</td>
                <td class="td-code">{{ t.codigo }}</td>
                <td>{{ t.ciudadanoNombre }}</td>
                <td class="td-muted">{{ t.ciudadanoDNI }}</td>
                <td class="td-muted">{{ formatMinutes(minutesSince(t.horaIngreso)) }}</td>
                <td class="td-actions">
                  <button class="pill-btn pill-dark" :disabled="!!operator.currentTicket" @click="operator.callNext(t.id)">Atender</button>
                  <button class="pill-btn pill-ghost" @click="operator.skipTicket(t.id)">Saltar</button>
                  <button class="pill-btn pill-ghost" @click="operator.markAbsent(t.id)">Ausente</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<style scoped>
.tbtn { padding: 0.4rem 1rem; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all .15s; }
.tbtn:disabled { opacity: .4; cursor: not-allowed; }
.tbtn-ghost { background: transparent; border: 1.5px solid var(--border); color: var(--text-muted); }
.tbtn-ghost:hover:not(:disabled) { border-color: var(--text-muted); color: var(--text); }
.tbtn-dark  { background: #1e293b; border: none; color: #fff; }
.tbtn-dark:hover:not(:disabled)  { background: #0f172a; }

.pill-btn { display: inline-flex; align-items: center; padding: 0.28rem 0.85rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; border: none; cursor: pointer; transition: all .15s; white-space: nowrap; }
.pill-btn:disabled { opacity: .4; cursor: not-allowed; }
.pill-dark   { background: #1e293b; color: #fff; }
.pill-dark:hover:not(:disabled)   { background: #0f172a; }
.pill-ghost  { background: #f1f5f9; color: var(--text-muted); border: 1px solid var(--border); }
.pill-ghost:hover:not(:disabled)  { background: #e2e8f0; }
.pill-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.pill-danger:hover:not(:disabled) { background: #fecaca; }
.pill-lg { padding: .55rem 1.5rem; font-size: .875rem; }

.attention-card { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 2rem; margin-bottom: .875rem; border-top: 3px solid var(--primary); }
.att-label   { font-size: .7rem; text-transform: uppercase; letter-spacing: .1em; color: var(--text-muted); margin-bottom: .5rem; }
.att-code    { font-size: 3.2rem; font-weight: 900; color: var(--primary); line-height: 1; }
.att-citizen { font-size: 1.1rem; font-weight: 600; margin: .3rem 0 .2rem; }
.att-meta    { font-size: .78rem; color: var(--text-muted); margin-bottom: 1rem; }
.att-actions { display: flex; gap: .5rem; }
.att-right   { display: flex; flex-direction: column; align-items: flex-end; }
.elapsed-num { font-size: 2.5rem; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; line-height: 1; }
.elapsed-lbl { font-size: .72rem; color: var(--text-muted); margin-top: 4px; }

.no-turn { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.5rem 2rem; margin-bottom: .875rem; border-top: 3px solid var(--border); }
.no-turn-title { font-weight: 600; font-size: .95rem; }
.no-turn-sub   { font-size: .8rem; color: var(--text-muted); margin-top: .2rem; }

.stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: .875rem; margin-bottom: .875rem; }
.stat-card { padding: 1rem 1.25rem; display: flex; align-items: center; gap: .875rem; }
.stat-dot  { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.stat-val  { font-size: 1.6rem; font-weight: 800; color: var(--text); line-height: 1; }
.stat-lbl  { font-size: .72rem; color: var(--text-muted); margin-top: 2px; }

.table-card { overflow: hidden; }
.table-hdr  { display: flex; align-items: center; justify-content: space-between; padding: .875rem 1.25rem; border-bottom: 1px solid var(--border); }
.section-title { font-size: .9rem; font-weight: 600; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
.data-table thead tr { background: #1e293b; }
.data-table th { padding: .6rem 1rem; text-align: left; font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
.data-table td { padding: .65rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #f8fafc; }
.data-table tbody tr.row-next td { background: #f0f9ff; }
.td-num   { color: var(--text-muted); font-weight: 600; width: 36px; }
.td-code  { font-weight: 700; color: var(--primary); }
.td-muted { color: var(--text-muted); }
.td-actions { display: flex; gap: .35rem; }
.empty-cell { text-align: center; padding: 2.5rem; color: var(--text-muted); }

.loading-screen { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; color:var(--text-muted); min-height:300px; }
.spinner { width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
@media(max-width:900px) { .stats-row { grid-template-columns: repeat(2,1fr); } .attention-card { flex-direction:column; align-items:flex-start; } }
</style>
