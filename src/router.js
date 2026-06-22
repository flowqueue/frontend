import { createRouter, createWebHistory } from 'vue-router'

function homeByRole(user) {
  if (user?.rol === 'citizen') return '/citizen'
  if (user?.rol === 'operator') return '/operator'
  if (user?.rol === 'supervisor') return '/supervisor'

}

const routes = [
  { path: '/', redirect: '/login' },

  {
    path: '/login',
    component: () => import('@/iam/presentation/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    component: () => import('@/iam/presentation/views/RegisterView.vue'),
    meta: { public: true },
  },

  /* ── Citizen ── */
  {
    path: '/citizen',
    component: () => import('@/queue/presentation/views/CitizenDashboardView.vue'),
    meta: { role: 'citizen' },
  },
  {
    path: '/citizen/buscar-entidad',
    component: () => import('@/location/presentation/views/BuscarEntidadView.vue'),
    meta: { role: 'citizen' },
  },
  {
    path: '/citizen/mis-turnos',
    component: () => import('@/queue/presentation/views/TicketView.vue'),
    meta: { role: 'citizen' },
  },
  {
    path: '/citizen/historial',
    component: () => import('@/queue/presentation/views/HistorialView.vue'),
    meta: { role: 'citizen' },
  },
  {
    path: '/citizen/notificaciones',
    component: () => import('@/operator/presentation/views/NotificacionesView.vue'),
    meta: { role: 'citizen' },
  },
  {
    path: '/citizen/ajustes',
    component: () => import('@/operator/presentation/views/ConfiguracionView.vue'),
    meta: { role: 'citizen' },
  },

  /* ── Operator ── */
  {
    path: '/operator',
    component: () => import('@/operator/presentation/views/OperatorDashboard.vue'),
    meta: { role: 'operator' },
  },
  {
    path: '/operator/cola',
    component: () => import('@/operator/presentation/views/ColaOperadorView.vue'),
    meta: { role: 'operator' },
  },
  {
    path: '/operator/notificaciones',
    component: () => import('@/operator/presentation/views/NotificacionesView.vue'),
    meta: { role: 'operator' },
  },
  {
    path: '/operator/configuracion',
    component: () => import('@/operator/presentation/views/ConfiguracionView.vue'),
    meta: { role: 'operator' },
  },
  {
    path: '/operator/estadisticas',
    component: () => import('@/analitics/presentation/views/ReportesView.vue'),
    meta: { role: 'operator' },
  },

  /* ── Supervisor ── */
  {
    path: '/supervisor',
    component: () => import('@/analitics/presentation/views/DashboardView.vue'),
    meta: { role: 'supervisor' },
  },
  {
    path: '/supervisor/cola',
    component: () => import('@/queue/presentation/views/ColaEnVivoView.vue'),
    meta: { role: 'supervisor' },
  },
  {
    path: '/supervisor/turnos',
    component: () => import('@/queue/presentation/views/TurnosView.vue'),
    meta: { role: 'supervisor' },
  },
  {
    path: '/supervisor/sedes',
    component: () => import('@/location/presentation/views/SedesView.vue'),
    meta: { role: 'supervisor' },
  },

  {
    path: '/supervisor/notificaciones',
    component: () => import('@/operator/presentation/views/NotificacionesView.vue'),
    meta: { role: 'supervisor' },
  },
  {
    path: '/supervisor/configuracion',
    component: () => import('@/operator/presentation/views/ConfiguracionView.vue'),
    meta: { role: 'supervisor' },
  },
  {
    path: '/supervisor/reportes',
    component: () => import('@/analitics/presentation/views/ReportesView.vue'),
    meta: { role: 'supervisor' },
  },
  {
    path: '/supervisor/gestionar-turnos',
    component: () => import('@/queue/presentation/views/GestionarTurnosView.vue'),
    meta: { role: 'supervisor' },
  },
  {
    path: '/supervisor/usuarios',
    component: () => import('@/iam/presentation/views/UsuariosView.vue'),
    meta: { role: 'supervisor' },
  },
  {
    path: '/supervisor/analitica',
    component: () => import('@/analitics/presentation/views/AnaliticaView.vue'),
    meta: { role: 'supervisor' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const raw  = localStorage.getItem('fq_user')
  const user = raw ? JSON.parse(raw) : null

  if (!to.meta.public && !user) return '/login'
  if (to.meta.role && user?.rol !== to.meta.role) return homeByRole(user)
  if (to.path === '/login' && user) return homeByRole(user)
})

export default router
