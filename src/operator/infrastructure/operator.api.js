import { http } from '@/shared/services/http.js'

export async function getMostrador(mostradorId) {
    const mostrador = await http.get(`/mostradores/${mostradorId}`)
    const servicio  = await http.get(`/servicios/${mostrador.servicioId}`)
    const sede      = await http.get(`/sedes/${mostrador.sedeId}`)
    return { ...mostrador, servicioNombre: servicio.nombre, sedeNombre: sede.nombre }
}
