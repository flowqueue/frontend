<script setup>
import { computed, ref } from 'vue'
import AppLayout from '@/shared/components/AppLayout.vue'
import { http } from '@/shared/services/http.js'
import { formatTime, minutesSince, formatMinutes } from '@/shared/utils/format.js'

const code = ref('')
const ticket = ref(null)
const queue = ref([])
const loading = ref(false)
const error = ref('')

const position = computed(() => {
  if (!ticket.value || ticket.value.estado !== 'en_espera') return null
  const index = queue.value.findIndex(t => String(t.id) === String(ticket.value.id))
  return index >= 0 ? index + 1 : null
})

async function searchTicket() {
  error.value = ''
  ticket.value = null
  if (!code.value.trim()) return
  loading.value = true
  try {
    const result = await http.get(`/turnos?codigo=${encodeURIComponent(code.value.trim().toUpperCase())}`)
    if (!result.length) {
      error.value = 'No se encontró un ticket con ese código.'
      return
    }
    ticket.value = result[0]
    queue.value = await http.get(`/turnos?sedeId=${ticket.value.sedeId}&servicioId=${ticket.value.servicioId}&estado=en_espera`)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout title="Estado del turno" subtitle="Consulta la posición actual de un ticket">
    <section class="card status-card">
      <p class="eyebrow">Seguimiento ciudadano</p>
      <h2>Consulta tu turno</h2>
      <div class="search-row">
        <input v-model="code" placeholder="Ejemplo: A-042" @keyup.enter="searchTicket" />
        <button class="btn btn-primary" :disabled="loading" @click="searchTicket">{{ loading ? 'Buscando...' : 'Buscar' }}</button>
      </div>
      <p v-if="error" class="error-msg">{{ error }}</p>
    </section>

    <section v-if="ticket" class="card result-card">
      <span class="badge" :class="ticket.estado === 'en_espera' ? 'badge-blue' : ticket.estado === 'en_atencion' ? 'badge-orange' : 'badge-green'">
        {{ ticket.estado.replace('_', ' ') }}
      </span>
      <div class="ticket-code">{{ ticket.codigo }}</div>
      <p class="citizen-name">{{ ticket.ciudadanoNombre }}</p>
      <div class="status-grid">
        <div><span>Ingreso</span><strong>{{ formatTime(ticket.horaIngreso) }}</strong></div>
        <div><span>Espera actual</span><strong>{{ formatMinutes(minutesSince(ticket.horaIngreso)) }}</strong></div>
        <div><span>Posición</span><strong>{{ position ?? '—' }}</strong></div>
      </div>
    </section>
  </AppLayout>
</template>

<style scoped>
.status-card, .result-card { max-width: 720px; margin: 0 auto 1rem; padding: 1.5rem; }
.eyebrow { font-size: .7rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: .08em; }
h2 { font-size: 1.25rem; margin: .25rem 0 1rem; }
.search-row { display: flex; gap: .75rem; }
input { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: .7rem .85rem; outline: none; text-transform: uppercase; }
input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(12,68,124,.1); }
.error-msg { margin-top: 1rem; background: #fee2e2; color: #b91c1c; padding: .65rem .8rem; border-radius: 8px; font-size: .82rem; }
.result-card { text-align: center; }
.ticket-code { font-size: 4rem; font-weight: 900; color: var(--primary); margin: 1rem 0 .4rem; line-height: 1; }
.citizen-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 1.4rem; }
.status-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: .75rem; }
.status-grid div { background: var(--bg); border-radius: 14px; padding: 1rem; }
.status-grid span { display: block; color: var(--text-muted); font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; }
.status-grid strong { display: block; color: var(--text); font-size: 1.2rem; margin-top: .25rem; }
@media(max-width:640px){ .search-row, .status-grid { grid-template-columns: 1fr; display: grid; } }
</style>
