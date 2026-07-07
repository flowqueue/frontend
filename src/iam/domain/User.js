export class User {
  constructor({ id, nombre, fullName, email, rol, role, mostradorId, sedeId, dni, documentNumber, token }) {
    const normalizedRole = rol ?? role
    const normalizedName = nombre ?? fullName
    const normalizedDocument = dni ?? documentNumber

    this.id = id
    this.nombre = normalizedName
    this.fullName = normalizedName
    this.email = email
    this.rol = normalizedRole
    this.role = normalizedRole
    this.mostradorId = mostradorId ?? (normalizedRole === 'operator' ? 1 : null)
    this.sedeId = sedeId ?? 1
    this.dni = normalizedDocument ?? null
    this.documentNumber = normalizedDocument ?? null
    this.token = token ?? null
  }

  get isCitizen()    { return this.role === 'citizen' }
  get isOperator()   { return this.role === 'operator' }
  get isSupervisor() { return this.role === 'supervisor' }
}
