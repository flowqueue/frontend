<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/shared/components/AppLayout.vue'
import { http } from '@/shared/services/http.js'
import { formatTime } from '@/shared/utils/format.js'

const loading = ref(true)
const turnos = ref([])
const sedes = ref([])
const servicios = ref([])
const search = ref('')
const statusFilter = ref('todos')
const sedeFilter = ref('todos')
const creating = ref(false)
const formError = ref('')

const form = ref({
  ciudadanoNombre: '',
  ciudadanoDNI: '',
  sedeId: '',
  servicioId: '',
})

const estadoLabels = {
  en_espera: 'En espera',
  en_atencion: 'En atención',
  atendido: 'Atendido',
  ausente: 'Ausente',
  cancelado: 'Cancelado',
}

const estadoClass = {
  en_espera: 'badge-blue',
  en_atencion: 'badge-orange',
  atendido: 'badge-green',
  ausente: 'badge-gray',
  cancelado: 'badge-red',
}

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const [t, s, sv] = await Promise.all([
      http.get('/turnos'),
      http.get('/sedes'),
      http.get('/servicios'),
    ])
    turnos.value = [...t].sort((a, b) => new Date(b.horaIngreso) - new Date(a.horaIngreso))
    sedes.value = s
    servicios.value = sv
    if (!form.value.sedeId && s.length) form.value.sedeId = s[0].id
    if (!form.value.servicioId && sv.length) form.value.servicioId = sv[0].id
  } finally {
    loading.value = false
  }
}

const availableServices = computed(() => {
  if (!form.value.sedeId) return servicios.value
  return servicios.value.filter(s => String(s.sedeId) === String(form.value.sedeId))
})

function sedeName(id) {
  return sedes.value.find(s => String(s.id) === String(id))?.nombre ?? 'N/A'
}

function serviceName(id) {
  return servicios.value.find(s => String(s.id) === String(id))?.nombre ?? 'N/A'
}

function nextCode(serviceId) {
  const service = servicios.value.find(s => String(s.id) === String(serviceId))
  const prefix = service?.prefijo ?? 'T'
  const total = turnos.value.filter(t => String(t.servicioId) === String(serviceId)).length + 1
  return `${prefix}-${String(total).padStart(3, '0')}`
}

const filteredTurnos = computed(() => {
  const q = search.value.trim().toLowerCase()
  return turnos.value.filter(t => {
    const matchesSearch = !q ||
      t.codigo?.toLowerCase().includes(q) ||
      t.ciudadanoNombre?.toLowerCase().includes(q) ||
      t.ciudadanoDNI?.includes(q)
    const matchesStatus = statusFilter.value === 'todos' || t.estado === statusFilter.value
    const matchesSede = sedeFilter.value === 'todos' || String(t.sedeId) === String(sedeFilter.value)
    return matchesSearch && matchesStatus && matchesSede
  })
})

async function createTurno() {
  formError.value = ''
  if (!form.value.ciudadanoNombre || !form.value.ciudadanoDNI || !form.value.sedeId || !form.value.servicioId) {
    formError.value = 'Completa todos los campos para generar un turno.'
    return
  }

  creating.value = true
  try {
    const nuevoTurno = {
      codigo: nextCode(form.value.servicioId),
      ciudadanoNombre: form.value.ciudadanoNombre.trim(),
      ciudadanoDNI: form.value.ciudadanoDNI.trim(),
      servicioId: Number(form.value.servicioId),
      mostradorId: null,
      sedeId: Number(form.value.sedeId),
      estado: 'en_espera',
      horaIngreso: new Date().toISOString(),
      horaLlamado: null,
      horaFin: null,
    }
    await http.post('/turnos', nuevoTurno)
    form.value.ciudadanoNombre = ''
    form.value.ciudadanoDNI = ''
    await loadData()
  } finally {
    creating.value = false
  }
}

async function changeEstado(turno, estado) {
  const payload = { estado }
  if (estado === 'en_atencion') payload.horaLlamado = new Date().toISOString()
  if (estado === 'atendido' || estado === 'ausente' || estado === 'cancelado') payload.horaFin = new Date().toISOString()
  await http.patch(`/turnos/${turno.id}`, payload)
  await loadData()
}
</script>

<template>
  <AppLayout title="Gestionar turnos" subtitle="Crea, filtra y actualiza los turnos de atención">
    <div class="turns-layout">
      <section class="card create-card">
        <div class="card-header">
          <p class="eyebrow">Nuevo ticket</p>
          <h2>Registrar turno</h2>
          <p>Genera un ticket virtual para un ciudadano desde el panel administrativo.</p>
        </div>

        <form class="turn-form" @submit.prevent="createTurno">
          <label>
            Ciudadano
            <input v-model="form.ciudadanoNombre" placeholder="Nombre completo" />
          </label>
          <label>
            DNI
            <input v-model="form.ciudadanoDNI" maxlength="8" placeholder="00000000" />
          </label>
          <label>
            Sede
            <select v-model="form.sedeId">
              <option v-for="s in sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </label>
          <label>
            Servicio
            <select v-model="form.servicioId">
              <option v-for="s in availableServices" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </label>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <button class="btn btn-primary w-full" :disabled="creating">
            {{ creating ? 'Generando...' : 'Generar turno' }}
          </button>
        </form>
      </section>

      <section class="card list-card">
        <div class="list-toolbar">
          <div>
            <p class="eyebrow">Administración</p>
            <h2>Turnos registrados</h2>
          </div>
          <span class="badge badge-dark">{{ filteredTurnos.length }} resultados</span>
        </div>

        <div class="filters-row">
          <input v-model="search" class="search-input" placeholder="Buscar por código, ciudadano o DNI..." />
          <select v-model="statusFilter">
            <option value="todos">Todos los estados</option>
            <option value="en_espera">En espera</option>
            <option value="en_atencion">En atención</option>
            <option value="atendido">Atendido</option>
            <option value="ausente">Ausente</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select v-model="sedeFilter">
            <option value="todos">Todas las sedes</option>
            <option v-for="s in sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
        </div>

        <div v-if="loading" class="loading-screen"><div class="spinner"></div><p>Cargando turnos...</p></div>

        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th><th>Ciudadano</th><th>Servicio</th><th>Sede</th><th>Ingreso</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredTurnos.length"><td colspan="7" class="empty-cell">No se encontraron turnos</td></tr>
              <tr v-for="turno in filteredTurnos" :key="turno.id">
                <td class="td-code">{{ turno.codigo }}</td>
                <td><strong>{{ turno.ciudadanoNombre }}</strong><br><span class="td-muted">DNI {{ turno.ciudadanoDNI }}</span></td>
                <td class="td-muted">{{ serviceName(turno.servicioId) }}</td>
                <td class="td-muted">{{ sedeName(turno.sedeId) }}</td>
                <td class="td-muted">{{ formatTime(turno.horaIngreso) }}</td>
                <td><span class="badge" :class="estadoClass[turno.estado]">{{ estadoLabels[turno.estado] ?? turno.estado }}</span></td>
                <td class="td-actions">
                  <button class="pill-btn pill-dark" :disabled="turno.estado !== 'en_espera'" @click="changeEstado(turno, 'en_atencion')">Llamar</button>
                  <button class="pill-btn pill-ghost" :disabled="turno.estado === 'atendido'" @click="changeEstado(turno, 'atendido')">Atendido</button>
                  <button class="pill-btn pill-danger" :disabled="turno.estado === 'cancelado'" @click="changeEstado(turno, 'cancelado')">Cancelar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.turns-layout { display: grid; grid-template-columns: 340px 1fr; gap: 1rem; align-items: start; }
.create-card, .list-card { padding: 1.25rem; }
.card-header, .list-toolbar { margin-bottom: 1rem; }
.card-header h2, .list-toolbar h2 { font-size: 1.15rem; margin: .2rem 0; color: var(--text); }
.card-header p:not(.eyebrow) { color: var(--text-muted); font-size: .85rem; line-height: 1.55; }
.eyebrow { font-size: .7rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: .08em; }
.turn-form { display: flex; flex-direction: column; gap: .85rem; }
label { display: flex; flex-direction: column; gap: .35rem; font-size: .78rem; font-weight: 700; color: var(--text); }
input, select { width: 100%; border: 1.5px solid var(--border); border-radius: 10px; padding: .6rem .75rem; font-size: .86rem; color: var(--text); background: #fff; outline: none; }
input:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(12,68,124,.1); }
.form-error { background: #fee2e2; color: #b91c1c; padding: .55rem .7rem; border-radius: 8px; font-size: .78rem; }
.list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.filters-row { display: grid; grid-template-columns: 1.4fr .7fr .9fr; gap: .75rem; margin-bottom: 1rem; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
.data-table thead tr { background: #1e293b; }
.data-table th { padding: .7rem .85rem; text-align: left; font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; }
.data-table td { padding: .72rem .85rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
.data-table tbody tr:hover td { background: #f8fafc; }
.td-code { font-weight: 800; color: var(--primary); }
.td-muted { color: var(--text-muted); font-size: .78rem; }
.td-actions { display: flex; gap: .35rem; flex-wrap: wrap; }
.pill-btn { border: none; border-radius: 999px; padding: .32rem .65rem; font-size: .72rem; font-weight: 700; cursor: pointer; }
.pill-btn:disabled { opacity: .45; cursor: not-allowed; }
.pill-dark { background: #1e293b; color: #fff; }
.pill-ghost { background: #f1f5f9; color: var(--text-muted); border: 1px solid var(--border); }
.pill-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.empty-cell { text-align: center; padding: 2.5rem; color: var(--text-muted); }
.loading-screen { min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-muted); }
.spinner { width: 34px; height: 34px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media(max-width:1100px){ .turns-layout { grid-template-columns: 1fr; } .filters-row { grid-template-columns: 1fr; } }
</style>
