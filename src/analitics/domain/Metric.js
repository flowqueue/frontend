export class MetricaHoraria {
  constructor(data) {
    this.id = data.id
    this.sedeId = data.sedeId
    this.fecha = data.fecha
    this.hora = data.hora
    this.atendidos = data.atendidos
    this.ausentes = data.ausentes
    this.tiempoPromedioMin = data.tiempoPromedioMin
  }
}
