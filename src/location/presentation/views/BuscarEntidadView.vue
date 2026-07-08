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
  Tributario: { icon: '🧾', color: 'blue' },
}

onMounted(() => location.loadCatalog())

function applySearch() {
  searched.value = true
}

const catalogCards = computed(() => {
  const institutions = location.instituciones.map((institution) => {
    const sedes = location.sedes.filter(sede => String(sede.institucionId) === String(institution.id))
    const sedeIds = sedes.map(sede => String(sede.id))
    const servicios = location.servicios.filter(service => sedeIds.includes(String(service.sedeId)))
    const type = institution.tipo ?? 'Documentos'
    const style = styleByType[type] ?? { icon: '🏢', color: 'blue' }

    return { ...institution, type, sedes, servicios, ...style }
  })

  return institutions.filter((item) => {
    const q = search.value.trim().toLowerCase()
    const typeOk = selectedType.value === 'Todas' || item.type === selectedType.value
    const textOk = !q
      || item.nombre.toLowerCase().includes(q)
      || item.descripcion.toLowerCase().includes(q)
      || item.type.toLowerCase().includes(q)
      || item.sedes.some(sede => String(sede.distrito ?? '').toLowerCase().includes(q))

    return typeOk && textOk
  })
})

const catalogSummary = computed(() => {
  const sedes = catalogCards.value.reduce((total, item) => total + item.sedes.length, 0)
  const servicios = catalogCards.value.reduce((total, item) => total + item.servicios.length, 0)

  return [
    { label: 'Entidades', value: catalogCards.value.length },
    { label: 'Sedes', value: sedes },
    { label: 'Tramites', value: servicios },
  ]
})

const serviciosForSelectedSede = computed(() =>
  location.servicios.filter(service => String(service.sedeId) === String(selSedeId.value)))

function toggleExpand(item) {
  errorMsg.value = ''
  if (expandedId.value === item.id) {
    expandedId.value = null
    return
  }

  expandedId.value = item.id
  const firstSede = item.sedes[0]
  selSedeId.value = firstSede?.id ?? null
  const firstServicio = location.servicios.find(service => String(service.sedeId) === String(firstSede?.id))
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
    const citizenDocumentNumber = auth.user?.dni ?? auth.user?.documentNumber
    if (!citizenDocumentNumber) {
      errorMsg.value = 'Tu cuenta no tiene DNI registrado. Actualiza tu perfil o crea una cuenta con documento.'
      return
    }

    const created = await queue.createTicket({
      ciudadanoNombre: auth.user?.nombre ?? 'Ciudadano',
      ciudadanoDNI: citizenDocumentNumber,
      servicioId: Number(selServicioId.value),
      sedeId: Number(selSedeId.value),
    })

    localStorage.setItem('fq_active_ticket_id', created.id)
    router.push('/citizen/mis-turnos')
  } catch (_) {
    errorMsg.value = 'No se pudo generar el turno. Intentalo de nuevo.'
  } finally {
    creatingId.value = null
  }
}
</script>

<template>
  <AppLayout title="Buscar entidad" subtitle="Selecciona la institucion y sede donde realizaras tu tramite">
    <section class="finder-hero">
      <div class="finder-copy">
        <span class="kicker">Catalogo publico</span>
        <h2>Encuentra donde hacer tu tramite</h2>
        <p>Compara entidades, sedes y servicios disponibles antes de generar tu turno virtual.</p>
      </div>

      <div class="summary-strip" aria-label="Resumen del catalogo">
        <div v-for="item in catalogSummary" :key="item.label" class="summary-item">
          <strong>{{ item.value }}</strong>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </section>

    <section class="search-card card">
      <div class="search-row">
        <div class="search-field">
          <span aria-hidden="true">🔎</span>
          <input
            v-model="search"
            placeholder="Buscar institucion, sede o tipo de tramite"
            @keyup.enter="applySearch"
          />
        </div>
        <button class="btn btn-primary" type="button" @click="applySearch">Buscar</button>
      </div>

      <div class="filters" role="list" aria-label="Filtros de entidad">
        <span>Filtrar por</span>
        <button
          v-for="type in types"
          :key="type"
          class="filter-chip"
          :class="{ active: selectedType === type }"
          type="button"
          @click="selectedType = type"
        >
          {{ type }}
        </button>
      </div>
    </section>

    <p v-if="searched" class="search-result">
      {{ catalogCards.length }} entidades encontradas para tu busqueda.
    </p>

    <div v-if="location.loading" class="loading-screen">
      <div class="spinner"></div>
      <p>Cargando entidades...</p>
    </div>

    <section v-else class="entity-grid">
      <article v-for="item in catalogCards" :key="item.id" class="entity-card card" :class="`card-${item.color}`">
        <div class="entity-head">
          <div class="entity-icon">{{ item.icon }}</div>
          <div class="entity-title">
            <h3>{{ item.nombre }}</h3>
            <p>{{ item.descripcion }}</p>
          </div>
          <span class="available">{{ item.type }}</span>
        </div>

        <div class="entity-route">
          <span>{{ item.sedes[0]?.distrito ?? 'Lima' }}</span>
          <strong>{{ item.sedes.length > 1 ? `+${item.sedes.length - 1} sedes` : 'Sede principal' }}</strong>
        </div>

        <div class="entity-metrics">
          <div>
            <strong>{{ item.sedes.length }}</strong>
            <span>{{ item.sedes.length === 1 ? 'sede' : 'sedes' }}</span>
          </div>
          <div>
            <strong>{{ item.servicios.length }}</strong>
            <span>tramites</span>
          </div>
        </div>

        <div v-if="expandedId === item.id" class="select-panel">
          <label>
            Sede
            <select v-model="selSedeId" @change="onSedeChange">
              <option v-for="sede in item.sedes" :key="sede.id" :value="sede.id">
                {{ sede.nombre }} - {{ sede.distrito }}
              </option>
            </select>
          </label>
          <label>
            Tramite
            <select v-model="selServicioId">
              <option v-for="service in serviciosForSelectedSede" :key="service.id" :value="service.id">
                {{ service.nombre }} (~{{ service.duracionPromedio }} min)
              </option>
            </select>
          </label>

          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

          <div class="panel-actions">
            <button class="entity-btn" :disabled="creatingId === item.id || !selServicioId" @click="generateTicket(item)">
              {{ creatingId === item.id ? 'Generando...' : 'Generar turno' }}
            </button>
            <button class="ghost-btn" type="button" @click="expandedId = null">Cancelar</button>
          </div>
        </div>

        <button
          v-else
          class="entity-btn"
          type="button"
          :disabled="!item.sedes.length || !item.servicios.length"
          @click="toggleExpand(item)"
        >
          {{ item.sedes.length ? 'Elegir sede y tramite' : 'Sin sedes disponibles' }}
        </button>
      </article>
    </section>

    <section v-if="!location.loading && !catalogCards.length" class="card empty-state">
      <h3>Sin resultados</h3>
      <p>No encontramos entidades para tu busqueda. Prueba con otro nombre o quita los filtros.</p>
    </section>
  </AppLayout>
</template>

<style scoped>
.finder-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: 1rem;
  align-items: stretch;
  margin-bottom: 1rem;
  padding: 1.2rem;
  border: 1px solid rgba(199, 215, 254, 0.78);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(25, 103, 210, 0.1), transparent 46%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(238, 246, 255, 0.9));
  box-shadow: var(--shadow-sm);
}

.finder-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(25, 103, 210, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(25, 103, 210, 0.045) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}

.finder-copy,
.summary-strip {
  position: relative;
  z-index: 1;
}

.kicker {
  display: inline-flex;
  margin-bottom: 0.45rem;
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

.finder-copy h2 {
  max-width: 620px;
  color: var(--ink);
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  line-height: 1.05;
}

.finder-copy p {
  max-width: 680px;
  margin-top: 0.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.55;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
}

.summary-item {
  min-height: 92px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.85rem;
  border: 1px solid rgba(191, 219, 254, 0.9);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
}

.summary-item strong,
.summary-item span {
  display: block;
}

.summary-item strong {
  color: var(--ink);
  font-size: 1.45rem;
  line-height: 1;
}

.summary-item span {
  margin-top: 0.3rem;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 850;
}

.search-card {
  padding: 1rem;
  margin-bottom: 1rem;
}

.search-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 0.75rem;
}

.search-row .btn {
  min-width: 150px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 46px;
  padding: 0 0.85rem;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  background: #fff;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.search-field,
.search-field input,
.entity-card,
.entity-title,
.select-panel,
.select-panel select {
  min-width: 0;
}

.search-field:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(25, 103, 210, 0.1);
}

.search-field span {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #eff6ff;
  color: var(--primary);
  font-size: 1rem;
  font-weight: 950;
}

.search-field input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: 0.88rem;
}

.filters {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.85rem;
  flex-wrap: wrap;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.filters > span {
  margin-right: 0.1rem;
  font-weight: 850;
}

.filter-chip {
  min-height: 30px;
  border: 1px solid transparent;
  background: #eef2f6;
  color: var(--text-muted);
  padding: 0 1rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 850;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.filter-chip:hover {
  border-color: #bfdbfe;
  color: var(--primary);
  transform: translateY(-1px);
}

.filter-chip.active {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 8px 18px rgba(25, 103, 210, 0.18);
}

.search-result {
  margin: -0.35rem 0 1rem;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 800;
}

.entity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr));
  gap: 1rem;
  align-items: start;
}

.entity-card {
  position: relative;
  overflow: hidden;
  min-height: 230px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-top: 0;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.entity-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: var(--accent, var(--primary));
}

.entity-card:hover {
  transform: translateY(-3px);
  border-color: #cbd8e8;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.1);
}

.card-blue {
  --accent: var(--primary);
  --accent-soft: #eff6ff;
}

.card-green {
  --accent: #12b76a;
  --accent-soft: #ecfdf3;
}

.card-orange {
  --accent: #f59e0b;
  --accent-soft: #fff7ed;
}

.card-purple {
  --accent: #7c3aed;
  --accent-soft: #f5f3ff;
}

.entity-head {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 0.75rem;
  align-items: flex-start;
}

.entity-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--accent-soft, #eef2f6);
  color: var(--accent, var(--primary));
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0;
}

.entity-title {
  min-width: 0;
}

.entity-title h3 {
  overflow-wrap: anywhere;
  color: var(--ink);
  font-size: 0.98rem;
  font-weight: 950;
  line-height: 1.2;
}

.entity-title p {
  margin-top: 0.18rem;
  color: var(--text-muted);
  font-size: 0.73rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.available {
  align-self: flex-start;
  padding: 0.22rem 0.62rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #087852;
  font-size: 0.68rem;
  font-weight: 900;
  white-space: nowrap;
}

.entity-route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  margin-top: 1rem;
  padding: 0.7rem 0;
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
}

.entity-route span {
  color: var(--ink-soft);
  font-size: 0.78rem;
  font-weight: 850;
}

.entity-route strong {
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 850;
  white-space: nowrap;
}

.entity-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
  margin: 0.85rem 0 0.7rem;
}

.entity-metrics div {
  min-height: 54px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: #f8fafc;
}

.entity-metrics strong {
  color: var(--ink);
  font-size: 1rem;
  line-height: 1;
}

.entity-metrics span {
  margin-top: 0.22rem;
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 800;
}

.entity-btn {
  width: 100%;
  min-height: 38px;
  margin-top: auto;
  border: 0;
  border-radius: 7px;
  background: var(--primary);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.entity-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  box-shadow: 0 12px 24px rgba(25, 103, 210, 0.22);
  transform: translateY(-1px);
}

.entity-btn:disabled {
  opacity: 0.58;
  cursor: not-allowed;
  box-shadow: none;
}

.ghost-btn {
  min-height: 38px;
  border: 1.5px solid var(--border);
  border-radius: 7px;
  background: #fff;
  color: var(--text-muted);
  padding: 0 0.9rem;
  font-size: 0.76rem;
  font-weight: 850;
  cursor: pointer;
}

.ghost-btn:hover {
  background: #f1f5f9;
  color: var(--ink-soft);
}

.select-panel {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 0.8rem;
  padding: 0.8rem;
  border: 1px solid #c7d7fe;
  border-radius: 8px;
  background: #f8fbff;
  animation: panel-in 0.18s ease;
}

.select-panel label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: var(--ink-soft);
  font-size: 0.72rem;
  font-weight: 850;
}

.select-panel select {
  min-height: 38px;
  border: 1.5px solid var(--border);
  border-radius: 7px;
  outline: none;
  background: #fff;
  color: var(--text);
  padding: 0 0.65rem;
  font-size: 0.78rem;
  text-overflow: ellipsis;
}

.select-panel select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(25, 103, 210, 0.1);
}

.panel-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}

.error-msg {
  color: #b91c1c;
  font-size: 0.74rem;
  font-weight: 800;
}

.empty-state {
  padding: 2.4rem;
  text-align: center;
  color: var(--text-muted);
}

.empty-state h3 {
  margin-bottom: 0.4rem;
  color: var(--text);
}

.loading-screen {
  min-height: 220px;
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
  animation: spin 0.8s linear infinite;
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1180px) {
  .finder-hero,
  .entity-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-strip {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .finder-hero,
  .entity-grid,
  .search-row {
    grid-template-columns: 1fr;
  }

  .finder-hero {
    padding: 1rem;
  }

  .summary-strip {
    grid-template-columns: repeat(3, 1fr);
  }

  .summary-item {
    min-height: 72px;
    padding: 0.7rem;
  }
}

@media (max-width: 560px) {
  .summary-strip,
  .entity-head,
  .panel-actions {
    grid-template-columns: 1fr;
  }

  .available {
    justify-self: flex-start;
  }
}
</style>
