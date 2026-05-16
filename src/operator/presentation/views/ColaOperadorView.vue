<script setup>
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useOperatorStore } from '@/operator/application/Operation.Store.js'
import AppLayout from '@/shared/components/AppLayout.vue'
import { minutesSince, formatMinutes, formatTime } from '@/shared/utils/format.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const auth     = useAuthStore()
const operator = useOperatorStore()

onMounted(() => operator.loadDashboard(auth.user.mostradorId))

const subtitle = computed(() =>
  operator.mostrador ? `${operator.mostrador.servicioNombre} · Ventana ${operator.mostrador.numero}` : ''
)

async function callNext(ticketId = null) {
  await operator.callNext(ticketId)
}

async function completeCurrent() {
  await operator.markComplete()
}

async function markCurrentAbsent() {
  await operator.markAbsent()
}
</script>

<template>
  <AppLayout title="Cola en vivo" :subtitle="subtitle">
    <template #actions>
      <button class="tbtn tbtn-ghost" :disabled="!!operator.currentTicket || !operator.queueCount" @click="callNext()">
        {{ t('operator.callNext') }}
      </button>
      <button class="tbtn tbtn-dark" :disabled="!operator.currentTicket" @click="completeCurrent">
        {{ t('operator.completeTurn') }}
      </button>
    </template>
    <div v-if="operator.loading" class="loading-screen">
      <div class="spinner"></div><p>{{ t('common.loading') }}</p>
    </div>

    <template v-else>
      <!-- Turno activo -->
      <div class="now-card card" v-if="operator.currentTicket">
        <div class="now-badge">{{ t('operator.serving') }}</div>
        <div class="now-code">{{ operator.currentTicket.codigo }}</div>
        <p class="now-name">{{ operator.currentTicket.ciudadanoNombre }}</p>
        <p class="now-meta">{{ t('queue.calledAt') }} {{ formatTime(operator.currentTicket.horaLlamado) }}</p>
        <div class="now-actions">
          <button class="pill-btn pill-dark" @click="completeCurrent">{{ t('operator.complete') }}</button>
          <button class="pill-btn pill-danger" @click="markCurrentAbsent">{{ t('queue.markAbsent') }}</button>
        </div>
      </div>
      <div class="now-card now-empty card" v-else>
        <p class="now-empty-txt">{{ t('queue.noCurrentServing') }}</p>
        <button class="pill-btn pill-dark" :disabled="!operator.queueCount" @click="callNext()">
          {{ operator.queueCount ? t('operator.callNext') : t('operator.emptyQueue') }}
        </button>
      </div>

      <!-- Lista de {{ t('queue.wait') }} -->
      <div class="card queue-list-card">
        <div class="ql-header">
          <p class="section-title">{{ t('operator.waitingTurns') }}</p>
          <span class="badge badge-dark">{{ operator.queueCount }}</span>
        </div>
        <div v-if="!operator.queue.length" class="empty-state">
          <p>{{ t('queue.noWaitingTurns') }}</p>
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
              <span class="q-wait-lbl">{{ t('queue.wait') }}</span>
            </div>
            <button
              v-if="i === 0 && !operator.currentTicket"
              class="q-next-badge q-next-button"
              @click="callNext(ticket.id)"
            >
              {{ t('operator.next') }}
            </button>
            <span v-else-if="i === 0" class="q-next-badge">{{ t('operator.next') }}</span>
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
.now-actions { display:flex; justify-content:center; gap:.5rem; margin-top:.9rem; }
.tbtn { padding: 0.4rem 1rem; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all .15s; }
.tbtn:disabled { opacity: .4; cursor: not-allowed; }
.tbtn-ghost { background: transparent; border: 1.5px solid var(--border); color: var(--text-muted); }
.tbtn-dark { background: #1e293b; border: none; color: #fff; }
.pill-btn { display: inline-flex; align-items: center; justify-content:center; padding: 0.35rem 0.9rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; transition: all .15s; white-space: nowrap; }
.pill-btn:disabled { opacity:.45; cursor:not-allowed; }
.pill-dark { background: #1e293b; color:#fff; }
.pill-danger { background: #fee2e2; color:#b91c1c; border:1px solid #fecaca; }

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
.q-next-button { border: none; cursor: pointer; padding: .32rem .65rem; }
.q-next-button:hover { background: #0f5fd6; }
.empty-state { padding: 3rem; text-align: center; color: var(--text-muted); font-size: .9rem; }
.loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; min-height: 300px; color: var(--text-muted); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
