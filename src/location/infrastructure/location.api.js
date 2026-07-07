import { http } from '@/shared/services/http.js'
import { Sede } from '@/location/domain/Sede.js'
import { Servicio } from '@/location/domain/Servicio.js'

export async function getInstituciones() {
  return http.get('/institutions')
}

export async function getSedes() {
  const data = await http.get('/branch-offices')
  return data.map(s => new Sede(s))

}

export async function getSedeById(id) {
  const data = await http.get(`/branch-offices/${id}`)
  return new Sede(data)
}

export async function getServiciosBySede(sedeId) {
  const data = await http.get(`/services?branchOfficeId=${sedeId}`)
  return data.map(s => new Servicio(s))
}

export async function getServicios() {
  const data = await http.get('/services')
  return data.map(s => new Servicio(s))
}
