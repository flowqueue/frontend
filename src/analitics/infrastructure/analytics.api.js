import { http } from '@/shared/services/http.js'

function sameId(a, b) {
  return String(a) === String(b)
}

export async function getMetricasHorarias(sedeId, fecha) {
  const data = await http.get('/metricas_horarias')
  const bySede = data.filter(m => sameId(m.sedeId, sedeId))
  const exactDate = bySede.filter(m => String(m.fecha) === String(fecha))

  // Si el db.json tiene datos de ejemplo con otra fecha, igual los usamos
  // para que el dashboard no quede vacío durante la demo.
  return exactDate.length ? exactDate : bySede
}

export async function getResumen(sedeId = null, servicioId = null) {
  const params = new URLSearchParams()
  if (sedeId) params.set('sedeId', sedeId)
  if (servicioId) params.set('servicioId', servicioId)
  const query = params.toString()
  return http.get(`/analytics/summary${query ? `?${query}` : ''}`)
}

export async function getMostradores(sedeId) {
  const [allMostradores, servicios] = await Promise.all([
    http.get('/mostradores'),
    http.get('/services'),
  ])

  return allMostradores
    .filter(m => sameId(m.sedeId, sedeId))
    .map(m => {
      const servicio = servicios.find(s => sameId(s.id, m.servicioId))
      return {
        ...m,
        servicioNombre: servicio?.nombre ?? 'N/A',
        operadorNombre: m.operadorNombre ?? 'Sin operador',
      }
    })
}
