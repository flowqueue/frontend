import { http } from '@/shared/services/http.js'

export async function getMetricasHorarias(sedeId, fecha) {
  const data = await http.get(`/metricas_horarias?sedeId=${sedeId}`)
  const exactDate = data.filter(m => String(m.fecha) === String(fecha))

  // Si el db.json tiene datos de ejemplo con otra fecha, igual los usamos
  // para que el dashboard no quede vacío durante la demo.
  return exactDate.length ? exactDate : data
}

export async function getMostradores(sedeId) {
  const [mostradores, servicios] = await Promise.all([
    http.get(`/mostradores?sedeId=${sedeId}`),
    http.get('/servicios'),
  ])

  return mostradores.map(m => {
    const servicio = servicios.find(s => String(s.id) === String(m.servicioId))
    return {
      ...m,
      servicioNombre: servicio?.nombre ?? 'N/A',
      operadorNombre: m.operadorNombre ?? 'Sin operador',
    }
  })
}
