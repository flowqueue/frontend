const API_ORIGIN = 'https://flowqueue.local'

const endpointAliases = {
  'branch-office': 'branch-offices',
  instituciones: 'institutions',
  sedes: 'branch-offices',
  servicios: 'services',
  turnos: 'turns',
  usuarios: 'users',
}

const queryAliases = {
  branch_office_id: 'branchOfficeId',
  service_id: 'serviceId',
  sedeId: 'branchOfficeId',
  servicioId: 'serviceId',
  estado: 'status',
  user_id: 'userId',
}

const frontendStatusByBackend = {
  waiting: 'en_espera',
  called: 'en_atencion',
  completed: 'atendido',
  cancelled: 'cancelado',
  absent: 'ausente',
}

const backendStatusByFrontend = {
  en_espera: 'waiting',
  en_atencion: 'called',
  atendido: 'completed',
  cancelado: 'cancelled',
  ausente: 'absent',
}

const turnActionByFrontendStatus = {
  en_atencion: 'call',
  atendido: 'complete',
  cancelado: 'cancel',
  ausente: 'mark-as-absent',
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
}

function normalizePathSyntax(path) {
  return path
    .replace('/services?/', '/services?')
    .replace('/branch-office/', '/branch-offices/')
}

function normalizePathSegments(pathname) {
  const segments = pathname.split('/').filter(Boolean)
  if (!segments.length) return pathname

  const firstSegment = segments[0]
  segments[0] = endpointAliases[firstSegment] ?? firstSegment

  return `/${segments.join('/')}`
}

function normalizeSearchParams(searchParams, filters) {
  const normalizedParams = new URLSearchParams()

  searchParams.forEach((value, key) => {
    const normalizedKey = queryAliases[key] ?? key

    if (normalizedKey === 'status') {
      normalizedParams.set(normalizedKey, backendStatusByFrontend[value] ?? value)
      return
    }

    if (['codigo', 'email'].includes(normalizedKey)) {
      filters[normalizedKey] = value
      return
    }

    normalizedParams.set(normalizedKey, value)
  })

  return normalizedParams
}

function mapTurnPatch(pathname, method, body) {
  if (method !== 'PATCH') return null

  const match = pathname.match(/^\/turns\/([^/]+)$/)
  const action = turnActionByFrontendStatus[body?.estado]
  if (!match || !action) return null

  return `/turns/${match[1]}/${action}`
}

function normalizeRequestBody(pathname, method, body) {
  if (!body || method === 'GET') return body

  if (pathname === '/turns' && method === 'POST') {
    return compactObject({
      branchOfficeId: body.branchOfficeId ?? body.sedeId,
      serviceId: body.serviceId ?? body.servicioId,
      citizenName: body.citizenName ?? body.ciudadanoNombre,
      citizenDocumentNumber: body.citizenDocumentNumber ?? body.ciudadanoDNI,
    })
  }

  if ((pathname === '/users' || pathname === '/auth/sign-up') && method === 'POST') {
    return compactObject({
      fullName: body.fullName ?? body.nombre,
      email: body.email,
      password: body.password,
      role: body.role ?? body.rol,
      documentNumber: body.documentNumber ?? body.dni,
    })
  }

  if (pathname.includes('/password') && method === 'PATCH') {
    return compactObject({
      currentPassword: body.currentPassword,
      newPassword: body.newPassword ?? body.password,
    })
  }

  return body
}

export function normalizeRequest(path, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase()
  const rawPath = normalizePathSyntax(path)
  const url = new URL(rawPath, API_ORIGIN)
  const filters = {}

  let pathname = normalizePathSegments(url.pathname)

  if (pathname === '/metricas_horarias') pathname = '/analytics/hourly'
  if (pathname === '/notificaciones') pathname = '/notifications'

  const body = options.body ? JSON.parse(options.body) : undefined
  const turnActionPath = mapTurnPatch(pathname, method, body)
  if (turnActionPath) pathname = turnActionPath

  if (method === 'PATCH' && pathname.match(/^\/notifications\/[^/]+$/) && body?.read) {
    pathname = `${pathname}/mark-as-read`
  }

  const searchParams = normalizeSearchParams(url.searchParams, filters)
  const search = searchParams.toString()
  const normalizedPath = `${pathname}${search ? `?${search}` : ''}`

  return {
    path: normalizedPath,
    body: normalizeRequestBody(pathname, method, body),
    filters,
    syntheticResource: pathname === '/mostradores' ? 'counters' : null,
  }
}

function mapStatusToFrontend(status) {
  return frontendStatusByBackend[status] ?? status
}

export function mapStatusToBackend(status) {
  return backendStatusByFrontend[status] ?? status
}

function mapTurnResource(data) {
  const status = mapStatusToFrontend(data.status ?? data.estado)

  return {
    ...data,
    id: data.id,
    codigo: data.codigo ?? data.ticketCode,
    ciudadanoNombre: data.ciudadanoNombre ?? data.citizenName,
    ciudadanoDNI: data.ciudadanoDNI ?? data.citizenDocumentNumber,
    servicioId: data.servicioId ?? data.serviceId,
    sedeId: data.sedeId ?? data.branchOfficeId,
    mostradorId: data.mostradorId ?? data.serviceId ?? null,
    estado: status,
    horaIngreso: data.horaIngreso ?? data.registeredAt,
    horaLlamado: data.horaLlamado ?? data.calledAt,
    horaFin: data.horaFin ?? data.completedAt ?? data.cancelledAt ?? data.markedAbsentAt,
  }
}

function mapBranchOfficeResource(data) {
  return {
    ...data,
    institucionId: data.institucionId ?? data.institutionId,
    nombre: data.nombre ?? data.name,
    direccion: data.direccion ?? data.address,
    distrito: data.distrito ?? data.district,
    horario: data.horario ?? data.schedule,
  }
}

function mapServiceResource(data) {
  return {
    ...data,
    sedeId: data.sedeId ?? data.branchOfficeId,
    nombre: data.nombre ?? data.name,
    duracionPromedio: data.duracionPromedio ?? data.averageDurationMinutes,
    prefijo: data.prefijo ?? data.prefix,
  }
}

function mapInstitutionResource(data) {
  return {
    ...data,
    nombre: data.nombre ?? data.name,
    descripcion: data.descripcion ?? data.description,
    tipo: data.tipo ?? data.type,
  }
}

function mapUserResource(data) {
  const role = data.rol ?? data.role
  const documentNumber = data.dni ?? data.documentNumber

  return {
    ...data,
    nombre: data.nombre ?? data.fullName,
    fullName: data.fullName ?? data.nombre,
    rol: role,
    role,
    dni: documentNumber,
    documentNumber,
    sedeId: data.sedeId ?? 1,
    mostradorId: data.mostradorId ?? (role === 'operator' ? 1 : null),
  }
}

function mapNotificationResource(data) {
  const read = data.read ?? (data.status === 'read' || Boolean(data.readAt))

  return {
    ...data,
    createdAt: data.createdAt ?? data.sentAt,
    read,
  }
}

function mapMetricResource(data) {
  const period = data.periodStart ? new Date(data.periodStart) : null

  return {
    ...data,
    sedeId: data.sedeId ?? data.branchOfficeId,
    servicioId: data.servicioId ?? data.serviceId,
    fecha: data.fecha ?? period?.toISOString().slice(0, 10),
    hora: data.hora ?? period?.getHours() ?? 0,
    atendidos: data.atendidos ?? data.completedTurns ?? 0,
    ausentes: data.ausentes ?? data.absentTurns ?? 0,
    tiempoPromedioMin: data.tiempoPromedioMin ?? data.averageWaitingMinutes ?? 0,
  }
}

export function transformResponse(data, path) {
  if (data == null) return data

  const transformItem = (item) => {
    if (path.startsWith('/turns')) return mapTurnResource(item)
    if (path.startsWith('/branch-offices')) return mapBranchOfficeResource(item)
    if (path.startsWith('/services')) return mapServiceResource(item)
    if (path.startsWith('/institutions')) return mapInstitutionResource(item)
    if (path.startsWith('/users')) return mapUserResource(item)
    if (path.startsWith('/notifications')) return mapNotificationResource(item)
    if (path.startsWith('/analytics/hourly')) return mapMetricResource(item)
    return item
  }

  return Array.isArray(data) ? data.map(transformItem) : transformItem(data)
}

export function applyClientFilters(data, filters) {
  if (!Array.isArray(data)) return data

  return data.filter((item) => {
    if (filters.codigo && String(item.codigo).toLowerCase() !== String(filters.codigo).toLowerCase()) return false
    if (filters.email && String(item.email).toLowerCase() !== String(filters.email).toLowerCase()) return false
    return true
  })
}

export async function buildSyntheticResource(resource, request) {
  if (resource !== 'counters') return null

  const services = await request('/services')
  const counters = services.map((service, index) => ({
    id: index + 1,
    sedeId: service.sedeId,
    numero: index + 1,
    servicioId: service.id,
    estado: 'activo',
    operadorId: index === 0 ? 1 : null,
    operadorNombre: index === 0 ? 'Operador asignado' : null,
  }))

  return counters.length ? counters : [{ id: 1, sedeId: 1, numero: 1, servicioId: 1, estado: 'activo' }]
}
