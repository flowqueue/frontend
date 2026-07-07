<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppLayout from '@/shared/components/AppLayout.vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useQueueStore } from '@/queue/application/queue.store.js'
import { getTicketById } from '@/queue/infrastructure/queue.api.js'
import { getNotifications } from '@/notification/infrastructure/notification.api.js'
import { http } from '@/shared/services/http.js'
import { formatTime, timeAgo } from '@/shared/utils/format.js'
import { downloadReport, shareOrCopy } from '@/shared/utils/export.js'

const auth = useAuthStore()
const queueStore = useQueueStore()
const ticket = ref(null)
const sede = ref(null)
const servicio = ref(null)
const institucion = ref(null)
const notifications = ref([])
const waitingQueue = ref([])
const loading = ref(true)
const feedback = ref('')
let refreshTimer = null

onMounted(async () => {
  await loadActiveTicket()
  refreshTimer = setInterval(refreshQueue, 30000)
})
onUnmounted(() => clearInterval(refreshTimer))

async function loadActiveTicket() {
  loading.value = true
  const activeId = localStorage.getItem('fq_active_ticket_id')
  try {
    if (activeId) ticket.value = await getTicketById(activeId).catch(() => null)
    if (!ticket.value) {
      await queueStore.loadCitizenTickets(auth.user?.dni ?? null, auth.user?.nombre ?? null)
      ticket.value = queueStore.tickets.find(t => ['en_espera','en_atencion'].includes(t.estado)) ?? null
    }
    if (ticket.value) {
      const results = await Promise.allSettled([
        http.get(`/branch-office/${ticket.value.sedeId}`),
        http.get(`/services/${ticket.value.servicioId}`),
        http.get(`/turns?sedeId=${ticket.value.sedeId}&servicioId=${ticket.value.servicioId}&estado=en_espera`),
        getNotifications(auth.user?.id),
      ])
      sede.value = results[0].status === 'fulfilled' ? results[0].value : null
      servicio.value = results[1].status === 'fulfilled' ? results[1].value : null
      waitingQueue.value = results[2].status === 'fulfilled'
        ? results[2].value.sort((a,b) => new Date(a.horaIngreso) - new Date(b.horaIngreso))
        : []
      notifications.value = results[3].status === 'fulfilled' ? results[3].value.slice(0, 3) : []

      if (sede.value?.institucionId) {
        institucion.value = await http.get(`/institutions/${sede.value.institucionId}`).catch(() => null)
      }
    }
  } finally { loading.value = false }
}

async function refreshQueue() {
  if (!ticket.value) return
  try {
    const [t, q] = await Promise.all([
      getTicketById(ticket.value.id),
      http.get(`/turns?sedeId=${ticket.value.sedeId}&servicioId=${ticket.value.servicioId}&estado=en_espera`),
    ])
    ticket.value = t
    waitingQueue.value = q.sort((a,b) => new Date(a.horaIngreso) - new Date(b.horaIngreso))
  } catch (_) { /* siguiente intento en 30s */ }
}

const estadoLabel = computed(() => ({
  en_espera: 'En espera',
  en_atencion: 'En atención',
  atendido: 'Atendido',
  cancelado: 'Cancelado',
  ausente: 'Ausente',
}[ticket.value?.estado] ?? ticket.value?.estado ?? '—'))

const position = computed(() => {
  if (!ticket.value) return '—'
  const idx = waitingQueue.value.findIndex(t => String(t.id) === String(ticket.value.id))
  if (idx >= 0) return `#${idx + 1}`
  return ticket.value.estado === 'en_atencion' ? 'En atención' : '—'
})
const ahead = computed(() => {
  if (!ticket.value) return 0
  const idx = waitingQueue.value.findIndex(t => String(t.id) === String(ticket.value.id))
  return idx >= 0 ? idx : 0
})
const estimated = computed(() => {
  const perTurn = Number(servicio.value?.duracionPromedio) || 10
  return `~${Math.max(perTurn, ahead.value * perTurn)} min`
})
const currentCode = computed(() => waitingQueue.value[0]?.codigo ?? '—')
const nextItems = computed(() => waitingQueue.value.slice(0, 4))
const progressPct = computed(() => {
  if (!waitingQueue.value.length) return 100
  return Math.round(((waitingQueue.value.length - ahead.value) / waitingQueue.value.length) * 100)
})

function ticketText() {
  if (!ticket.value) return ''
  return [
    `FlowQueue - Ticket ${ticket.value.codigo}`,
    `Ciudadano: ${ticket.value.ciudadanoNombre}`,
    `DNI: ${ticket.value.ciudadanoDNI}`,
    `Entidad: ${institucion.value?.nombre ?? 'N/A'}`,
    `Sede: ${sede.value?.nombre ?? 'N/A'}`,
    `Dirección: ${sede.value?.direccion ?? 'N/A'}`,
    `Trámite: ${servicio.value?.nombre ?? 'N/A'}`,
    `Estado: ${estadoLabel.value}`,
    `Posición: ${position.value}`,
    `Tiempo estimado: ${estimated.value}`,
    `Generado: ${new Date(ticket.value.horaIngreso).toLocaleString('es-PE')}`,
  ].join('\n')
}

function saveTicket() {
  if (!ticket.value) return
  downloadReport(`ticket-${ticket.value.codigo}.txt`, `Ticket virtual ${ticket.value.codigo}`, [
    { title: 'Datos del turno', lines: ticketText().split('\n') },
    { title: 'Recomendación', lines: ['Llega 10 minutos antes para no perder tu lugar.'] },
  ])
  feedback.value = 'Ticket descargado correctamente.'
}

async function shareTicket() {
  if (!ticket.value) return
  const result = await shareOrCopy({
    title: `FlowQueue ${ticket.value.codigo}`,
    text: ticketText(),
    url: window.location.href,
  })
  feedback.value = result === 'shared' ? 'Ticket compartido correctamente.' : 'Datos del ticket copiados al portapapeles.'
}

async function cancelTicket() {
  if (!ticket.value) return
  if (!confirm(`¿Cancelar el turno ${ticket.value.codigo}?`)) return
  ticket.value = await queueStore.updateTicketStatus(ticket.value.id, 'cancelado')
  localStorage.removeItem('fq_active_ticket_id')
  feedback.value = 'Turno cancelado correctamente.'
}
</script>

<template>
  <AppLayout title="Mi turno activo" :subtitle="ticket ? [institucion?.nombre, sede?.distrito, servicio?.nombre].filter(Boolean).join(' · ') || 'Detalle de tu turno' : 'No tienes un turno activo'">
    <div v-if="loading" class="loading-screen"><div class="spinner"></div><p>Cargando ticket...</p></div>

    <div v-else-if="ticket" class="ticket-layout">
      <section class="card ticket-card">
        <p class="ticket-label">Tu ticket virtual</p>
        <div class="ticket-code">{{ ticket.codigo }}</div>
        <div class="info-grid">
          <span>Entidad:</span><strong>{{ institucion?.nombre ?? '—' }}</strong>
          <span>Sede:</span><strong>{{ [sede?.nombre, sede?.direccion].filter(Boolean).join(' · ') || '—' }}</strong>
          <span>Trámite:</span><strong>{{ servicio?.nombre ?? '—' }}</strong>
          <span>Estado:</span><strong :class="`estado-${ticket.estado}`">{{ estadoLabel }}</strong>
          <span>Generado:</span><strong>Hoy, {{ formatTime(ticket.horaIngreso) }}</strong>
        </div>
        <div class="qr-box">[ Código QR ]</div>
        <div class="actions-row">
          <button class="btn btn-primary" @click="saveTicket">Guardar ticket</button>
          <button class="btn btn-ghost" @click="shareTicket">Compartir</button>
        </div>
        <p v-if="feedback" class="feedback-box">{{ feedback }}</p>
        <div class="warning-box">Llega ~10 min antes de tu turno para no perder tu lugar.</div>
      </section>

      <aside class="side-panel">
        <section class="card monitor-card">
          <h3>Monitor de cola en tiempo real</h3>
          <div class="monitor-grid">
            <div><span>Tu posición</span><strong>{{ position }}</strong></div>
            <div><span>Delante</span><strong>{{ ahead }}</strong></div>
            <div><span>Tiempo est.</span><strong>{{ estimated }}</strong></div>
            <div><span>Ahora</span><strong>{{ currentCode }}</strong></div>
          </div>
          <div class="progress"><span :style="{ width: progressPct + '%' }"></span></div>
          <p class="progress-label">{{ waitingQueue.length }} {{ waitingQueue.length === 1 ? 'turno' : 'turnos' }} en espera en tu cola</p>
          <div class="mini-queue">
            <div v-for="(q, i) in nextItems" :key="q.id" :class="['mini-item', { active: String(q.id) === String(ticket.id) }]">
              {{ q.codigo }} — {{ i === 0 ? 'Siguiente' : 'En espera' }}{{ String(q.id) === String(ticket.id) ? ' (tú)' : '' }}
            </div>
            <p v-if="!nextItems.length" class="mini-empty">No hay más turnos en espera.</p>
          </div>
          <button v-if="['en_espera','en_atencion'].includes(ticket.estado)" class="cancel-btn" @click="cancelTicket">Cancelar mi turno</button>
        </section>

        <section class="card notifications-card">
          <h3>Notificaciones recientes</h3>
          <div v-for="n in notifications" :key="n.id" class="note blue">
            {{ n.message ?? n.title ?? 'Notificación' }} <span>{{ timeAgo(n.createdAt) }}</span>
          </div>
          <p v-if="!notifications.length" class="mini-empty">Sin notificaciones por ahora. Te avisaremos cuando tu turno esté próximo.</p>
        </section>
      </aside>
    </div>

    <section v-else class="card empty-ticket">
      <h2>Aún no tienes un ticket activo</h2>
      <p>Busca una entidad y genera un turno virtual para iniciar el seguimiento.</p>
      <router-link to="/citizen/buscar-entidad" class="btn btn-primary empty-cta">Buscar entidad</router-link>
    </section>
  </AppLayout>
</template>

<style scoped>
.ticket-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.ticket-card, .monitor-card, .notifications-card, .empty-ticket { padding: 1.4rem; }
.ticket-label { color: var(--text-muted); font-size: .78rem; margin-bottom: .5rem; }
.ticket-code { font-size: 3.7rem; font-weight: 900; color: #1d6fe9; line-height: 1; padding-bottom: .9rem; border-bottom: 1px solid var(--border); margin-bottom: 1rem; }
.info-grid { display: grid; grid-template-columns: 100px 1fr; gap: .75rem; font-size: .83rem; }
.info-grid span { color: var(--text-muted); }
.info-grid strong { color: var(--text); }
.estado-en_espera { color: #b45309 !important; }
.estado-en_atencion { color: #1d4ed8 !important; }
.estado-atendido { color: #15803d !important; }
.estado-cancelado, .estado-ausente { color: #b91c1c !important; }
.qr-box { width: 180px; height: 58px; background: #eef2f7; border-radius: 8px; margin: 1.2rem auto .8rem; display:flex; align-items:center; justify-content:center; color: #64748b; font-size:.8rem; }
.actions-row { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; }
.feedback-box { margin-top: 1rem; background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: .75rem 1rem; border-radius: 8px; font-size: .82rem; font-weight: 700; }
.warning-box { margin-top: 1rem; background: #fff7ed; color: #b45309; border: 1px solid #fed7aa; padding: .85rem 1rem; border-radius: 8px; font-size: .82rem; }
.side-panel { display: flex; flex-direction: column; gap: 1rem; }
.monitor-card { border-top: 4px solid #1d6fe9; }
h3 { font-size: .95rem; font-weight: 800; margin-bottom: .9rem; }
.monitor-grid { display:grid; grid-template-columns: repeat(4,1fr); gap:.5rem; }
.monitor-grid div { background: #f1f5f9; border: 1px solid var(--border); border-radius: 8px; padding: .75rem; }
.monitor-grid span { display:block; color: var(--text-muted); font-size: .68rem; margin-bottom:.25rem; }
.monitor-grid strong { color: var(--text); font-size: 1.1rem; }
.progress { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin: .8rem 0 .35rem; }
.progress span { display:block; height:100%; background:#1d6fe9; transition: width .4s ease; }
.progress-label { font-size: .72rem; color: var(--text-muted); margin-bottom: .7rem; }
.mini-queue { display:flex; flex-direction:column; gap:.35rem; }
.mini-item { padding:.38rem .55rem; border:1px solid var(--border); border-radius:6px; font-size:.76rem; color:var(--text-muted); }
.mini-item.active { background:#dbeafe; color:#1d4ed8; font-weight:700; }
.mini-empty { font-size:.76rem; color:var(--text-muted); }
.cancel-btn { margin-top:.8rem; width:100%; border:none; background:#fee2e2; color:#b91c1c; font-weight:800; border-radius:8px; padding:.65rem; cursor:pointer; transition: background .15s ease; }
.cancel-btn:hover { background:#fecaca; }
.note { display:flex; justify-content:space-between; gap:1rem; padding:.7rem .85rem; border-radius:8px; font-size:.8rem; margin-bottom:.5rem; }
.note span { color: var(--text-muted); font-size:.7rem; white-space: nowrap; }
.note.blue { background:#dbeafe; color:#1d4ed8; }
.empty-ticket { text-align:center; padding:3rem; }
.empty-cta { display:inline-block; margin-top:1rem; }
.loading-screen { display:flex; flex-direction:column; gap:1rem; align-items:center; justify-content:center; min-height:300px; color:var(--text-muted); }
.spinner { width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media(max-width:1000px){ .ticket-layout { grid-template-columns:1fr; } .monitor-grid { grid-template-columns:repeat(2,1fr); } }
</style>
