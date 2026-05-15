import { http } from '@/shared/services/http.js'
import { Turno } from '@/queue/domain/models/Turno.js'
import { TicketAssembler } from '@/queue/infrastructure/ticket.assembler.js'

export async function getQueue(sedeId, servicioId = null) {
    const serviceFilter = servicioId ? `&servicioId=${servicioId}` : ''
    const data = await http.get(`/turnos?sedeId=${sedeId}${serviceFilter}&estado=en_espera`)
    return TicketAssembler.toEntities(data).sort((a, b) => new Date(a.horaIngreso) - new Date(b.horaIngreso))
}

export async function getCurrentTicket(mostradorId) {
    const data = await http.get(`/turnos?mostradorId=${mostradorId}&estado=en_atencion`)
    return data.length ? new Turno(data[0]) : null
}

export async function getTicketById(id) {
    const data = await http.get(`/turnos/${id}`)
    return new Turno(data)
}

export async function getTicketByCode(code) {
    const data = await http.get(`/turnos?codigo=${encodeURIComponent(code)}`)
    return data.length ? new Turno(data[0]) : null
}

export async function getTicketsByCitizen(dni) {
    const data = await http.get(`/turnos?ciudadanoDNI=${encodeURIComponent(dni)}`)
    return TicketAssembler.toEntities(data).sort((a, b) => new Date(b.horaIngreso) - new Date(a.horaIngreso))
}

export async function getTodayTickets(sedeId) {
    const data = await http.get(`/turnos?sedeId=${sedeId}`)
    return TicketAssembler.toEntities(data).sort((a, b) => new Date(b.horaIngreso) - new Date(a.horaIngreso))
}

export async function updateTurnoEstado(id, estado, extra = {}) {
    return new Turno(await http.patch(`/turnos/${id}`, { estado, ...extra }))
}

export async function createTurno(payload) {
    return new Turno(await http.post('/turnos', payload))
}

export async function getAllTickets() {
    const data = await http.get('/turnos')
    return TicketAssembler.toEntities(data)
}
