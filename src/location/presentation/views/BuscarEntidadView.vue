<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/shared/components/AppLayout.vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useLocationStore } from '@/location/application/location.store.js'
import { useQueueStore } from '@/queue/application/queue.store.js'

const router = useRouter()
const auth = useAuthStore()
const location = useLocationStore()
const queue = useQueueStore()
const search = ref('')
const selectedType = ref('Todas')
const creatingId = ref(null)
const searched = ref(false)
const expandedId = ref(null)
const selSedeId = ref(null)
const selServicioId = ref(null)
const errorMsg = ref('')

const types = ['Todas', 'Documentos', 'Salud', 'Bancario', 'Municipal']

const styleByType = {
  Documentos: { icon: '🪪', color: 'blue' },
  Salud: { icon: '🏥', color: 'green' },
  Bancario: { icon: '🏦', color: 'orange' },
  Municipal: { icon: '🏛️', color: 'purple' },
  Tributario: { icon: '📄', color: 'blue' },
}

onMounted(() => location.loadCatalog())

function applySearch() { searched.value = true }

const catalogCards = computed(() => {
  const institutions = location.instituciones.map(i => {
    const sedes = location.sedes.filter(s => String(s.institucionId) === String(i.id))
    const sedeIds = sedes.map(s => String(s.id))
    const servicios = location.servicios.filter(s => sedeIds.includes(String(s.sedeId)))
    const type = i.tipo ?? 'Documentos'
    const style = styleByType[type] ?? { icon: '🏢', color: 'blue' }
    return { ...i, type, sedes, servicios, ...style }
  })

  return institutions.filter(item => {
    const q = search.value.trim().toLowerCase()
    const typeOk = selectedType.value === 'Todas' || item.type === selectedType.value
    const textOk = !q || item.nombre.toLowerCase().includes(q) || item.descripcion.toLowerCase().includes(q)
    return typeOk && textOk
  })
})

const serviciosForSelectedSede = computed(() =>
  location.servicios.filter(s => String(s.sedeId) === String(selSedeId.value)))

function toggleExpand(item) {
  errorMsg.value = ''
  if (expandedId.value === item.id) {
    expandedId.value = null
    return
  }
  expandedId.value = item.id
  const firstSede = item.sedes[0]
  selSedeId.value = firstSede?.id ?? null
  const firstServicio = location.servicios.find(s => String(s.sedeId) === String(firstSede?.id))
  selServicioId.value = firstServicio?.id ?? null
}

function onSedeChange() {
  const firstServicio = serviciosForSelectedSede.value[0]
  selServicioId.value = firstServicio?.id ?? null
}

async function generateTicket(item) {
  if (!selSedeId.value || !selServicioId.value) return
  errorMsg.value = ''
  creatingId.value = item.id
  try {
    const created = await queue.createTicket({
      ciudadanoNombre: auth.user?.nombre ?? 'Ciudadano',
      ciudadanoDNI: auth.user?.dni ?? null,
      servicioId: Number(selServicioId.value),
      sedeId: Number(selSedeId.value),
    })
    localStorage.setItem('fq_active_ticket_id', created.id)
    router.push('/citizen/mis-turnos')
  } catch (e) {
    errorMsg.value = 'No se pudo generar el turno. Inténtalo de nuevo.'
  } finally {
    creatingId.value = null
  }
}
</script>

<template>
  <AppLayout title="Buscar entidad" subtitle="Selecciona la institución y sede donde realizarás tu trámite">
    <section class="search-card card">
      <div class="search-row">
        <input v-model="search" placeholder="Buscar institución (RENIEC, EsSalud, Banco de la Nación...)" />
        <button class="btn btn-primary" @click="applySearch">Buscar</button>
      </div>
      <div class="filters">
        <span>Filtrar por:</span>
        <button v-for="type in types" :key="type" class="filter-chip" :class="{ active: selectedType === type }" @click="selectedType = type">
          {{ type }}
        </button>
      </div>
    </section>
    <p v-if="searched" class="search-result">{{ catalogCards.length }} entidades encontradas para tu búsqueda.</p>

    <div v-if="location.loading" class="loading-screen"><div class="spinner"></div><p>Cargando entidades...</p></div>

    <section v-else class="entity-grid">
      <article v-for="item in catalogCards" :key="item.id" class="entity-card card" :class="`card-${item.color}`">
        <div class="entity-head">
          <div class="entity-icon">{{ item.icon }}</div>
          <div>
            <h3>{{ item.nombre }}</h3>
            <p>{{ item.descripcion }}</p>
          </div>
        </div>
        <div class="entity-line"></div>
        <div class="entity-meta">
          <span>📍 {{ item.sedes[0]?.distrito ?? 'Lima' }}{{ item.sedes.length > 1 ? ` y ${item.sedes.length - 1} más` : '' }}</span>
          <span class="available">{{ item.type }}</span>
        </div>
        <div class="entity-meta small">
          <span>🏢 {{ item.sedes.length }} {{ item.sedes.length === 1 ? 'sede' : 'sedes' }}</span>
          <span>📋 {{ item.servicios.length }} trámites</span>
        </div>

        <div v-if="expandedId === item.id" class="select-panel">
          <label>
            Sede
            <select v-model="selSedeId" @change="onSedeChange">
              <option v-for="s in item.sedes" :key="s.id" :value="s.id">{{ s.nombre }} — {{ s.distrito }}</option>
            </select>
          </label>
          <label>
            Trámite
            <select v-model="selServicioId">
              <option v-for="sv in serviciosForSelectedSede" :key="sv.id" :value="sv.id">{{ sv.nombre }} (~{{ sv.duracionPromedio }} min)</option>
            </select>
          </label>
          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
          <div class="panel-actions">
            <button class="entity-btn" :disabled="creatingId === item.id || !selServicioId" @click="generateTicket(item)">
              {{ creatingId === item.id ? 'Generando...' : 'Generar turno' }}
            </button>
            <button class="ghost-btn" @click="expandedId = null">Cancelar</button>
          </div>
        </div>

        <button v-else class="entity-btn" :disabled="!item.sedes.length || !item.servicios.length" @click="toggleExpand(item)">
          {{ item.sedes.length ? 'Elegir sede y trámite' : 'Sin sedes disponibles' }}
        </button>
      </article>
    </section>

    <section v-if="!location.loading && !catalogCards.length" class="card empty-state">
      <h3>Sin resultados</h3>
      <p>No encontramos entidades para tu búsqueda. Prueba con otro nombre o quita los filtros.</p>
    </section>
  </AppLayout>
</template>

<style scoped>
.search-card { padding: 1rem; margin-bottom: 1rem; }
.search-row { display: grid; grid-template-columns: 1fr 150px; gap: .75rem; }
.search-row input { border: 1.5px solid var(--border); border-radius: 8px; padding: .65rem .9rem; font-size: .86rem; outline: none; }
.search-row input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(29,111,233,.08); }
.filters { display: flex; align-items: center; gap: .45rem; margin-top: .85rem; flex-wrap: wrap; font-size: .75rem; color: var(--text-muted); }
.filter-chip { border: none; background: #eef2f7; color: var(--text-muted); padding: .35rem 1.15rem; border-radius: 999px; font-size: .72rem; font-weight: 700; cursor: pointer; transition: background .15s ease, color .15s ease; }
.filter-chip:hover { background: #dbe5f1; }
.filter-chip.active { background: #1d6fe9; color: white; }
.search-result { margin: -0.35rem 0 1rem; color: var(--text-muted); font-size: .82rem; font-weight: 700; }
.entity-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; align-items: start; }
.entity-card { padding: 1rem; border-top: 4px solid #1d6fe9; transition: transform .15s ease, box-shadow .15s ease; }
.entity-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,23,42,.08); }
.card-green { border-top-color: #22c55e; }
.card-orange { border-top-color: #f59e0b; }
.card-purple { border-top-color: #7c3aed; }
.entity-head { display: flex; gap: .75rem; align-items: flex-start; }
.entity-icon { width: 42px; height: 42px; border-radius: 8px; display:flex; align-items:center; justify-content:center; background:#eef2f7; font-size: 1.2rem; flex-shrink: 0; }
.entity-head h3 { font-size: .95rem; font-weight: 800; }
.entity-head p { font-size: .72rem; color: var(--text-muted); margin-top: .15rem; }
.entity-line { border-top: 1px solid var(--border); margin: .85rem 0; }
.entity-meta { display:flex; justify-content:space-between; gap: .8rem; align-items:center; font-size:.75rem; color: var(--text-muted); margin-bottom:.55rem; }
.entity-meta.small { font-size: .7rem; }
.available { background: #dcfce7; color: #15803d; padding: .18rem .65rem; border-radius: 999px; font-weight: 700; }
.entity-btn { width: 100%; margin-top: .4rem; border: none; background: #1d6fe9; color: white; border-radius: 7px; padding: .55rem; font-weight: 800; font-size: .78rem; cursor: pointer; transition: background .15s ease; }
.entity-btn:hover { background: #155ec9; }
.entity-btn:disabled { opacity: .6; cursor: not-allowed; }
.ghost-btn { width: 100%; border: 1.5px solid var(--border); background: transparent; color: var(--text-muted); border-radius: 7px; padding: .5rem; font-weight: 700; font-size: .76rem; cursor: pointer; }
.ghost-btn:hover { background: #f1f5f9; }
.select-panel { margin-top: .6rem; display: flex; flex-direction: column; gap: .55rem; background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: .75rem; animation: panelIn .18s ease; }
@keyframes panelIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.select-panel label { display: flex; flex-direction: column; gap: .3rem; font-size: .7rem; font-weight: 700; color: var(--text-muted); }
.select-panel select { border: 1.5px solid var(--border); border-radius: 7px; padding: .5rem .6rem; font-size: .78rem; background: white; outline: none; }
.select-panel select:focus { border-color: var(--primary); }
.panel-actions { display: grid; grid-template-columns: 1fr auto; gap: .5rem; }
.panel-actions .ghost-btn { width: auto; padding-inline: .9rem; }
.error-msg { color: #b91c1c; font-size: .74rem; font-weight: 700; }
.empty-state { text-align: center; padding: 2.4rem; color: var(--text-muted); }
.empty-state h3 { color: var(--text); margin-bottom: .4rem; }
.loading-screen { display:flex; flex-direction:column; gap:1rem; align-items:center; justify-content:center; min-height:220px; color:var(--text-muted); }
.spinner { width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media(max-width: 1000px){ .entity-grid { grid-template-columns: repeat(2,1fr); } }
@media(max-width: 640px){ .entity-grid,.search-row { grid-template-columns: 1fr; } }
</style>
