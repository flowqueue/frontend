<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useAnalyticsStore } from '@/analitics/application/anaytics.store.js'
import AppLayout from '@/shared/components/AppLayout.vue'
import { http } from '@/shared/services/http.js'
import { formatTime, minutesSince, formatMinutes } from '@/shared/utils/format.js'

const auth      = useAuthStore()
const analytics = useAnalyticsStore()
const turnos    = ref([])
let refreshTimer = null

async function loadData() {
  await analytics.loadDashboard(auth.user.sedeId)
  const all = await http.get(`/turnos?sedeId=${auth.user.sedeId}`)
  turnos.value = all
}

onMounted(() => {
  loadData()
  refreshTimer = setInterval(loadData, 15000)
})
onUnmounted(() => clearInterval(refreshTimer))

const enAtencion = computed(() => turnos.value.filter(t => t.estado === 'en_atencion'))
const enEspera   = computed(() => turnos.value.filter(t => t.estado === 'en_espera'))

function mostrador(mostradorId) {
  return analytics.mostradores.find(m => String(m.id) === String(mostradorId))
}
</script>

<template>
  <AppLayout title="Cola en vivo" subtitle="Actualización automática cada 15 segundos">
    <template #actions>
      <span class="live-chip">⬤ En vivo</span>
    </template>

    <!-- Mostradores activos -->
    <div class="section-label">Mostradores en atención</div>
    <div class="windows-grid">
      <div v-if="!enAtencion.length" class="empty-card card">
        <p>No hay mostradores atendiendo en este momento</p>
      </div>
      <div v-for="t in enAtencion" :key="t.id" class="window-card card">
        <div class="wc-top">
          <span class="wc-window">Ventana {{ mostrador(t.mostradorId)?.numero ?? '?' }}</span>
          <span class="badge badge-green">En atención</span>
        </div>
        <div class="wc-code">{{ t.codigo }}</div>
        <div class="wc-name">{{ t.ciudadanoNombre }}</div>
        <div class="wc-service">{{ mostrador(t.mostradorId)?.servicioNombre ?? '' }}</div>
        <div class="wc-time">Desde {{ formatTime(t.horaLlamado) }}</div>
      </div>

      <!-- Mostradores vacíos/inactivos -->
      <div
        v-for="m in analytics.mostradores.filter(m => !enAtencion.find(t => String(t.mostradorId) === String(m.id)))"
        :key="m.id"
        class="window-card window-idle card"
      >
        <div class="wc-top">
          <span class="wc-window">Ventana {{ m.numero }}</span>
          <span class="badge" :class="m.estado === 'activo' ? 'badge-gray' : 'badge-gray'">
            {{ m.estado === 'activo' ? 'Libre' : 'Inactivo' }}
          </span>
        </div>
        <div class="wc-idle-txt">{{ m.servicioNombre }}</div>
        <div class="wc-operator">{{ m.operadorNombre ?? 'Sin operador' }}</div>
      </div>
    </div>

    <!-- Cola de espera -->
    <div class="section-label" style="margin-top:1.25rem">
      Cola de espera
      <span class="badge badge-dark" style="margin-left:.5rem">{{ enEspera.length }}</span>
    </div>
    <div class="card queue-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Pos</th><th>Turno</th><th>Ciudadano</th><th>Servicio</th><th>Ingresó</th><th>Espera</th></tr></thead>
          <tbody>
            <tr v-if="!enEspera.length">
              <td colspan="6" class="empty-cell">No hay turnos en espera</td>
            </tr>
            <tr v-for="(t, i) in enEspera" :key="t.id">
              <td class="td-num">{{ i + 1 }}</td>
              <td class="td-code">{{ t.codigo }}</td>
              <td>{{ t.ciudadanoNombre }}</td>
              <td class="td-muted">{{ analytics.mostradores.find(m => m.servicioId === t.servicioId)?.servicioNombre ?? 'N/A' }}</td>
              <td class="td-muted">{{ formatTime(t.horaIngreso) }}</td>
              <td class="td-muted">{{ formatMinutes(minutesSince(t.horaIngreso)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.live-chip { background: #fee2e2; color: #b91c1c; font-size: .75rem; font-weight: 700; padding: .25rem .75rem; border-radius: 999px; display: flex; align-items: center; gap: .35rem; }
.section-label { font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); margin-bottom: .75rem; display: flex; align-items: center; }

.windows-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .875rem; }
.window-card { padding: 1.1rem 1.25rem; }
.window-idle { opacity: .7; }
.wc-top     { display: flex; align-items: center; justify-content: space-between; margin-bottom: .75rem; }
.wc-window  { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
.wc-code    { font-size: 2rem; font-weight: 900; color: var(--primary); line-height: 1; }
.wc-name    { font-size: .875rem; font-weight: 600; margin: .35rem 0 .15rem; }
.wc-service { font-size: .75rem; color: var(--text-muted); }
.wc-time    { font-size: .72rem; color: var(--text-muted); margin-top: .5rem; }
.wc-idle-txt  { font-size: .875rem; font-weight: 500; color: var(--text-muted); margin: .5rem 0 .2rem; }
.wc-operator  { font-size: .75rem; color: var(--text-light); }

.empty-card { padding: 2rem; text-align: center; color: var(--text-muted); font-size: .875rem; }
.queue-card { overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
.data-table thead tr { background: #1e293b; }
.data-table th { padding: .6rem 1rem; text-align: left; font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
.data-table td { padding: .65rem 1rem; border-bottom: 1px solid var(--border); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #f8fafc; }
.td-num  { color: var(--text-muted); font-weight: 600; width: 40px; }
.td-code { font-weight: 700; color: var(--primary); }
.td-muted { color: var(--text-muted); }
.empty-cell { text-align: center; padding: 2.5rem; color: var(--text-muted); }
</style>
