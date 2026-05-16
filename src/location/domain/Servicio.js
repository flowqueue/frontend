export class Servicio {
  constructor(data = {}) {
    this.id = data.id
    this.sedeId = data.sedeId
    this.nombre = data.nombre ?? ''
    this.duracionPromedio = data.duracionPromedio ?? 0
    this.prefijo = data.prefijo ?? 'T'
  }

  get estimatedDurationLabel() {
    return `${this.duracionPromedio} min`
  }
}
