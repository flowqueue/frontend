import { http } from '@/shared/services/http.js'
import { Turno } from '@/queue/domain/models/Turno.js'
import { TicketAssembler } from '@/queue/infrastructure/ticket.assembler.js'

function sameId(a, b) {
  return String(a) === String(b)
}

function sortAscByIngreso(a, b) {
  return new Date(a.horaIngreso) - new Date(b.horaIngreso)
}

function sortDescByIngreso(a, b) {
  return new Date(b.horaIngreso) - new Date(a.horaIngreso)
}

async function getRawTickets() {
  return await http.get('/turns')
}

export async function getQueue(sedeId, servicioId = null) {
  const data = await getRawTickets()
  const filtered = data.filter(turno => {
    const matchSede = sameId(turno.sedeId, sedeId)
    const matchService = servicioId ? sameId(turno.servicioId, servicioId) : true
    return matchSede && matchService && turno.estado === 'en_espera'
  })

  return TicketAssembler.toEntities(filtered).sort(sortAscByIngreso)
}

export async function getCurrentTicket(mostradorId) {
  const data = await getRawTickets()
  const current = data
    .filter(turno => sameId(turno.mostradorId, mostradorId) && turno.estado === 'en_atencion')
    .sort((a, b) => new Date(a.horaLlamado || a.horaIngreso) - new Date(b.horaLlamado || b.horaIngreso))[0]

  return current ? new Turno(current) : null
}

export async function getTicketById(id) {
  const data = await http.get(`/turns/${id}`)
  return new Turno(data)
}

export async function getTicketByCode(code) {
  const data = await getRawTickets()
  const found = data.find(turno => String(turno.codigo).toLowerCase() === String(code).toLowerCase())
  return found ? new Turno(found) : null
}

export async function getTicketsByCitizen(dni, citizenName = null) {
  const data = await getRawTickets()
  let filtered = []

  if (dni) {
    filtered = data.filter(turno => String(turno.ciudadanoDNI) === String(dni))
  }

  if (!filtered.length && citizenName) {
    filtered = data.filter(turno => String(turno.ciudadanoNombre).toLowerCase() === String(citizenName).toLowerCase())
  }

  return TicketAssembler.toEntities(filtered).sort(sortDescByIngreso)
}

export async function getTodayTickets(sedeId) {
  const data = await getRawTickets()
  const bySede = data.filter(turno => sameId(turno.sedeId, sedeId))
  const today = new Date().toISOString().slice(0, 10)
  const todayTickets = bySede.filter(turno => String(turno.horaIngreso || '').startsWith(today))

  // Si el db.json tiene datos de otra fecha, usamos los de la sede para que el dashboard no quede vacío.
  const result = todayTickets.length ? todayTickets : bySede
  return TicketAssembler.toEntities(result).sort(sortDescByIngreso)
}

export async function updateTurnoEstado(id, estado, extra = {}) {
  return new Turno(await http.patch(`/turnos/${id}`, { estado, ...extra }))
}

export async function createTurno(payload) {
  return new Turno(await http.post('/turnos', payload))
}

export async function getAllTickets() {
  const data = await getRawTickets()
  return TicketAssembler.toEntities(data)
}
