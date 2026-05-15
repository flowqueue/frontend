import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMetricasHorarias, getMostradores } from '@/analitics/infrastructure/analytics.api.js'
import {getSedes} from '@/location/infrastructure/location.api.js'
import { getTodayTickets } from '@/queue/infrastructure/queue.api.js'

export const useAnalyticsStore = defineStore('analytics', () => {
  const metricas   = ref([])
  const mostradores = ref([])
  const tickets    = ref([])
  const sedes      = ref([])
  const sedeId     = ref(null)
  const loading    = ref(false)
  const error      = ref(null)

  const today = new Date().toISOString().slice(0, 10)

  const totalAtendidos = computed(() => metricas.value.reduce((s, m) => s + m.atendidos, 0))
  const totalAusentes  = computed(() => metricas.value.reduce((s, m) => s + m.ausentes, 0))
  const totalPendientes = computed(() => tickets.value.filter(t => t.estado === 'en_espera').length)
  const totalEnAtencion = computed(() => tickets.value.filter(t => t.estado === 'en_atencion').length)
  const tiempoPromedio = computed(() => {
    const vals = metricas.value.filter(m => m.tiempoPromedioMin > 0)
    if (!vals.length) return 0
    return (vals.reduce((s, m) => s + m.tiempoPromedioMin, 0) / vals.length).toFixed(1)
  })

  async function loadDashboard(sid) {
    sedeId.value = sid
    loading.value = true
    error.value = null
    try {
      const [m, mo, t, s] = await Promise.all([
        getMetricasHorarias(sid, today),
        getMostradores(sid),
        getTodayTickets(sid),
        getSedes(),
      ])
      metricas.value    = m
      mostradores.value = mo
      tickets.value     = t
      sedes.value       = s
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function changeSede(sid) {
    await loadDashboard(sid)
  }

  return {
    metricas, mostradores, tickets, sedes, sedeId, loading, error,
    totalAtendidos, totalAusentes, totalPendientes, totalEnAtencion, tiempoPromedio,
    loadDashboard, changeSede,
  }
})
