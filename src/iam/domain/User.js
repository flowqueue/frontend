export class User {
    constructor({ id, nombre, email, rol, mostradorId, sedeId, dni }) {
        this.id = id
        this.nombre = nombre
        this.email = email
        this.rol = rol
        this.mostradorId = mostradorId ?? null
        this.sedeId = sedeId ?? null
        this.dni = dni ?? null
    }

    get isCitizen()    { return this.rol === 'citizen' }
    get isOperator()   { return this.rol === 'operator' }
    get isSupervisor() { return this.rol === 'supervisor' }
}
