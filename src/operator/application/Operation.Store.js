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

    async function loadDashboard(mostradorId) {
        loading.value = true
        error.value = null
        try {
            mostrador.value     = await getMostrador(mostradorId)
            currentTicket.value = await getCurrentTicket(mostradorId)
            queue.value         = await getQueue(mostrador.value.sedeId, mostrador.value.servicioId)
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function callNext(ticketId = null) {
        if (!queue.value.length || currentTicket.value) return
        const index = ticketId ? queue.value.findIndex(t => String(t.id) === String(ticketId)) : 0
        if (index < 0) return
        const next = queue.value[index]
        const now = new Date().toISOString()
        await updateTurnoEstado(next.id, 'en_atencion', {
            mostradorId: mostrador.value.id,
            horaLlamado: now,
        })
        currentTicket.value = { ...next, estado: 'en_atencion', mostradorId: mostrador.value.id, horaLlamado: now }
        queue.value = queue.value.filter(t => String(t.id) !== String(next.id))
    }

    async function markComplete() {
        if (!currentTicket.value) return
        await updateTurnoEstado(currentTicket.value.id, 'atendido', { horaFin: new Date().toISOString() })
        currentTicket.value = null
    }

    async function markAbsent(ticketId = null) {
        if (ticketId) {
            await updateTurnoEstado(ticketId, 'ausente', { horaFin: new Date().toISOString() })
            queue.value = queue.value.filter(t => String(t.id) !== String(ticketId))
            return
        }
        if (!currentTicket.value) return
        await updateTurnoEstado(currentTicket.value.id, 'ausente', { horaFin: new Date().toISOString() })
        currentTicket.value = null
    }

    function skipTicket(ticketId) {
        const index = queue.value.findIndex(t => String(t.id) === String(ticketId))
        if (index < 0) return
        const [item] = queue.value.splice(index, 1)
        queue.value.push(item)
    }

    return { mostrador, currentTicket, queue, queueCount, loading, error, loadDashboard, callNext, markComplete, markAbsent, skipTicket }
})
