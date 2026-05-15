<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/shared/components/AppLayout.vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { http } from '@/shared/services/http.js'
import { formatTime } from '@/shared/utils/format.js'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const tickets = ref([])
const sedes = ref([])
const servicios = ref([])
const notificaciones = ref([])
const queue = ref([])

onMounted(loadDashboard)

async function loadDashboard() {
  loading.value = true
  try {
    const dni = auth.user?.dni ?? '76543210'
    const userId = auth.user?.id

    const [citizenTickets, sedeList, serviceList, notes] = await Promise.all([
      http.get(`/turnos?ciudadanoDNI=${encodeURIComponent(dni)}`),
      http.get('/sedes'),
      http.get('/servicios'),
      userId ? http.get(`/notificaciones?userId=${userId}`) : Promise.resolve([]),
    ])

    tickets.value = citizenTickets.sort((a, b) => new Date(b.horaIngreso) - new Date(a.horaIngreso))
    sedes.value = sedeList
    servicios.value = serviceList
    notificaciones.value = notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    if (activeTicket.value) {
      queue.value = await http.get(`/turnos?sedeId=${activeTicket.value.sedeId}&servicioId=${activeTicket.value.servicioId}&estado=en_espera`)
      queue.value.sort((a, b) => new Date(a.horaIngreso) - new Date(b.horaIngreso))
    }
  } finally {
    loading.value = false
  }
}

const firstName = computed(() => auth.user?.nombre?.split(' ')[0] ?? 'Ciudadano')

const activeTicket = computed(() => {
  return tickets.value.find(ticket => ['en_espera', 'en_atencion'].includes(ticket.estado)) ?? null
})

const lastTicket = computed(() => tickets.value[0] ?? null)

const activeSede = computed(() => {
  if (!activeTicket.value) return null
  return sedes.value.find(sede => String(sede.id) === String(activeTicket.value.sedeId)) ?? null
})

const activeService = computed(() => {
  if (!activeTicket.value) return null
  return servicios.value.find(servicio => String(servicio.id) === String(activeTicket.value.servicioId)) ?? null
})

const position = computed(() => {
  if (!activeTicket.value) return '—'
  if (activeTicket.value.estado === 'en_atencion') return 'En atención'
  const index = queue.value.findIndex(ticket => String(ticket.id) === String(activeTicket.value.id))
  return index >= 0 ? `#${index + 1}` : '—'
})

const peopleAhead = computed(() => {
  if (!activeTicket.value || activeTicket.value.estado === 'en_atencion') return 0
  const index = queue.value.findIndex(ticket => String(ticket.id) === String(activeTicket.value.id))
  return index > 0 ? index : 0
})

const estimatedWait = computed(() => {
  if (!activeTicket.value) return '—'
  if (activeTicket.value.estado === 'en_atencion') return 'Ahora'
  const duration = activeService.value?.duracionPromedio ?? 10
  return `${Math.max(5, peopleAhead.value * duration + duration)} min`
})

const stats = computed(() => ({
  active: activeTicket.value ? 1 : 0,
  attended: tickets.value.filter(ticket => ticket.estado === 'atendido').length,
  pending: tickets.value.filter(ticket => ticket.estado === 'en_espera').length,
  notifications: notificaciones.value.filter(item => !item.read).length,
}))

const recentTickets = computed(() => tickets.value.slice(0, 4))
const recentNotifications = computed(() => notificaciones.value.slice(0, 3))

function statusLabel(status) {
  const labels = {
    en_espera: 'En espera',
    en_atencion: 'En atención',
    atendido: 'Atendido',
    ausente: 'Ausente',
    cancelado: 'Cancelado',
  }
  return labels[status] ?? status
}

function statusClass(status) {
  return {
    en_espera: 'badge-orange',
    en_atencion: 'badge-blue',
    atendido: 'badge-green',
    ausente: 'badge-red',
    cancelado: 'badge-gray',
  }[status] ?? 'badge-gray'
}

function getSedeName(sedeId) {
  return sedes.value.find(sede => String(sede.id) === String(sedeId))?.nombre ?? 'Sede no registrada'
}

function getServiceName(serviceId) {
  return servicios.value.find(service => String(service.id) === String(serviceId))?.nombre ?? 'Servicio general'
}
</script>

<template>
  <AppLayout title="Inicio" :subtitle="`Bienvenido, ${firstName}. Gestiona tus turnos y revisa el estado de atención.`">
    <div v-if="loading" class="dashboard-loading card">
      <div class="spinner"></div>
      <p>Cargando tu información...</p>
    </div>

    <template v-else>
      <section class="hero-card card">
        <div class="hero-content">
          <span class="hero-kicker">Panel ciudadano</span>
          <h1>Gestiona tus trámites sin esperar de más</h1>
          <p>
            Consulta tu turno activo, revisa tu posición en cola y encuentra nuevas entidades disponibles desde un solo lugar.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" @click="router.push('/citizen/buscar-entidad')">Buscar entidad</button>
            <button class="btn btn-ghost" @click="router.push('/citizen/mis-turnos')">Ver mis turnos</button>
          </div>
        </div>

        <div class="hero-ticket" v-if="activeTicket">
          <span>Turno activo</span>
          <strong>{{ activeTicket.codigo }}</strong>
          <small>{{ activeSede?.nombre ?? 'Sede asignada' }}</small>
        </div>
        <div class="hero-ticket empty" v-else>
          <span>Estado actual</span>
          <strong>Sin turno activo</strong>
          <small>Genera un nuevo ticket para iniciar seguimiento.</small>
        </div>
      </section>

      <section class="stats-grid">
        <article class="stat-card card">
          <span class="stat-label">Turno activo</span>
          <strong>{{ stats.active }}</strong>
          <small>{{ activeTicket ? activeTicket.codigo : 'No activo' }}</small>
        </article>
        <article class="stat-card card">
          <span class="stat-label">Atendidos</span>
          <strong>{{ stats.attended }}</strong>
          <small>Historial personal</small>
        </article>
        <article class="stat-card card">
          <span class="stat-label">En espera</span>
          <strong>{{ stats.pending }}</strong>
          <small>Turnos pendientes</small>
        </article>
        <article class="stat-card card">
          <span class="stat-label">Alertas</span>
          <strong>{{ stats.notifications }}</strong>
          <small>No leídas</small>
        </article>
      </section>

      <section class="dashboard-grid">
        <article class="card active-card">
          <div class="section-head">
            <div>
              <h2>Seguimiento de turno</h2>
              <p>Información principal de tu atención actual.</p>
            </div>
            <span v-if="activeTicket" class="badge" :class="statusClass(activeTicket.estado)">{{ statusLabel(activeTicket.estado) }}</span>
          </div>

          <div v-if="activeTicket" class="ticket-panel">
            <div class="ticket-code-block">
              <span>Código</span>
              <strong>{{ activeTicket.codigo }}</strong>
            </div>

            <div class="tracking-grid">
              <div>
                <span>Posición</span>
                <strong>{{ position }}</strong>
              </div>
              <div>
                <span>Personas delante</span>
                <strong>{{ peopleAhead }}</strong>
              </div>
              <div>
                <span>Tiempo estimado</span>
                <strong>{{ estimatedWait }}</strong>
              </div>
            </div>

            <div class="detail-list">
              <p><span>Sede</span><strong>{{ activeSede?.nombre ?? 'No registrada' }}</strong></p>
              <p><span>Dirección</span><strong>{{ activeSede?.direccion ?? 'No registrada' }}</strong></p>
              <p><span>Servicio</span><strong>{{ activeService?.nombre ?? 'Servicio general' }}</strong></p>
              <p><span>Ingreso</span><strong>{{ formatTime(activeTicket.horaIngreso) }}</strong></p>
            </div>
          </div>

          <div v-else class="empty-state">
            <h3>No tienes un turno activo</h3>
            <p>Busca una institución, selecciona el servicio y genera tu ticket virtual.</p>
            <button class="btn btn-primary" @click="router.push('/citizen/buscar-entidad')">Generar turno</button>
          </div>
        </article>

        <aside class="side-column">
          <article class="card quick-actions">
            <h2>Acciones rápidas</h2>
            <button @click="router.push('/citizen/buscar-entidad')">Buscar instituciones</button>
            <button @click="router.push('/citizen/mis-turnos')">Consultar ticket actual</button>
            <button @click="router.push('/citizen/historial')">Ver historial</button>
          </article>

          <article class="card notifications-panel">
            <div class="section-head compact">
              <div>
                <h2>Notificaciones</h2>
                <p>Últimos avisos recibidos.</p>
              </div>
            </div>
            <div v-if="recentNotifications.length" class="notification-list">
              <div v-for="note in recentNotifications" :key="note.id" class="notification-item" :class="note.type">
                <strong>{{ note.title }}</strong>
                <span>{{ note.message }}</span>
              </div>
            </div>
            <p v-else class="muted-empty">No tienes notificaciones recientes.</p>
          </article>
        </aside>
      </section>

      <section class="card history-card">
        <div class="section-head">
          <div>
            <h2>Últimos turnos</h2>
            <p>Resumen de tus solicitudes más recientes.</p>
          </div>
          <button class="btn btn-ghost btn-sm" @click="router.push('/citizen/historial')">Ver todo</button>
        </div>

        <div v-if="recentTickets.length" class="ticket-table">
          <div class="table-row table-head">
            <span>Código</span>
            <span>Servicio</span>
            <span>Sede</span>
            <span>Hora</span>
            <span>Estado</span>
          </div>
          <div v-for="ticket in recentTickets" :key="ticket.id" class="table-row">
            <strong>{{ ticket.codigo }}</strong>
            <span>{{ getServiceName(ticket.servicioId) }}</span>
            <span>{{ getSedeName(ticket.sedeId) }}</span>
            <span>{{ formatTime(ticket.horaIngreso) }}</span>
            <span class="badge" :class="statusClass(ticket.estado)">{{ statusLabel(ticket.estado) }}</span>
          </div>
        </div>

        <p v-else class="muted-empty">Todavía no tienes turnos registrados.</p>
      </section>
    </template>
  </AppLayout>
</template>

<style scoped>
.dashboard-loading {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
@keyframes spin { to { transform: rotate(360deg); } }
.hero-card {
  padding: 1.6rem;
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 1rem;
  align-items: stretch;
  background: linear-gradient(135deg, #ffffff 0%, #eef6ff 100%);
  overflow: hidden;
}
.hero-kicker {
  display: inline-flex;
  color: var(--primary);
  background: #dbeafe;
  font-size: .72rem;
  font-weight: 900;
  border-radius: 999px;
  padding: .28rem .7rem;
  margin-bottom: .85rem;
}
.hero-content h1 {
  font-size: 1.85rem;
  line-height: 1.1;
  color: #0f172a;
  margin-bottom: .55rem;
}
.hero-content p {
  max-width: 620px;
  color: var(--text-muted);
  font-size: .92rem;
  line-height: 1.55;
}
.hero-actions {
  display: flex;
  gap: .65rem;
  margin-top: 1.15rem;
  flex-wrap: wrap;
}
.hero-ticket {
  border-radius: 16px;
  background: #071f33;
  color: #fff;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: var(--shadow-md);
}
.hero-ticket span {
  font-size: .75rem;
  color: #9fb3c8;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.hero-ticket strong {
  font-size: 2.35rem;
  line-height: 1;
  margin: .5rem 0;
}
.hero-ticket small {
  color: #cbd5e1;
  line-height: 1.4;
}
.hero-ticket.empty strong { font-size: 1.45rem; }
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}
.stat-card {
  padding: 1rem;
  border-left: 4px solid var(--primary);
}
.stat-label {
  display: block;
  color: var(--text-muted);
  font-size: .72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .05em;
}
.stat-card strong {
  display: block;
  font-size: 2rem;
  color: #0f172a;
  margin: .35rem 0 .2rem;
}
.stat-card small {
  color: var(--text-muted);
  font-size: .76rem;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 1rem;
  margin-bottom: 1rem;
}
.active-card,
.quick-actions,
.notifications-panel,
.history-card {
  padding: 1.25rem;
}
.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.section-head.compact { margin-bottom: .8rem; }
h2 {
  font-size: 1rem;
  color: #0f172a;
  margin-bottom: .25rem;
}
.section-head p {
  color: var(--text-muted);
  font-size: .78rem;
}
.ticket-panel {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 1rem;
}
.ticket-code-block {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}
.ticket-code-block span {
  color: #1d4ed8;
  font-size: .72rem;
  font-weight: 900;
  text-transform: uppercase;
}
.ticket-code-block strong {
  color: #1d6fe9;
  font-size: 2.6rem;
  line-height: 1;
  margin-top: .4rem;
}
.tracking-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .7rem;
  grid-column: 2;
}
.tracking-grid div {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: .9rem;
}
.tracking-grid span {
  display: block;
  color: var(--text-muted);
  font-size: .7rem;
  margin-bottom: .3rem;
}
.tracking-grid strong {
  color: #0f172a;
  font-size: 1.15rem;
}
.detail-list {
  grid-column: 1 / -1;
  border-top: 1px solid var(--border);
  padding-top: .9rem;
  display: grid;
  gap: .55rem;
}
.detail-list p {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 1rem;
  font-size: .82rem;
}
.detail-list span { color: var(--text-muted); }
.detail-list strong { color: var(--text); }
.empty-state {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.empty-state h3 { color: #0f172a; margin-bottom: .4rem; }
.empty-state p { color: var(--text-muted); margin-bottom: 1rem; }
.side-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.quick-actions h2 { margin-bottom: .85rem; }
.quick-actions button {
  width: 100%;
  border: 1px solid var(--border);
  background: #f8fafc;
  color: var(--text);
  border-radius: 10px;
  padding: .75rem .85rem;
  text-align: left;
  font-weight: 800;
  margin-bottom: .55rem;
  cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
}
.quick-actions button:hover {
  border-color: #bfdbfe;
  color: var(--primary);
  background: #eff6ff;
}
.notification-list {
  display: grid;
  gap: .55rem;
}
.notification-item {
  padding: .78rem .85rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #f8fafc;
}
.notification-item strong {
  display: block;
  font-size: .8rem;
  color: #0f172a;
  margin-bottom: .2rem;
}
.notification-item span {
  display: block;
  color: var(--text-muted);
  font-size: .74rem;
  line-height: 1.35;
}
.notification-item.warning { background: #fff7ed; border-color: #fed7aa; }
.notification-item.info { background: #eff6ff; border-color: #bfdbfe; }
.ticket-table {
  display: grid;
  gap: .35rem;
}
.table-row {
  display: grid;
  grid-template-columns: 110px 1.2fr 1.3fr 90px 110px;
  gap: .8rem;
  align-items: center;
  padding: .75rem .85rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: .8rem;
  color: var(--text-muted);
}
.table-row strong { color: #0f172a; }
.table-head {
  border: none;
  padding-top: 0;
  padding-bottom: .35rem;
  color: var(--text-muted);
  font-weight: 900;
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.muted-empty {
  color: var(--text-muted);
  font-size: .82rem;
}
@media(max-width: 1100px) {
  .hero-card,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media(max-width: 760px) {
  .stats-grid,
  .ticket-panel,
  .tracking-grid {
    grid-template-columns: 1fr;
  }
  .tracking-grid,
  .detail-list {
    grid-column: auto;
  }
  .table-row {
    grid-template-columns: 1fr;
  }
  .table-head { display: none; }
  .hero-content h1 { font-size: 1.45rem; }
}
</style>
