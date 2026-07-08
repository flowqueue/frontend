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
const showCancelDialog = ref(false)
const showQrDialog = ref(false)
const cancelling = ref(false)
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
    if (activeId && !ticket.value) localStorage.removeItem('fq_active_ticket_id')

    if (!ticket.value) {
      await queueStore.loadCitizenTickets(auth.user?.dni ?? null, auth.user?.nombre ?? null)
      ticket.value = queueStore.tickets.find(t => ['en_espera', 'en_atencion'].includes(t.estado)) ?? null
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
        ? results[2].value.sort((a, b) => new Date(a.horaIngreso) - new Date(b.horaIngreso))
        : []
      notifications.value = results[3].status === 'fulfilled' ? results[3].value.slice(0, 3) : []

      if (sede.value?.institucionId) {
        institucion.value = await http.get(`/institutions/${sede.value.institucionId}`).catch(() => null)
      }
    }
  } finally {
    loading.value = false
  }
}

async function refreshQueue() {
  if (!ticket.value) return

  try {
    const [t, q] = await Promise.all([
      getTicketById(ticket.value.id),
      http.get(`/turns?sedeId=${ticket.value.sedeId}&servicioId=${ticket.value.servicioId}&estado=en_espera`),
    ])
    ticket.value = t
    waitingQueue.value = q.sort((a, b) => new Date(a.horaIngreso) - new Date(b.horaIngreso))
  } catch (_) {
    /* siguiente intento en 30s */
  }
}

const estadoLabel = computed(() => ({
  en_espera: 'En espera',
  en_atencion: 'En atencion',
  atendido: 'Atendido',
  cancelado: 'Cancelado',
  ausente: 'Ausente',
}[ticket.value?.estado] ?? ticket.value?.estado ?? '-'))

const statusTone = computed(() => ({
  en_espera: 'waiting',
  en_atencion: 'calling',
  atendido: 'done',
  cancelado: 'danger',
  ausente: 'danger',
}[ticket.value?.estado] ?? 'neutral'))

const subtitleText = computed(() => {
  if (!ticket.value) return 'No tienes un turno activo'
  return [institucion.value?.nombre, sede.value?.distrito, servicio.value?.nombre].filter(Boolean).join(' - ')
    || 'Detalle de tu turno'
})

const position = computed(() => {
  if (!ticket.value) return '-'
  const idx = waitingQueue.value.findIndex(t => String(t.id) === String(ticket.value.id))
  if (idx >= 0) return `#${idx + 1}`
  return ticket.value.estado === 'en_atencion' ? 'En atencion' : '-'
})

const ahead = computed(() => {
  if (!ticket.value) return 0
  const idx = waitingQueue.value.findIndex(t => String(t.id) === String(ticket.value.id))
  return idx >= 0 ? idx : 0
})

const estimated = computed(() => {
  const perTurn = Number(servicio.value?.duracionPromedio) || 10
  if (ticket.value?.estado === 'en_atencion') return 'Ahora'
  return `~${Math.max(perTurn, ahead.value * perTurn)} min`
})

const currentCode = computed(() => {
  if (ticket.value?.estado === 'en_atencion') return ticket.value.codigo
  return waitingQueue.value[0]?.codigo ?? '-'
})

const nextItems = computed(() => waitingQueue.value.slice(0, 4))

const progressPct = computed(() => {
  if (ticket.value?.estado === 'en_atencion') return 100
  if (!waitingQueue.value.length) return 100
  return Math.max(8, Math.round(((waitingQueue.value.length - ahead.value) / waitingQueue.value.length) * 100))
})

const queueHeadline = computed(() => {
  if (ticket.value?.estado === 'en_atencion') return 'Te estan atendiendo ahora'
  if (ahead.value === 0) return 'Eres el siguiente en la cola'
  return `${ahead.value} ${ahead.value === 1 ? 'turno' : 'turnos'} delante de ti`
})

const createdLabel = computed(() => {
  if (!ticket.value?.horaIngreso) return '-'
  return `Hoy, ${formatTime(ticket.value.horaIngreso)}`
})

function ticketText() {
  if (!ticket.value) return ''
  return [
    `FlowQueue - Ticket ${ticket.value.codigo}`,
    `Ciudadano: ${ticket.value.ciudadanoNombre}`,
    `DNI: ${ticket.value.ciudadanoDNI}`,
    `Entidad: ${institucion.value?.nombre ?? 'N/A'}`,
    `Sede: ${sede.value?.nombre ?? 'N/A'}`,
    `Direccion: ${sede.value?.direccion ?? 'N/A'}`,
    `Tramite: ${servicio.value?.nombre ?? 'N/A'}`,
    `Estado: ${estadoLabel.value}`,
    `Posicion: ${position.value}`,
    `Tiempo estimado: ${estimated.value}`,
    `Generado: ${new Date(ticket.value.horaIngreso).toLocaleString('es-PE')}`,
  ].join('\n')
}

function saveTicket() {
  if (!ticket.value) return
  downloadReport(`ticket-${ticket.value.codigo}.txt`, `Ticket virtual ${ticket.value.codigo}`, [
    { title: 'Datos del turno', lines: ticketText().split('\n') },
    { title: 'Recomendacion', lines: ['Llega 10 minutos antes para no perder tu lugar.'] },
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
  feedback.value = result === 'shared'
    ? 'Ticket compartido correctamente.'
    : 'Datos del ticket copiados al portapapeles.'
}

function openQrDialog() {
  if (!ticket.value) return
  showQrDialog.value = true
}

function closeQrDialog() {
  showQrDialog.value = false
}

function openCancelDialog() {
  if (!ticket.value) return
  showCancelDialog.value = true
}

function closeCancelDialog() {
  if (cancelling.value) return
  showCancelDialog.value = false
}

async function confirmCancelTicket() {
  if (!ticket.value) return

  cancelling.value = true

  try {
    ticket.value = await queueStore.updateTicketStatus(ticket.value.id, 'cancelado')
    localStorage.removeItem('fq_active_ticket_id')
    feedback.value = 'Turno cancelado correctamente.'
    showCancelDialog.value = false
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <AppLayout title="Mi turno activo" :subtitle="subtitleText">
    <div v-if="loading" class="loading-screen">
      <div class="spinner"></div>
      <p>Cargando ticket...</p>
    </div>

    <div v-else-if="ticket" class="ticket-layout">
      <section class="card ticket-card">
        <div class="ticket-topline">
          <div>
            <p class="eyebrow">Ticket virtual</p>
            <h2>{{ ticket.codigo }}</h2>
          </div>
          <span :class="['status-pill', `tone-${statusTone}`]">{{ estadoLabel }}</span>
        </div>

        <div class="ticket-hero">
          <div>
            <span class="helper-label">Turno asignado a</span>
            <strong>{{ ticket.ciudadanoNombre || auth.user?.nombre || 'Ciudadano' }}</strong>
            <small>DNI {{ ticket.ciudadanoDNI || auth.user?.dni || 'No registrado' }}</small>
          </div>
          <div class="ticket-number">
            <span>Posicion</span>
            <strong>{{ position }}</strong>
          </div>
        </div>

        <dl class="info-grid">
          <dt>Entidad</dt>
          <dd>{{ institucion?.nombre ?? '-' }}</dd>
          <dt>Sede</dt>
          <dd>{{ [sede?.nombre, sede?.direccion].filter(Boolean).join(' - ') || '-' }}</dd>
          <dt>Tramite</dt>
          <dd>{{ servicio?.nombre ?? '-' }}</dd>
          <dt>Generado</dt>
          <dd>{{ createdLabel }}</dd>
        </dl>

        <div class="ticket-tools">
          <button class="qr-card" type="button" aria-label="Abrir codigo QR del turno" @click="openQrDialog">
            <span class="qr-grid mini" aria-hidden="true">
              <span class="qr-cell dark"></span>
              <span class="qr-cell"></span>
              <span class="qr-cell dark"></span>
              <span class="qr-cell"></span>
              <span class="qr-cell dark"></span>
              <span class="qr-cell"></span>
              <span class="qr-cell dark"></span>
              <span class="qr-cell dark"></span>
              <span class="qr-cell"></span>
              <span class="qr-cell dark"></span>
              <span class="qr-cell"></span>
              <span class="qr-cell dark"></span>
              <span class="qr-cell dark"></span>
              <span class="qr-cell"></span>
              <span class="qr-cell dark"></span>
            </span>
            <em>Ver codigo QR</em>
          </button>

          <div class="actions-stack">
            <button class="btn btn-primary" @click="saveTicket">Guardar ticket</button>
            <button class="btn btn-ghost" @click="shareTicket">Compartir</button>
          </div>
        </div>

        <p v-if="feedback" class="feedback-box">{{ feedback }}</p>

        <div class="arrival-note">
          <strong>Llega 10 min antes</strong>
          <span>Ten tu DNI listo y revisa esta pantalla cuando estes cerca de la sede.</span>
        </div>
      </section>

      <aside class="side-panel">
        <section class="card monitor-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Monitor en vivo</p>
              <h3>{{ queueHeadline }}</h3>
            </div>
            <span class="live-dot">En vivo</span>
          </div>

          <div class="monitor-grid">
            <div>
              <span>Tu posicion</span>
              <strong>{{ position }}</strong>
            </div>
            <div>
              <span>Delante</span>
              <strong>{{ ahead }}</strong>
            </div>
            <div>
              <span>Tiempo est.</span>
              <strong>{{ estimated }}</strong>
            </div>
            <div>
              <span>Ahora</span>
              <strong>{{ currentCode }}</strong>
            </div>
          </div>

          <div class="progress-wrap">
            <div class="progress">
              <span :style="{ width: progressPct + '%' }"></span>
            </div>
            <p>{{ waitingQueue.length }} {{ waitingQueue.length === 1 ? 'turno' : 'turnos' }} en espera en tu cola</p>
          </div>

          <div class="mini-queue">
            <div
              v-for="(q, i) in nextItems"
              :key="q.id"
              :class="['mini-item', { active: String(q.id) === String(ticket.id) }]"
            >
              <div>
                <strong>{{ q.codigo }}</strong>
                <span>{{ i === 0 ? 'Siguiente' : 'En espera' }}</span>
              </div>
              <small v-if="String(q.id) === String(ticket.id)">Tu turno</small>
            </div>
            <p v-if="!nextItems.length" class="mini-empty">No hay mas turnos en espera.</p>
          </div>

          <button
            v-if="['en_espera', 'en_atencion'].includes(ticket.estado)"
            class="cancel-btn"
            @click="openCancelDialog"
          >
            Cancelar mi turno
          </button>
        </section>

        <section class="card notifications-card">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">Avisos</p>
              <h3>Notificaciones recientes</h3>
            </div>
          </div>

          <div v-for="n in notifications" :key="n.id" class="note">
            <p>{{ n.message ?? n.title ?? 'Notificacion' }}</p>
            <span>{{ timeAgo(n.createdAt) }}</span>
          </div>

          <p v-if="!notifications.length" class="mini-empty">
            Sin notificaciones por ahora. Te avisaremos cuando tu turno este proximo.
          </p>
        </section>
      </aside>
    </div>

    <section v-else class="card empty-ticket">
      <span class="empty-mark">FQ</span>
      <h2>Aun no tienes un ticket activo</h2>
      <p>Busca una entidad y genera un turno virtual para iniciar el seguimiento.</p>
      <router-link to="/citizen/buscar-entidad" class="btn btn-primary empty-cta">Buscar entidad</router-link>
    </section>

    <Teleport to="body">
      <div
        v-if="showQrDialog && ticket"
        class="ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-title"
        @click.self="closeQrDialog"
      >
        <section class="qr-dialog">
          <button class="modal-close qr-close" type="button" @click="closeQrDialog">
            x
          </button>

          <div class="qr-dialog-layout">
            <div class="qr-stage">
              <div class="qr-code-large" aria-label="Codigo QR ampliado">
                <span
                  v-for="index in 49"
                  :key="index"
                  :class="[
                    'qr-pixel',
                    {
                      dark: [
                        1, 2, 3, 5, 6, 7,
                        8, 10, 12, 14,
                        15, 16, 17, 19, 20, 21,
                        23, 25, 27,
                        29, 30, 32, 34,
                        36, 38, 39, 41,
                        43, 44, 45, 47, 48, 49,
                      ].includes(index),
                    },
                  ]"
                ></span>
              </div>
              <span class="scan-line"></span>
            </div>

            <div class="qr-details">
              <p class="modal-kicker">Ticket digital</p>
              <h2 id="qr-title">{{ ticket.codigo }}</h2>
              <p class="modal-copy">
                Presenta este codigo en ventanilla para validar tu turno y agilizar la atencion.
              </p>

              <div class="modal-ticket qr-summary">
                <div>
                  <span>Ciudadano</span>
                  <strong>{{ ticket.ciudadanoNombre || auth.user?.nombre || 'Ciudadano' }}</strong>
                </div>
                <div>
                  <span>Entidad</span>
                  <strong>{{ institucion?.nombre ?? 'FlowQueue' }}</strong>
                </div>
                <div>
                  <span>Sede</span>
                  <strong>{{ sede?.nombre ?? 'Sede seleccionada' }}</strong>
                </div>
                <div>
                  <span>Tramite</span>
                  <strong>{{ servicio?.nombre ?? 'Servicio seleccionado' }}</strong>
                </div>
              </div>

              <div class="modal-actions">
                <button class="modal-secondary" type="button" @click="shareTicket">
                  Compartir
                </button>
                <button class="modal-primary" type="button" @click="saveTicket">
                  Guardar ticket
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div
        v-if="showCancelDialog && ticket"
        class="cancel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        @click.self="closeCancelDialog"
      >
        <section class="cancel-dialog">
          <button class="modal-close" type="button" :disabled="cancelling" @click="closeCancelDialog">
            x
          </button>

          <div class="modal-mark">!</div>
          <p class="modal-kicker">Confirmar cancelacion</p>
          <h2 id="cancel-title">Quieres cancelar tu turno?</h2>
          <p class="modal-copy">
            El ticket saldra de la cola y tendras que generar uno nuevo si aun necesitas atencion.
          </p>

          <div class="modal-ticket">
            <div>
              <span>Turno</span>
              <strong>{{ ticket.codigo }}</strong>
            </div>
            <div>
              <span>Entidad</span>
              <strong>{{ institucion?.nombre ?? 'FlowQueue' }}</strong>
            </div>
            <div>
              <span>Tramite</span>
              <strong>{{ servicio?.nombre ?? 'Servicio seleccionado' }}</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button class="modal-secondary" type="button" :disabled="cancelling" @click="closeCancelDialog">
              Mantener turno
            </button>
            <button class="modal-danger" type="button" :disabled="cancelling" @click="confirmCancelTicket">
              {{ cancelling ? 'Cancelando...' : 'Si, cancelar turno' }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>
  </AppLayout>
</template>

<style scoped>
.ticket-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(360px, .98fr);
  gap: 1rem;
  align-items: start;
}

.card {
  border: 1px solid rgba(148, 163, 184, .22);
  box-shadow: 0 18px 55px rgba(15, 23, 42, .08);
}

.ticket-card,
.monitor-card,
.notifications-card,
.empty-ticket {
  position: relative;
  overflow: hidden;
  padding: 1.35rem;
}

.ticket-card::before,
.monitor-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, #1d6fe9, #14b8a6, #f59e0b);
}

.ticket-topline,
.section-heading,
.ticket-hero,
.ticket-tools,
.actions-stack,
.note,
.mini-item {
  display: flex;
}

.ticket-topline,
.section-heading {
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-heading.compact {
  margin-bottom: .75rem;
}

.eyebrow,
.helper-label {
  display: block;
  margin: 0 0 .35rem;
  color: var(--text-muted);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.ticket-topline h2 {
  margin: 0;
  color: #1d6fe9;
  font-size: clamp(3rem, 7vw, 5.6rem);
  font-weight: 950;
  line-height: .9;
}

.status-pill,
.live-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  border-radius: 999px;
  padding: .35rem .75rem;
  font-size: .76rem;
  font-weight: 900;
  white-space: nowrap;
}

.tone-waiting {
  background: #fff7ed;
  color: #b45309;
  border: 1px solid #fed7aa;
}

.tone-calling {
  background: #dbeafe;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.tone-done {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.tone-danger {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.tone-neutral {
  background: #f1f5f9;
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.ticket-hero {
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: .95rem 0 1rem;
  padding: 1rem;
  border: 1px solid rgba(29, 111, 233, .16);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(29, 111, 233, .08), rgba(20, 184, 166, .07));
}

.ticket-hero strong,
.ticket-number strong {
  display: block;
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 900;
}

.ticket-hero small,
.ticket-number span {
  display: block;
  margin-top: .25rem;
  color: var(--text-muted);
  font-size: .75rem;
}

.ticket-number {
  min-width: 108px;
  border-radius: 8px;
  background: rgba(255, 255, 255, .76);
  padding: .75rem .9rem;
  text-align: center;
}

.ticket-number strong {
  color: #1d6fe9;
  font-size: 1.45rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: .78rem .95rem;
  margin: 0;
  padding: 1rem 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.info-grid dt {
  color: var(--text-muted);
  font-size: .78rem;
}

.info-grid dd {
  margin: 0;
  color: var(--text);
  font-size: .84rem;
  font-weight: 800;
  line-height: 1.4;
}

.ticket-tools {
  align-items: stretch;
  gap: 1rem;
  margin-top: 1rem;
}

.qr-card {
  display: grid;
  gap: .5rem;
  width: 158px;
  min-height: 114px;
  place-content: center;
  border: 1px solid #dbe4ee;
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(248, 250, 252, .96), rgba(226, 232, 240, .8)),
    #f8fafc;
  cursor: pointer;
  transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
}

.qr-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 16px 34px rgba(29, 111, 233, .14);
  transform: translateY(-1px);
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(5, 12px);
  grid-auto-rows: 12px;
  gap: 4px;
}

.qr-grid.mini {
  justify-self: center;
}

.qr-cell {
  border-radius: 3px;
  background: #dbe4ee;
}

.qr-cell.dark {
  background: #0f172a;
}

.qr-card em {
  color: var(--text-muted);
  font-size: .7rem;
  font-style: normal;
  font-weight: 800;
  text-align: center;
}

.actions-stack {
  flex: 1;
  flex-direction: column;
  gap: .65rem;
  justify-content: center;
}

.actions-stack .btn {
  width: 100%;
}

.feedback-box {
  margin-top: 1rem;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: #dcfce7;
  color: #15803d;
  padding: .75rem 1rem;
  font-size: .82rem;
  font-weight: 800;
}

.arrival-note {
  display: grid;
  gap: .18rem;
  margin-top: 1rem;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  background: #fff7ed;
  color: #9a3412;
  padding: .85rem 1rem;
  font-size: .82rem;
}

.arrival-note strong {
  color: #c2410c;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-heading h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 900;
}

.live-dot {
  position: relative;
  background: #dcfce7;
  color: #047857;
  border: 1px solid #bbf7d0;
}

.live-dot::before {
  content: "";
  width: .48rem;
  height: .48rem;
  margin-right: .42rem;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 0 0 6px rgba(16, 185, 129, .14);
  animation: pulse 1.5s ease-in-out infinite;
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .58rem;
}

.monitor-grid div {
  min-height: 72px;
  border: 1px solid #d7e2ee;
  border-radius: 8px;
  background: #f4f7fb;
  padding: .75rem;
}

.monitor-grid span {
  display: block;
  margin-bottom: .3rem;
  color: var(--text-muted);
  font-size: .7rem;
}

.monitor-grid strong {
  color: var(--text);
  font-size: 1.08rem;
  font-weight: 950;
}

.progress-wrap {
  margin: .95rem 0;
}

.progress {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #1d6fe9, #14b8a6);
  transition: width .45s ease;
}

.progress-wrap p,
.mini-empty {
  margin: .45rem 0 0;
  color: var(--text-muted);
  font-size: .76rem;
}

.mini-queue {
  display: grid;
  gap: .5rem;
}

.mini-item {
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  padding: .58rem .7rem;
}

.mini-item strong,
.mini-item span,
.mini-item small {
  display: block;
}

.mini-item strong {
  color: var(--text);
  font-size: .86rem;
}

.mini-item span,
.mini-item small {
  color: var(--text-muted);
  font-size: .72rem;
}

.mini-item.active {
  border-color: #bfdbfe;
  background: #dbeafe;
}

.mini-item.active strong,
.mini-item.active small {
  color: #1d4ed8;
}

.cancel-btn {
  width: 100%;
  margin-top: .95rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fee2e2;
  color: #b91c1c;
  padding: .78rem;
  cursor: pointer;
  font-weight: 900;
  transition: transform .16s ease, background .16s ease, box-shadow .16s ease;
}

.cancel-btn:hover {
  background: #fecaca;
  box-shadow: 0 12px 28px rgba(185, 28, 28, .12);
  transform: translateY(-1px);
}

.cancel-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background:
    radial-gradient(circle at 50% 24%, rgba(29, 111, 233, .18), transparent 28rem),
    rgba(15, 23, 42, .54);
  backdrop-filter: blur(10px);
  animation: modal-fade .18s ease;
}

.ticket-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background:
    radial-gradient(circle at 42% 20%, rgba(20, 184, 166, .2), transparent 28rem),
    radial-gradient(circle at 62% 80%, rgba(29, 111, 233, .2), transparent 24rem),
    rgba(15, 23, 42, .56);
  backdrop-filter: blur(10px);
  animation: modal-fade .18s ease;
}

.qr-dialog {
  position: relative;
  overflow: hidden;
  width: min(100%, 760px);
  border: 1px solid rgba(191, 219, 254, .92);
  border-radius: 14px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, .98), rgba(239, 246, 255, .94)),
    #fff;
  box-shadow: 0 30px 90px rgba(15, 23, 42, .3);
  padding: 1.25rem;
  animation: modal-rise .2s ease;
}

.qr-dialog::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, #1d6fe9, #14b8a6, #22c55e);
}

.qr-close {
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.qr-close:hover:not(:disabled) {
  background: #dbeafe;
}

.qr-dialog-layout {
  display: grid;
  grid-template-columns: minmax(220px, .78fr) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: center;
}

.qr-stage {
  position: relative;
  display: grid;
  min-height: 300px;
  place-items: center;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background:
    linear-gradient(rgba(29, 111, 233, .055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(29, 111, 233, .055) 1px, transparent 1px),
    #f8fbff;
  background-size: 18px 18px;
}

.qr-code-large {
  display: grid;
  grid-template-columns: repeat(7, 18px);
  grid-auto-rows: 18px;
  gap: 6px;
  border: 1px solid #d7e2ee;
  border-radius: 16px;
  background: #fff;
  padding: 1.2rem;
  box-shadow: 0 18px 42px rgba(15, 23, 42, .12);
}

.qr-pixel {
  border-radius: 4px;
  background: #e2e8f0;
}

.qr-pixel.dark {
  background: #0f172a;
}

.scan-line {
  position: absolute;
  left: 14%;
  right: 14%;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #14b8a6, transparent);
  box-shadow: 0 0 18px rgba(20, 184, 166, .7);
  animation: scan-line 2.4s ease-in-out infinite;
}

.qr-details h2 {
  margin: 0;
  color: #1d6fe9;
  font-size: clamp(2.5rem, 6vw, 4.25rem);
  font-weight: 950;
  line-height: .95;
}

.qr-summary {
  border-color: #bfdbfe;
  background: rgba(239, 246, 255, .72);
}

.qr-summary span {
  color: #1d4ed8;
}

.cancel-dialog {
  position: relative;
  overflow: hidden;
  width: min(100%, 480px);
  border: 1px solid rgba(254, 202, 202, .9);
  border-radius: 12px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, .98), rgba(255, 247, 237, .94)),
    #fff;
  box-shadow: 0 28px 80px rgba(15, 23, 42, .28);
  padding: 1.4rem;
  animation: modal-rise .2s ease;
}

.cancel-dialog::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, #ef4444, #f97316, #f59e0b);
}

.modal-close {
  position: absolute;
  top: .85rem;
  right: .85rem;
  width: 2rem;
  height: 2rem;
  border: 1px solid #fecaca;
  border-radius: 999px;
  background: #fff;
  color: #b91c1c;
  cursor: pointer;
  font-size: .85rem;
  font-weight: 950;
  line-height: 1;
}

.modal-close:hover:not(:disabled) {
  background: #fee2e2;
}

.modal-mark {
  display: grid;
  width: 3.15rem;
  height: 3.15rem;
  margin-bottom: .9rem;
  place-items: center;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 1.5rem;
  font-weight: 950;
  box-shadow: 0 16px 36px rgba(239, 68, 68, .18);
}

.modal-kicker {
  margin: 0 2.5rem .35rem 0;
  color: #dc2626;
  font-size: .72rem;
  font-weight: 950;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.cancel-dialog h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.45rem;
  font-weight: 950;
}

.modal-copy {
  margin: .55rem 0 1rem;
  color: var(--text-muted);
  font-size: .88rem;
  line-height: 1.55;
}

.modal-ticket {
  display: grid;
  gap: .55rem;
  margin: 1rem 0;
  border: 1px solid #fed7aa;
  border-radius: 10px;
  background: rgba(255, 247, 237, .72);
  padding: .85rem;
}

.modal-ticket div {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: .75rem;
  align-items: baseline;
}

.modal-ticket span {
  color: #9a3412;
  font-size: .72rem;
  font-weight: 850;
}

.modal-ticket strong {
  min-width: 0;
  color: var(--text);
  font-size: .85rem;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: .65rem;
  margin-top: 1rem;
}

.modal-secondary,
.modal-danger,
.modal-primary {
  min-height: 44px;
  border-radius: 8px;
  cursor: pointer;
  font-size: .84rem;
  font-weight: 950;
  transition: transform .16s ease, box-shadow .16s ease, background .16s ease;
}

.modal-secondary {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
}

.modal-danger {
  border: 1px solid #dc2626;
  background: #dc2626;
  color: #fff;
  box-shadow: 0 16px 32px rgba(220, 38, 38, .2);
}

.modal-primary {
  border: 1px solid #1d6fe9;
  background: #1d6fe9;
  color: #fff;
  box-shadow: 0 16px 32px rgba(29, 111, 233, .2);
}

.modal-secondary:hover:not(:disabled),
.modal-danger:hover:not(:disabled),
.modal-primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.modal-secondary:hover:not(:disabled) {
  background: #f8fafc;
}

.modal-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.modal-primary:hover:not(:disabled) {
  background: #185ec9;
}

.modal-secondary:disabled,
.modal-danger:disabled,
.modal-primary:disabled,
.modal-close:disabled {
  cursor: wait;
  opacity: .72;
}

.note {
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: .6rem;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  padding: .75rem .85rem;
}

.note p {
  margin: 0;
  color: #1d4ed8;
  font-size: .8rem;
  font-weight: 800;
}

.note span {
  color: var(--text-muted);
  font-size: .7rem;
  white-space: nowrap;
}

.empty-ticket {
  display: grid;
  justify-items: center;
  max-width: 560px;
  margin: 2rem auto;
  padding: 3rem;
  text-align: center;
}

.empty-mark {
  display: inline-grid;
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #1d6fe9, #14b8a6);
  color: #fff;
  font-weight: 950;
}

.empty-ticket h2 {
  margin: 0 0 .55rem;
  color: var(--text);
  font-size: 1.35rem;
}

.empty-ticket p {
  max-width: 360px;
  margin: 0;
  color: var(--text-muted);
}

.empty-cta {
  margin-top: 1.25rem;
}

.loading-screen {
  display: flex;
  min-height: 300px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
  color: var(--text-muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(.72);
    opacity: .68;
  }
}

@keyframes modal-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes modal-rise {
  from {
    opacity: 0;
    transform: translateY(12px) scale(.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes scan-line {
  0%,
  100% {
    top: 22%;
    opacity: .35;
  }

  50% {
    top: 78%;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner,
  .live-dot::before,
  .cancel-modal,
  .cancel-dialog,
  .ticket-modal,
  .qr-dialog,
  .scan-line {
    animation: none;
  }

  .progress span,
  .cancel-btn,
  .modal-secondary,
  .modal-danger,
  .modal-primary,
  .qr-card {
    transition: none;
  }
}

@media (max-width: 1100px) {
  .ticket-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .ticket-card,
  .monitor-card,
  .notifications-card,
  .empty-ticket {
    padding: 1rem;
  }

  .ticket-topline,
  .ticket-hero,
  .ticket-tools {
    flex-direction: column;
    align-items: stretch;
  }

  .status-pill {
    align-self: flex-start;
  }

  .ticket-number {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: .28rem;
  }

  .info-grid dd {
    margin-bottom: .45rem;
  }

  .qr-card {
    width: 100%;
  }

  .monitor-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .modal-actions,
  .modal-ticket div,
  .qr-dialog-layout {
    grid-template-columns: 1fr;
  }

  .qr-stage {
    min-height: 240px;
  }

  .qr-code-large {
    grid-template-columns: repeat(7, 14px);
    grid-auto-rows: 14px;
    gap: 5px;
  }
}

@media (max-width: 430px) {
  .monitor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
