import { http } from '@/shared/services/http.js'

function sameId(a, b) {
  return String(a) === String(b)
}

export async function getMostrador(mostradorId) {
  const [mostradores, servicios, sedes] = await Promise.all([
    http.get('/mostradores'),
    http.get('/servicios'),
    http.get('/sedes'),
  ])

  const mostrador = mostradores.find(m => sameId(m.id, mostradorId))
  if (!mostrador) throw new Error('No se encontró la ventanilla del operador')

  const servicio = servicios.find(s => sameId(s.id, mostrador.servicioId))
  const sede = sedes.find(s => sameId(s.id, mostrador.sedeId))

  return {
    ...mostrador,
    servicioNombre: servicio?.nombre ?? 'Servicio no definido',
    sedeNombre: sede?.nombre ?? 'Sede no definida',
  }
}
