<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/shared/components/AppLayout.vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useLocationStore } from '@/location/application/location.store.js'
import { useQueueStore } from '@/queue/application/queue.store.js'
import { http } from '@/shared/services/http.js'

const router = useRouter()
const auth = useAuthStore()
const location = useLocationStore()
const queue = useQueueStore()
const search = ref('')
const selectedType = ref('Todas')
const creatingId = ref(null)
const searched = ref(false)

const types = ['Todas', 'Documentos', 'Salud', 'Bancario', 'Municipal']
const palette = ['blue','green','orange','purple','blue','green']
const icons = ['🏛️','🏥','🏦','📁','🏢','✈️']

onMounted(() => location.loadCatalog())

function applySearch() { searched.value = true }

const catalogCards = computed(() => {
  const institutions = location.instituciones.map((i, index) => {
    const sede = location.sedes.find(s => String(s.institucionId) === String(i.id))
    const servicios = sede ? location.servicios.filter(s => String(s.sedeId) === String(sede.id)) : []
    const type = i.tipo ?? ['Documentos','Salud','Bancario','Tributario','Municipal','Documentos'][index % 6]
    return {
      ...i,
      type,
      sede,
      servicios,
      color: palette[index % palette.length],
      icon: icons[index % icons.length],
      waiting: 12 + (index * 4),
      queue: 12 + (index * 5),
    }
  })

  return institutions.filter(item => {
    const q = search.value.trim().toLowerCase()
    const typeOk = selectedType.value === 'Todas' || item.type === selectedType.value
    const textOk = !q || item.nombre.toLowerCase().includes(q) || item.descripcion.toLowerCase().includes(q)
    return typeOk && textOk
  })
})

async function generateTicket(item) {
  if (!item.sede || !item.servicios.length) return
  creatingId.value = item.id
  const service = item.servicios[0]
  const count = await http.get(`/turns?service_id=${service.id}`)
  const next = String(count.length + 1).padStart(3, '0')
  const payload = {
    codigo: `${service.prefijo ?? 'A'}-${next}`,
    ciudadanoNombre: auth.user?.nombre ?? 'Alexander M.',
    ciudadanoDNI: auth.user?.dni ?? '76543210',
    servicioId: Number(service.id),
    mostradorId: null,
    sedeId: Number(item.sede.id),
    estado: 'en_espera',
    horaIngreso: new Date().toISOString(),
    horaLlamado: null,
    horaFin: null,
  }
  const created = await queue.createTicket(payload)
  localStorage.setItem('fq_active_ticket_id', created.id)
  creatingId.value = null
  router.push('/citizen/mis-turnos')
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

    <section class="entity-grid">
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
          <span>📍 {{ item.sede?.distrito ?? 'Lima' }}</span>
          <span class="available">Disponible</span>
        </div>
        <div class="entity-meta small">
          <span>⏱ {{ item.waiting }} min estimado</span>
          <span>👥 {{ item.queue }} en cola</span>
        </div>
        <button class="entity-btn" :disabled="creatingId === item.id" @click="generateTicket(item)">
          {{ creatingId === item.id ? 'Generando...' : 'Ver sedes' }}
        </button>
      </article>
    </section>
  </AppLayout>
</template>

<style scoped>
.search-card { padding: 1rem; margin-bottom: 1rem; }
.search-row { display: grid; grid-template-columns: 1fr 150px; gap: .75rem; }
.search-row input { border: 1.5px solid var(--border); border-radius: 8px; padding: .65rem .9rem; font-size: .86rem; outline: none; }
.search-row input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(29,111,233,.08); }
.filters { display: flex; align-items: center; gap: .45rem; margin-top: .85rem; flex-wrap: wrap; font-size: .75rem; color: var(--text-muted); }
.filter-chip { border: none; background: #eef2f7; color: var(--text-muted); padding: .35rem 1.15rem; border-radius: 999px; font-size: .72rem; font-weight: 700; cursor: pointer; }
.filter-chip.active { background: #1d6fe9; color: white; }
.search-result { margin: -0.35rem 0 1rem; color: var(--text-muted); font-size: .82rem; font-weight: 700; }
.entity-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; }
.entity-card { padding: 1rem; border-top: 4px solid #1d6fe9; }
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
.entity-btn { width: 100%; margin-top: .4rem; border: none; background: #1d6fe9; color: white; border-radius: 7px; padding: .55rem; font-weight: 800; font-size: .78rem; cursor: pointer; }
.entity-btn:hover { background: #155ec9; }
.entity-btn:disabled { opacity: .6; cursor: wait; }
@media(max-width: 1000px){ .entity-grid { grid-template-columns: repeat(2,1fr); } }
@media(max-width: 640px){ .entity-grid,.search-row { grid-template-columns: 1fr; } }
</style>
