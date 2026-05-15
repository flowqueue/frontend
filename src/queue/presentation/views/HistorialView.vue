<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/shared/components/AppLayout.vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useQueueStore } from '@/queue/application/queue.store.js'
import { http } from '@/shared/services/http.js'
import { formatMinutes } from '@/shared/utils/format.js'
import { downloadCsv, downloadJson, downloadReport } from '@/shared/utils/export.js'

const auth = useAuthStore()
const queue = useQueueStore()
const filter = ref('todos')
const search = ref('')
const selected = ref(null)
const reprogramming = ref(null)
const feedback = ref('')

onMounted(() => queue.loadCitizenTickets(auth.user?.dni ?? '76543210'))

const rows = computed(() => {
  let list = queue.tickets
  if (filter.value !== 'todos') list = list.filter(t => t.estado === filter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t => t.codigo.toLowerCase().includes(q) || t.ciudadanoNombre.toLowerCase().includes(q))
  }
  return list
})

const summary = computed(() => ({
  total: queue.tickets.length,
  completed: queue.tickets.filter(t => t.estado === 'atendido').length,
  canceled: queue.tickets.filter(t => t.estado === 'cancelado' || t.estado === 'ausente').length,
}))

const label = estado => ({ en_espera:'En curso', en_atencion:'En atención', atendido:'Completado', ausente:'Cancelado', cancelado:'Cancelado' }[estado] ?? estado)
const badge = estado => ({ atendido:'badge-green', en_espera:'badge-blue', en_atencion:'badge-blue', ausente:'badge-red', cancelado:'badge-red' }[estado] ?? 'badge-gray')
const tramite = t => t.servicioId === 2 ? 'DNI Primera emisión' : t.servicioId === 3 ? 'DNI Duplicado' : 'DNI Renovación'
const wait = t => formatMinutes(Math.max(10, Math.round((Date.now() - new Date(t.horaIngreso)) / 60000) % 60))

const exportRows = computed(() => rows.value.map(t => ({
  fecha: new Date(t.horaIngreso).toLocaleDateString('es-PE'),
  entidad: 'RENIEC',
  sede: 'Miraflores',
  tramite: tramite(t),
  turno: t.codigo,
  espera: wait(t),
  estado: label(t.estado),
})))

function exportCsv() {
  downloadCsv('historial-flowqueue.csv', exportRows.value, [
    { label: 'Fecha', value: 'fecha' },
    { label: 'Entidad', value: 'entidad' },
    { label: 'Sede', value: 'sede' },
    { label: 'Trámite', value: 'tramite' },
    { label: 'Turno', value: 'turno' },
    { label: 'Espera', value: 'espera' },
    { label: 'Estado', value: 'estado' },
  ])
  feedback.value = 'CSV generado correctamente.'
}

function exportExcel() {
  downloadCsv('historial-flowqueue.xls', exportRows.value, [
    { label: 'Fecha', value: 'fecha' },
    { label: 'Entidad', value: 'entidad' },
    { label: 'Sede', value: 'sede' },
    { label: 'Trámite', value: 'tramite' },
    { label: 'Turno', value: 'turno' },
    { label: 'Espera', value: 'espera' },
    { label: 'Estado', value: 'estado' },
  ])
  feedback.value = 'Archivo Excel generado correctamente.'
}

function exportPdf() {
  downloadReport('historial-flowqueue.txt', 'Historial de trámites FlowQueue', [
    { title: 'Resumen', lines: [`Total: ${summary.value.total}`, `Completados: ${summary.value.completed}`, `Cancelados: ${summary.value.canceled}`] },
    { title: 'Turnos', lines: exportRows.value.map(r => `${r.fecha} | ${r.turno} | ${r.tramite} | ${r.estado} | ${r.espera}`) },
  ])
  feedback.value = 'Reporte descargado correctamente.'
}

function generateReport() { exportPdf() }

function openDetail(t) { selected.value = t }
function closeDetail() { selected.value = null }

async function reprogram(t) {
  reprogramming.value = t.id
  const nuevo = {
    codigo: `${t.codigo.split('-')[0]}-${String(queue.tickets.length + 1).padStart(3, '0')}`,
    ciudadanoNombre: t.ciudadanoNombre,
    ciudadanoDNI: t.ciudadanoDNI,
    servicioId: t.servicioId,
    mostradorId: null,
    sedeId: t.sedeId,
    estado: 'en_espera',
    horaIngreso: new Date().toISOString(),
    horaLlamado: null,
    horaFin: null,
  }
  const created = await http.post('/turnos', nuevo)
  localStorage.setItem('fq_active_ticket_id', created.id)
  await queue.loadCitizenTickets(auth.user?.dni ?? '76543210')
  reprogramming.value = null
  feedback.value = `Turno reprogramado como ${created.codigo}.`
}
</script>

<template>
  <AppLayout title="Historial de trámites" subtitle="Todos tus turnos anteriores en FlowQueue">
    <section class="filter-card card">
      <input v-model="search" placeholder="Buscar por entidad o trámite..." />
      <button class="chip" :class="{active:filter==='todos'}" @click="filter='todos'">Todos</button>
      <button class="chip" :class="{active:filter==='atendido'}" @click="filter='atendido'">Completados</button>
      <button class="chip" :class="{active:filter==='cancelado'}" @click="filter='cancelado'">Cancelados</button>
      <button class="chip" :class="{active:filter==='en_espera'}" @click="filter='en_espera'">En curso</button>
      <input class="month" value="Abril 2026" readonly />
    </section>

    <p v-if="feedback" class="feedback">{{ feedback }}</p>

    <section class="card table-card">
      <table class="data-table">
        <thead><tr><th>Fecha</th><th>Entidad</th><th>Sede</th><th>Trámite</th><th>Turno</th><th>T. espera</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr v-for="t in rows" :key="t.id">
            <td class="td-muted">{{ new Date(t.horaIngreso).toLocaleDateString('es-PE', { day:'2-digit', month:'short' }) }}</td>
            <td class="td-bold">RENIEC</td>
            <td class="td-muted">Miraflores</td>
            <td>{{ tramite(t) }}</td>
            <td class="td-code">{{ t.codigo }}</td>
            <td>{{ wait(t) }}</td>
            <td><span class="badge" :class="badge(t.estado)">{{ label(t.estado) }}</span></td>
            <td class="actions">
              <button @click="reprogram(t)" :disabled="reprogramming === t.id">{{ reprogramming === t.id ? 'Creando...' : 'Reprogramar' }}</button>
              <button @click="openDetail(t)">Detalle</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="export-card card">
      <div>
        <h3>Exportar historial</h3>
        <p>Descarga tus trámites en PDF, Excel o CSV.</p>
      </div>
      <div class="export-actions">
        <button @click="exportPdf">PDF</button>
        <button @click="exportExcel">Excel</button>
        <button @click="exportCsv">CSV</button>
        <button class="primary" @click="generateReport">Generar reporte</button>
      </div>
      <div class="summary"><strong>{{ summary.total }}</strong><span>Total</span></div>
      <div class="summary"><strong>{{ summary.completed }}</strong><span>Completados</span></div>
      <div class="summary"><strong>{{ summary.canceled }}</strong><span>Cancelados</span></div>
    </section>

    <div v-if="selected" class="modal-backdrop" @click.self="closeDetail">
      <section class="modal card">
        <h3>Detalle del turno {{ selected.codigo }}</h3>
        <p><strong>Ciudadano:</strong> {{ selected.ciudadanoNombre }}</p>
        <p><strong>DNI:</strong> {{ selected.ciudadanoDNI }}</p>
        <p><strong>Trámite:</strong> {{ tramite(selected) }}</p>
        <p><strong>Estado:</strong> {{ label(selected.estado) }}</p>
        <p><strong>Ingreso:</strong> {{ new Date(selected.horaIngreso).toLocaleString('es-PE') }}</p>
        <button class="primary close" @click="closeDetail">Cerrar</button>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.filter-card { display:grid; grid-template-columns: 1fr repeat(4,120px) 140px; gap:.6rem; padding:1rem; margin-bottom:1rem; }
.filter-card input { border:1.5px solid var(--border); border-radius:8px; padding:.55rem .8rem; font-size:.8rem; outline:none; }
.chip { border:none; border-radius:999px; background:#eef2f7; color:var(--text-muted); font-size:.74rem; font-weight:800; cursor:pointer; }
.chip.active { background:#1d6fe9; color:#fff; }
.feedback{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;border-radius:8px;padding:.65rem .85rem;margin-bottom:1rem;font-size:.82rem;font-weight:800}
.table-card { overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:.82rem; }
.data-table thead tr { background:#0b2238; }
.data-table th { color:#d8e2ef; text-align:left; padding:.65rem .9rem; font-size:.68rem; text-transform:uppercase; letter-spacing:.05em; }
.data-table td { padding:.72rem .9rem; border-bottom:1px solid var(--border); }
.data-table tbody tr:nth-child(even) td { background:#f3f6fb; }
.td-code { color:#1d6fe9; font-weight:800; }.td-bold{font-weight:800}.td-muted{color:var(--text-muted)}
.actions { display:flex; gap:.4rem; }.actions button,.export-actions button { border:none; background:#eef2f7; color:#475569; border-radius:7px; padding:.35rem .7rem; font-size:.72rem; font-weight:800; cursor:pointer; }
.actions button:disabled{opacity:.6;cursor:wait}.actions button:first-child { color:#1d6fe9; }
.export-card { margin-top:1rem; padding:1rem; display:grid; grid-template-columns: 1.1fr 1.2fr repeat(3,110px); gap:1rem; align-items:center; }
.export-card h3{font-size:.9rem}.export-card p{font-size:.75rem;color:var(--text-muted);margin-top:.2rem}.export-actions{display:flex;gap:.5rem;flex-wrap:wrap}.export-actions .primary,.primary{background:#1d6fe9!important;color:#fff!important;min-width:120px}.summary{background:#f1f5f9;border:1px solid var(--border);border-radius:8px;padding:.8rem;text-align:center}.summary strong{display:block;font-size:1.3rem;color:#1d6fe9}.summary span{font-size:.7rem;color:var(--text-muted)}
.modal-backdrop{position:fixed;inset:0;background:rgba(2,6,23,.55);display:grid;place-items:center;z-index:200}.modal{width:min(460px,92vw);padding:1.3rem}.modal h3{margin-bottom:1rem}.modal p{font-size:.88rem;margin:.55rem 0}.close{border:none;border-radius:8px;padding:.55rem 1rem;margin-top:1rem;cursor:pointer;font-weight:800}
@media(max-width:1100px){ .filter-card,.export-card { grid-template-columns:1fr; } .chip{padding:.55rem} }
</style>
