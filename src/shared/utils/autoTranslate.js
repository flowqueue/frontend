const staticTranslations = {
  'Buscar institución (RENIEC, EsSalud, Banco de la Nación...)': 'Search institution (RENIEC, EsSalud, Banco de la Nación...)',
  'Buscar por entidad o trámite...': 'Search by entity or procedure...',
  'Buscar por turno, nombre o DNI...': 'Search by ticket, name or ID...',
  'Buscar por código, ciudadano o DNI...': 'Search by code, citizen or ID...',
  'Buscar por sede, distrito o institución...': 'Search by branch, district or institution...',
  'Correo electrónico': 'Email address',
  'Contraseña': 'Password',
  'Nombre completo': 'Full name',
  'Nombre': 'Name',
  'Rol': 'Role',
  'Acciones': 'Actions',
  'Estado': 'Status',
  'Turno': 'Ticket',
  'Código': 'Code',
  'Ciudadano': 'Citizen',
  'Servicio': 'Service',
  'Servicios': 'Services',
  'Sede': 'Branch',
  'Sedes': 'Branches',
  'Hora': 'Time',
  'Ingreso': 'Entry',
  'Ingresó': 'Entered',
  'Llamado': 'Called',
  'Espera': 'Waiting',
  'Trámite': 'Procedure',
  'Institución': 'Institution',
  'Dirección': 'Address',
  'Entidad': 'Entity',
  'Fecha': 'Date',
  'Operador': 'Operator',
  'Mostrador': 'Counter',
  'Ventanilla': 'Counter',
  'Atender': 'Serve',
  'Saltar': 'Skip',
  'Ausente': 'Absent',
  'Cancelar': 'Cancel',
  'Detalle': 'Details',
  'Reprogramar': 'Reschedule',
  'Guardar ticket': 'Save ticket',
  'Compartir': 'Share',
  'Cancelar mi turno': 'Cancel my ticket',
  'Generar turno': 'Generate ticket',
  'Generar reporte': 'Generate report',
  'Exportar CSV': 'Export CSV',
  'Exportar PDF': 'Export PDF',
  'Exportar Excel': 'Export Excel',
  'Descargar tus trámites en PDF, Excel o CSV.': 'Download your procedures in PDF, Excel or CSV.',
  'Todos': 'All',
  'Completados': 'Completed',
  'Cancelados': 'Cancelled',
  'En curso': 'In progress',
  'En espera': 'Waiting',
  'En atención': 'Serving',
  'Atendido': 'Served',
  'Atendidos': 'Served',
  'Cancelado': 'Cancelled',
  'Completado': 'Completed',
  'No hay turnos en espera': 'No waiting tickets',
  'Sin registros': 'No records',
  'Sin operadores': 'No operators',
  'Sin datos para el rango seleccionado': 'No data for the selected range',
  'No se encontraron turnos': 'No tickets found',
  'Sin resultados para los filtros aplicados': 'No results for the applied filters',
  'No tienes notificaciones recientes.': 'You have no recent notifications.',
  'No tienes un turno activo': 'You do not have an active ticket',
  'Aún no tienes un ticket activo': 'You do not have an active ticket yet',
  'Sin turno activo': 'No active ticket',
  'Sin turno en atención ahora mismo': 'No ticket currently being served',
  'Sin turno en atención': 'No ticket being served',
  'Cola vacía': 'Empty queue',
  'Cola de espera': 'Waiting queue',
  'Turnos en espera': 'Waiting tickets',
  'Cola en vivo': 'Live queue',
  'Panel Operador': 'Operator Panel',
  'Mi ventanilla': 'My counter',
  'Cola activa': 'Active queue',
  'Pausar': 'Pause',
  'Estadísticas': 'Statistics',
  'Notificaciones': 'Notifications',
  'Configuración': 'Settings',
  'Perfil de usuario': 'User profile',
  'Ventanilla asignada': 'Assigned counter',
  'Seguridad': 'Security',
  'Contraseña actual': 'Current password',
  'Nueva contraseña': 'New password',
  'Confirmar nueva contraseña': 'Confirm new password',
  'Actualizar contraseña': 'Update password',
  'Actualizando...': 'Updating...',
  'Panel ciudadano': 'Citizen panel',
  'Gestión de turnos del día': 'Daily ticket management',
  'Turnos registrados': 'Registered tickets',
  'Administración': 'Administration',
  'Dashboard': 'Dashboard',
  'Analítica': 'Analytics',
  'Reportes': 'Reports',
  'Usuarios': 'Users',
  'Operadores': 'Operators',
  'Ajustes': 'Settings',
  'Cerrar sesión': 'Log out',
  'Ver historial': 'View history',
  'Ver todo': 'View all',
  'Ver sedes': 'View branches',
  'Disponible': 'Available',
  'Filtrar por': 'Filter by',
  'Buscar': 'Search',
  'Hoy': 'Today',
  'nuevas': 'new',
  'Leída': 'Read',
  'Eliminar': 'Delete',
  'Marcar todas': 'Mark all',
  'Ver no leídas': 'View unread',
  'Ver todas': 'View all',
  'Detalle por hora': 'Hourly detail',
  'Total atendidos': 'Total served',
  'Tiempo prom. espera': 'Avg. waiting time',
  'En espera ahora': 'Waiting now',
  'Hora pico': 'Peak hour',
  'Mayor volumen de atención': 'Highest service volume',
  'Servicios con más demanda': 'Most demanded services',
  'Acciones sugeridas': 'Suggested actions',
  'Rendimiento de operadores': 'Operator performance',
  'Turnos atendidos por hora': 'Tickets served by hour',
  'Historial del día': 'Daily history'
}

const originalText = new WeakMap()
const originalAttr = new WeakMap()
let observer = null

function getLocaleValue(i18n) {
  return typeof i18n.global.locale === 'string' ? i18n.global.locale : i18n.global.locale.value
}

function translateValue(value, locale) {
  if (!value || locale === 'es') return value
  const trimmed = value.trim()
  const translated = staticTranslations[trimmed]
  if (!translated) return value
  return value.replace(trimmed, translated)
}

function walkTextNodes(root, callback) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
      const parent = node.parentElement
      if (!parent || ['SCRIPT', 'STYLE'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    }
  })
  let node
  const nodes = []
  while ((node = walker.nextNode())) nodes.push(node)
  nodes.forEach(callback)
}

function applyStaticTranslations(i18n) {
  const root = document.getElementById('app')
  if (!root) return
  const locale = getLocaleValue(i18n)

  walkTextNodes(root, node => {
    if (!originalText.has(node)) originalText.set(node, node.nodeValue)
    const original = originalText.get(node)
    node.nodeValue = translateValue(original, locale)
  })

  root.querySelectorAll('input[placeholder], textarea[placeholder], [title], [aria-label]').forEach(el => {
    const attrs = ['placeholder', 'title', 'aria-label']
    attrs.forEach(attr => {
      if (!el.hasAttribute(attr)) return
      let store = originalAttr.get(el)
      if (!store) { store = {}; originalAttr.set(el, store) }
      if (!store[attr]) store[attr] = el.getAttribute(attr)
      el.setAttribute(attr, translateValue(store[attr], locale))
    })
  })
}

export function installAutoTranslate(i18n, router) {
  const run = () => requestAnimationFrame(() => applyStaticTranslations(i18n))
  run()

  if (router) router.afterEach(run)

  const localeRef = i18n.global.locale
  if (typeof localeRef !== 'string' && localeRef && typeof localeRef === 'object') {
    let last = localeRef.value
    setInterval(() => {
      if (localeRef.value !== last) {
        last = localeRef.value
        run()
      }
    }, 250)
  }

  if (!observer) {
    observer = new MutationObserver(() => run())
    const root = document.getElementById('app')
    if (root) observer.observe(root, { childList: true, subtree: true })
  }
}
