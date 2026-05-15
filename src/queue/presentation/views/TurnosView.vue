<script setup>
import { onMounted, ref, computed } from 'vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import AppLayout from '@/shared/components/AppLayout.vue'
import { http } from '@/shared/services/http.js'
import { formatTime } from '@/shared/utils/format.js'

const auth    = useAuthStore()
const turnos  = ref([])
const loading = ref(true)
const filtro  = ref('todos')
const busqueda = ref('')

onMounted(async () => {
  turnos.value = await http.get(`/turnos?sedeId=${auth.user.sedeId}`)
  loading.value = false
})

const estados = ['todos', 'en_espera', 'en_atencion', 'atendido', 'ausente']
const estadoLabel = e => ({ en_espera:'En espera', en_atencion:'En atención', atendido:'Atendido', ausente:'Ausente', todos:'Todos' }[e] ?? e)
const estadoBadge = e => ({ en_atencion:'badge-blue', atendido:'badge-green', ausente:'badge-red', en_espera:'badge-orange' }[e] ?? 'badge-gray')

const filtered = computed(() => {
  let list = turnos.value
  if (filtro.value !== 'todos') list = list.filter(t => t.estado === filtro.value)
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    list = list.filter(t =>
      t.codigo.toLowerCase().includes(q) ||
      t.ciudadanoNombre.toLowerCase().includes(q) ||
      t.ciudadanoDNI.includes(q)
    )
  }
  return list
})

const counts = computed(() => ({
  todos:        turnos.value.length,
  en_espera:    turnos.value.filter(t => t.estado === 'en_espera').length,
  en_atencion:  turnos.value.filter(t => t.estado === 'en_atencion').length,
  atendido:     turnos.value.filter(t => t.estado === 'atendido').length,
  ausente:      turnos.value.filter(t => t.estado === 'ausente').length,
}))
</script>

<template>
  <AppLayout title="Turnos" subtitle="Gestión de turnos del día">
    <!-- Filtros -->
    <div class="filter-bar card">
      <div class="filter-tabs">
        <button
          v-for="e in estados" :key="e"
          class="ftab" :class="{ active: filtro === e }"
          @click="filtro = e"
        >
          {{ estadoLabel(e) }}
          <span class="ftab-count">{{ counts[e] }}</span>
        </button>
      </div>
      <input class="search-input" v-model="busqueda" placeholder="Buscar por turno, nombre o DNI..." />
    </div>

    <!-- Tabla -->
    <div class="card table-card" v-if="!loading">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Turno</th><th>Ciudadano</th><th>DNI</th><th>Ventana</th><th>Ingresó</th><th>Llamado</th><th>Estado</th></tr>
          </thead>
          <tbody>
            <tr v-if="!filtered.length">
              <td colspan="7" class="empty-cell">Sin resultados para los filtros aplicados</td>
            </tr>
            <tr v-for="t in filtered" :key="t.id">
              <td class="td-code">{{ t.codigo }}</td>
              <td>{{ t.ciudadanoNombre }}</td>
              <td class="td-muted">{{ t.ciudadanoDNI }}</td>
              <td class="td-muted">{{ t.mostradorId ? `M${t.mostradorId}` : '--' }}</td>
              <td class="td-muted">{{ formatTime(t.horaIngreso) }}</td>
              <td class="td-muted">{{ formatTime(t.horaLlamado) }}</td>
              <td><span class="badge" :class="estadoBadge(t.estado)">{{ estadoLabel(t.estado) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="loading-screen"><div class="spinner"></div><p>Cargando...</p></div>
  </AppLayout>
</template>

<style scoped>
.filter-bar { display: flex; align-items: center; gap: 1rem; padding: .75rem 1.25rem; margin-bottom: .875rem; flex-wrap: wrap; }
.filter-tabs { display: flex; gap: .3rem; flex-wrap: wrap; }
.ftab { display: flex; align-items: center; gap: .4rem; padding: .35rem .875rem; border-radius: 999px; font-size: .78rem; font-weight: 600; border: 1.5px solid var(--border); background: transparent; color: var(--text-muted); cursor: pointer; transition: all .15s; }
.ftab:hover  { border-color: var(--primary); color: var(--primary); }
.ftab.active { background: var(--primary); border-color: var(--primary); color: #fff; }
.ftab-count  { background: rgba(255,255,255,.25); padding: .05rem .4rem; border-radius: 999px; font-size: .7rem; }
.ftab.active .ftab-count { background: rgba(255,255,255,.2); }
.search-input { margin-left: auto; padding: .45rem .875rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: .82rem; outline: none; min-width: 240px; }
.search-input:focus { border-color: var(--primary); }

.table-card { overflow: hidden; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
.data-table thead tr { background: #1e293b; }
.data-table th { padding: .6rem 1rem; text-align: left; font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
.data-table td { padding: .65rem 1rem; border-bottom: 1px solid var(--border); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #f8fafc; }
.td-code  { font-weight: 700; color: var(--primary); }
.td-muted { color: var(--text-muted); }
.empty-cell { text-align: center; padding: 3rem; color: var(--text-muted); }
.loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; min-height: 300px; color: var(--text-muted); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
