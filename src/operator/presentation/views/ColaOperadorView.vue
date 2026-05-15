<script setup>
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useOperatorStore } from '@/operator/application/Operation.Store.js'
import AppLayout from '@/shared/components/AppLayout.vue'
import { minutesSince, formatMinutes, formatTime } from '@/shared/utils/format.js'

const auth     = useAuthStore()
const operator = useOperatorStore()

onMounted(() => operator.loadDashboard(auth.user.mostradorId))

const subtitle = computed(() =>
  operator.mostrador ? `${operator.mostrador.servicioNombre} · Ventana ${operator.mostrador.numero}` : ''
)
</script>

<template>
  <AppLayout title="Cola en vivo" :subtitle="subtitle">
    <div v-if="operator.loading" class="loading-screen">
      <div class="spinner"></div><p>Cargando cola...</p>
    </div>

    <template v-else>
      <!-- Turno activo -->
      <div class="now-card card" v-if="operator.currentTicket">
        <div class="now-badge">En atención</div>
        <div class="now-code">{{ operator.currentTicket.codigo }}</div>
        <p class="now-name">{{ operator.currentTicket.ciudadanoNombre }}</p>
        <p class="now-meta">Llamado a las {{ formatTime(operator.currentTicket.horaLlamado) }}</p>
      </div>
      <div class="now-card now-empty card" v-else>
        <p class="now-empty-txt">Sin turno en atención ahora mismo</p>
      </div>

      <!-- Lista de espera -->
      <div class="card queue-list-card">
        <div class="ql-header">
          <p class="section-title">Turnos en espera</p>
          <span class="badge badge-dark">{{ operator.queueCount }}</span>
        </div>
        <div v-if="!operator.queue.length" class="empty-state">
          <p>No hay turnos en espera</p>
        </div>
        <div v-else class="queue-list">
          <div
            v-for="(ticket, i) in operator.queue"
            :key="ticket.id"
            class="q-item"
            :class="{ 'q-next': i === 0 }"
          >
            <div class="q-pos">{{ i + 1 }}</div>
            <div class="q-info">
              <span class="q-code">{{ ticket.codigo }}</span>
              <span class="q-name">{{ ticket.ciudadanoNombre }}</span>
            </div>
            <div class="q-wait">
              <span class="q-wait-val">{{ formatMinutes(minutesSince(ticket.horaIngreso)) }}</span>
              <span class="q-wait-lbl">espera</span>
            </div>
            <span v-if="i === 0" class="q-next-badge">Siguiente</span>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<style scoped>
.now-card { padding: 2rem; text-align: center; margin-bottom: 1rem; }
.now-badge { display: inline-block; background: #dcfce7; color: #15803d; font-size: .72rem; font-weight: 700; padding: .2rem .75rem; border-radius: 999px; margin-bottom: .75rem; text-transform: uppercase; letter-spacing: .08em; }
.now-code  { font-size: 4rem; font-weight: 900; color: var(--primary); line-height: 1; }
.now-name  { font-size: 1.2rem; font-weight: 600; margin: .5rem 0 .25rem; }
.now-meta  { font-size: .82rem; color: var(--text-muted); }
.now-empty { display: flex; align-items: center; justify-content: center; min-height: 140px; }
.now-empty-txt { color: var(--text-muted); font-size: .95rem; }

.queue-list-card { overflow: hidden; }
.ql-header { display: flex; align-items: center; justify-content: space-between; padding: .875rem 1.25rem; border-bottom: 1px solid var(--border); }
.section-title { font-size: .9rem; font-weight: 600; }
.queue-list { padding: .5rem .75rem; display: flex; flex-direction: column; gap: .4rem; }
.q-item { display: flex; align-items: center; gap: .875rem; padding: .7rem .875rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); }
.q-next { background: #f0f9ff; border-color: #bae6fd; }
.q-pos  { width: 30px; height: 30px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 700; color: var(--text-muted); flex-shrink: 0; }
.q-next .q-pos { background: var(--primary); color: #fff; }
.q-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.q-code { font-weight: 700; font-size: .88rem; color: var(--primary); }
.q-name { font-size: .78rem; color: var(--text-muted); }
.q-wait { display: flex; flex-direction: column; align-items: flex-end; }
.q-wait-val { font-size: .9rem; font-weight: 700; color: var(--text); }
.q-wait-lbl { font-size: .68rem; color: var(--text-muted); }
.q-next-badge { background: var(--primary); color: #fff; font-size: .68rem; font-weight: 700; padding: .15rem .5rem; border-radius: 4px; text-transform: uppercase; }
.empty-state { padding: 3rem; text-align: center; color: var(--text-muted); font-size: .9rem; }
.loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; min-height: 300px; color: var(--text-muted); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
