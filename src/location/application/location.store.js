import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getInstituciones, getSedes, getServicios, getServiciosBySede } from '@/location/infrastructure/location.api.js'

export const useLocationStore = defineStore('location', () => {
  const instituciones = ref([])
  const sedes = ref([])
  const servicios = ref([])
  const selectedSedeId = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const selectedSede = computed(() => sedes.value.find(s => String(s.id) === String(selectedSedeId.value)) ?? null)
  const servicesForSelectedSede = computed(() => servicios.value.filter(s => String(s.sedeId) === String(selectedSedeId.value)))

  async function loadCatalog() {
    loading.value = true
    error.value = null
    try {
      const [i, s, sv] = await Promise.all([getInstituciones(), getSedes(), getServicios()])
      instituciones.value = i
      sedes.value = s
      servicios.value = sv
      if (!selectedSedeId.value && s.length) selectedSedeId.value = s[0].id
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function selectSede(sedeId) {
    selectedSedeId.value = sedeId
    servicios.value = await getServiciosBySede(sedeId)
  }

  return { instituciones, sedes, servicios, selectedSedeId, selectedSede, servicesForSelectedSede, loading, error, loadCatalog, selectSede }
})
