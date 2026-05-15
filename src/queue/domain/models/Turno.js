export class Turno {
    constructor(data) {
        this.id = data.id
        this.codigo = data.codigo
        this.ciudadanoNombre = data.ciudadanoNombre
        this.ciudadanoDNI = data.ciudadanoDNI
        this.servicioId = data.servicioId
        this.mostradorId = data.mostradorId
        this.sedeId = data.sedeId
        this.estado = data.estado
        this.horaIngreso = data.horaIngreso
        this.horaLlamado = data.horaLlamado
        this.horaFin = data.horaFin
    }

    get isWaiting()   { return this.estado === 'en_espera' }
    get isServing()   { return this.estado === 'en_atencion' }
    get isDone()      { return this.estado === 'atendido' }
    get isAbsent()    { return this.estado === 'ausente' }
}
