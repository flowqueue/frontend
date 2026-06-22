export class User {
  constructor({ id, nombre, email, rol, mostradorId, sedeId, dni }) {
    this.id = id
    this.fullName = nombre
    this.email = email
    this.role = rol
    this.mostradorId = mostradorId ?? null
    this.sedeId = sedeId ?? null
    this.dni = dni ?? null
  }

  get isCitizen()    { return this.rol === 'citizen' }
  get isOperator()   { return this.rol === 'operator' }
  get isSupervisor() { return this.rol === 'supervisor' }
}
