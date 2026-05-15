<script setup>
import { onMounted, ref, computed } from 'vue'
import AppLayout from '@/shared/components/AppLayout.vue'
import { http } from '@/shared/services/http.js'

const sedes        = ref([])
const instituciones = ref([])
const loading      = ref(true)
const busqueda     = ref('')

onMounted(async () => {
  const [s, i] = await Promise.all([http.get('/sedes'), http.get('/instituciones')])
  sedes.value = s
  instituciones.value = i
  loading.value = false
})

function instNombre(id) {
  return instituciones.value.find(i => String(i.id) === String(id))?.nombre ?? 'N/A'
}

const filtered = computed(() => {
  if (!busqueda.value.trim()) return sedes.value
  const q = busqueda.value.toLowerCase()
  return sedes.value.filter(s =>
    s.nombre.toLowerCase().includes(q) ||
    s.distrito.toLowerCase().includes(q) ||
    instNombre(s.institucionId).toLowerCase().includes(q)
  )
})

/* Stats estáticos por sede (en producción vendrían del backend) */
const sedeStats = {
  '1': { mostradores: 4, atendidos: 123, enEspera: 7 },
  '2': { mostradores: 2, atendidos:  87, enEspera: 4 },
  '3': { mostradores: 3, atendidos:  56, enEspera: 2 },
  '4': { mostradores: 2, atendidos:  34, enEspera: 1 },
}
function stats(id) { return sedeStats[String(id)] ?? { mostradores: 0, atendidos: 0, enEspera: 0 } }
</script>

<template>
  <AppLayout title="Sedes" subtitle="Administración de sedes y locales">
    <!-- Buscador -->
    <div class="search-bar">
      <input class="search-input" v-model="busqueda" placeholder="Buscar por sede, distrito o institución..." />
    </div>

    <div v-if="loading" class="loading-screen"><div class="spinner"></div><p>Cargando sedes...</p></div>

    <div v-else class="sedes-grid">
      <div v-for="s in filtered" :key="s.id" class="sede-card card">
        <div class="sede-top">
          <div class="sede-inst-badge">{{ instNombre(s.institucionId) }}</div>
          <span class="badge badge-green">Activa</span>
        </div>
        <h3 class="sede-name">{{ s.nombre }}</h3>
        <p class="sede-address">📍 {{ s.direccion }}, {{ s.distrito }}</p>
        <p class="sede-horario">🕐 {{ s.horario }}</p>
        <div class="sede-stats">
          <div class="sstat">
            <span class="sstat-val">{{ stats(s.id).mostradores }}</span>
            <span class="sstat-lbl">Ventanas</span>
          </div>
          <div class="sstat">
            <span class="sstat-val">{{ stats(s.id).atendidos }}</span>
            <span class="sstat-lbl">Atendidos</span>
          </div>
          <div class="sstat">
            <span class="sstat-val">{{ stats(s.id).enEspera }}</span>
            <span class="sstat-lbl">En espera</span>
          </div>
        </div>
      </div>
      <div v-if="!filtered.length" class="empty-state card">
        <p>No se encontraron sedes</p>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.search-bar { margin-bottom: 1rem; }
.search-input { width: 100%; padding: .55rem 1rem; border: 1.5px solid var(--border); border-radius: 10px; font-size: .875rem; outline: none; background: var(--surface); }
.search-input:focus { border-color: var(--primary); }

.sedes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.sede-card { padding: 1.25rem; display: flex; flex-direction: column; gap: .6rem; }
.sede-top  { display: flex; align-items: center; justify-content: space-between; }
.sede-inst-badge { font-size: .72rem; font-weight: 700; background: #dbeafe; color: #1d4ed8; padding: .2rem .6rem; border-radius: 6px; text-transform: uppercase; letter-spacing: .05em; }
.sede-name    { font-size: 1rem; font-weight: 700; color: var(--text); }
.sede-address { font-size: .8rem; color: var(--text-muted); }
.sede-horario { font-size: .78rem; color: var(--text-muted); }
.sede-stats   { display: flex; gap: 0; border-top: 1px solid var(--border); margin-top: .5rem; padding-top: .875rem; }
.sstat        { flex: 1; text-align: center; border-right: 1px solid var(--border); }
.sstat:last-child { border-right: none; }
.sstat-val    { display: block; font-size: 1.3rem; font-weight: 800; color: var(--text); }
.sstat-lbl    { display: block; font-size: .68rem; color: var(--text-muted); margin-top: 1px; }
.empty-state  { padding: 3rem; text-align: center; color: var(--text-muted); }
.loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; min-height: 300px; color: var(--text-muted); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
