import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getQueue,
  getTodayTickets,
  getCurrentTicket,
  updateTurnoEstado,
  createTurno,
  getTicketById,
  getTicketsByCitizen,
} from '@/queue/infrastructure/queue.api.js'

export const useQueueStore = defineStore('queue', () => {
  const queue = ref([])
  const tickets = ref([])
  const currentTicket = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const waitingCount = computed(() => queue.value.length)
  const attendedCount = computed(() => tickets.value.filter(t => t.estado === 'atendido').length)
  const absentCount = computed(() => tickets.value.filter(t => t.estado === 'ausente').length)

  async function loadQueue(sedeId, servicioId = null) {
    loading.value = true
    error.value = null
    try {
      queue.value = await getQueue(sedeId, servicioId)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function loadTodayTickets(sedeId) {
    loading.value = true
    error.value = null
    try {
      tickets.value = await getTodayTickets(sedeId)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function loadCitizenTickets(dni, citizenName = null) {
    loading.value = true
    error.value = null
    try {
      tickets.value = await getTicketsByCitizen(dni, citizenName)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function loadCurrentTicket(mostradorId) {
    currentTicket.value = await getCurrentTicket(mostradorId)
  }

  async function loadTicketById(id) {
    currentTicket.value = await getTicketById(id)
    return currentTicket.value
  }

  async function createTicket(payload) {
    const created = await createTurno(payload)
    currentTicket.value = created
    tickets.value = [created, ...tickets.value]
    return created
  }

  async function updateTicketStatus(id, estado, extra = {}) {
    const updated = await updateTurnoEstado(id, estado, extra)
    tickets.value = tickets.value.map(t => String(t.id) === String(id) ? updated : t)
    queue.value = queue.value.filter(t => String(t.id) !== String(id))
    if (currentTicket.value && String(currentTicket.value.id) === String(id)) currentTicket.value = updated
    return updated
  }

  return {
    queue, tickets, currentTicket, loading, error,
    waitingCount, attendedCount, absentCount,
    loadQueue, loadTodayTickets, loadCitizenTickets, loadCurrentTicket, loadTicketById,
    createTicket, updateTicketStatus,
  }
})
