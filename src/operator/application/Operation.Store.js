import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMostrador } from '@/operator/infrastructure/operator.api.js'
import { getQueue, getCurrentTicket, updateTurnoEstado } from '@/queue/infrastructure/queue.api.js'

export const useOperatorStore = defineStore('operator', () => {
  const mostrador     = ref(null)
  const currentTicket = ref(null)
  const queue         = ref([])
  const loading       = ref(false)
  const error         = ref(null)

  const queueCount = computed(() => queue.value.length)
  const waitingCount = computed(() => queue.value.length)

  async function refreshQueue() {
    if (!mostrador.value) return
    queue.value = await getQueue(mostrador.value.sedeId, mostrador.value.servicioId)
  }

  async function refreshCurrent() {
    if (!mostrador.value) return
    currentTicket.value = await getCurrentTicket(mostrador.value.id)
  }

  async function loadDashboard(mostradorId) {
    loading.value = true
    error.value = null
    try {
      mostrador.value = await getMostrador(mostradorId)
      await Promise.all([refreshCurrent(), refreshQueue()])
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function callNext(ticketId = null) {
    if (!mostrador.value) return null

    // Si ya hay un turno en atención, lo mantenemos hasta que el operador lo complete o marque ausente.
    if (currentTicket.value) return currentTicket.value

    if (!queue.value.length) await refreshQueue()
    if (!queue.value.length) return null

    const index = ticketId ? queue.value.findIndex(t => String(t.id) === String(ticketId)) : 0
    if (index < 0) return null

    const next = queue.value[index]
    const now = new Date().toISOString()
    const updated = await updateTurnoEstado(next.id, 'en_atencion', {
      mostradorId: mostrador.value.id,
      horaLlamado: now,
    })

    currentTicket.value = updated
    queue.value = queue.value.filter(t => String(t.id) !== String(next.id))
    return updated
  }

  async function markComplete() {
    if (!currentTicket.value || !mostrador.value) return
    await updateTurnoEstado(currentTicket.value.id, 'atendido', {
      horaFin: new Date().toISOString(),
    })
    currentTicket.value = null
    await refreshQueue()
  }

  async function markAbsent(ticketId = null) {
    if (!mostrador.value) return

    if (ticketId) {
      await updateTurnoEstado(ticketId, 'ausente', {
        mostradorId: mostrador.value.id,
        horaLlamado: new Date().toISOString(),
        horaFin: new Date().toISOString(),
      })
      queue.value = queue.value.filter(t => String(t.id) !== String(ticketId))
      return
    }

    if (!currentTicket.value) return
    await updateTurnoEstado(currentTicket.value.id, 'ausente', {
      horaFin: new Date().toISOString(),
    })
    currentTicket.value = null
    await refreshQueue()
  }

  function skipTicket(ticketId) {
    const index = queue.value.findIndex(t => String(t.id) === String(ticketId))
    if (index < 0) return
    const [item] = queue.value.splice(index, 1)
    queue.value.push(item)
  }

  return {
    mostrador,
    currentTicket,
    queue,
    queueCount,
    waitingCount,
    loading,
    error,
    loadDashboard,
    refreshQueue,
    refreshCurrent,
    callNext,
    markComplete,
    markAbsent,
    skipTicket,
  }
})
