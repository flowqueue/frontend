export class Sede {
  constructor(data = {}) {
    this.id = data.id
    this.institucionId = data.institucionId
    this.nombre = data.nombre ?? ''
    this.direccion = data.direccion ?? ''
    this.distrito = data.distrito ?? ''
    this.horario = data.horario ?? ''
  }

  get displayAddress() {
    return `${this.direccion}${this.distrito ? `, ${this.distrito}` : ''}`
  }
}
