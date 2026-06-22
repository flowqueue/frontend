import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/iam/application/auth.store.js'

// 1. Usamos las propiedades booleanas de tu clase User
function homeByRole(user) {
  if (!user) return '/login'
  if (user.isOperator) return '/operator'
  if (user.isSupervisor) return '/supervisor'
  return '/citizen' // Por defecto, si no es ninguno de los anteriores
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
    meta: { requiresAuth: true, role: 'citizen' },
  },
  {
    path: '/citizen/buscar-entidad',
    component: () => import('@/location/presentation/views/BuscarEntidadView.vue'),
    meta: { requiresAuth: true, role: 'citizen' },
  },
  {
    path: '/citizen/mis-turnos',
    component: () => import('@/queue/presentation/views/TicketView.vue'),
    meta: { requiresAuth: true, role: 'citizen' },
  },
  {
    path: '/citizen/historial',
    component: () => import('@/queue/presentation/views/HistorialView.vue'),
    meta: { requiresAuth: true, role: 'citizen' },
  },
  {
    path: '/citizen/notificaciones',
    component: () => import('@/operator/presentation/views/NotificacionesView.vue'),
    meta: { requiresAuth: true, role: 'citizen' },
  },
  {
    path: '/citizen/ajustes',
    component: () => import('@/operator/presentation/views/ConfiguracionView.vue'),
    meta: { requiresAuth: true, role: 'citizen' },
  },

  /* ── Operator ── */
  {
    path: '/operator',
    component: () => import('@/operator/presentation/views/OperatorDashboard.vue'),
    meta: { requiresAuth: true, role: 'operator' },
  },
  {
    path: '/operator/cola',
    component: () => import('@/operator/presentation/views/ColaOperadorView.vue'),
    meta: { requiresAuth: true, role: 'operator' },
  },
  {
    path: '/operator/notificaciones',
    component: () => import('@/operator/presentation/views/NotificacionesView.vue'),
    meta: { requiresAuth: true, role: 'operator' },
  },
  {
    path: '/operator/configuracion',
    component: () => import('@/operator/presentation/views/ConfiguracionView.vue'),
    meta: { requiresAuth: true, role: 'operator' },
  },
  {
    path: '/operator/estadisticas',
    component: () => import('@/analitics/presentation/views/ReportesView.vue'),
    meta: { requiresAuth: true, role: 'operator' },
  },

  /* ── Supervisor ── */
  {
    path: '/supervisor',
    component: () => import('@/analitics/presentation/views/DashboardView.vue'),
    meta: { requiresAuth: true, role: 'supervisor' },
  },
  {
    path: '/supervisor/cola',
    component: () => import('@/queue/presentation/views/ColaEnVivoView.vue'),
    meta: { requiresAuth: true, role: 'supervisor' },
  },
  {
    path: '/supervisor/turnos',
    component: () => import('@/queue/presentation/views/TurnosView.vue'),
    meta: { requiresAuth: true, role: 'supervisor' },
  },
  {
    path: '/supervisor/sedes',
    component: () => import('@/location/presentation/views/SedesView.vue'),
    meta: { requiresAuth: true, role: 'supervisor' },
  },

  {
    path: '/supervisor/notificaciones',
    component: () => import('@/operator/presentation/views/NotificacionesView.vue'),
    meta: { requiresAuth: true, role: 'supervisor' },
  },
  {
    path: '/supervisor/configuracion',
    component: () => import('@/operator/presentation/views/ConfiguracionView.vue'),
    meta: { requiresAuth: true, role: 'supervisor' },
  },
  {
    path: '/supervisor/reportes',
    component: () => import('@/analitics/presentation/views/ReportesView.vue'),
    meta: { requiresAuth: true, role: 'supervisor' },
  },
  {
    path: '/supervisor/gestionar-turnos',
    component: () => import('@/queue/presentation/views/GestionarTurnosView.vue'),
    meta: { requiresAuth: true, role: 'supervisor' },
  },
  {
    path: '/supervisor/usuarios',
    component: () => import('@/iam/presentation/views/UsuariosView.vue'),
    meta: { requiresAuth: true, role: 'supervisor' },
  },
  {
    path: '/supervisor/analitica',
    component: () => import('@/analitics/presentation/views/AnaliticaView.vue'),
    meta: { requiresAuth: true, role: 'supervisor' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const raw = localStorage.getItem('fq_user')
  const user = raw ? JSON.parse(raw) : null
  const role = user?.role?.toLowerCase() // 'operator', 'supervisor', o 'citizen'

  // 1. Si la ruta requiere autenticación y no hay usuario, al login
  if (to.meta.requiresAuth && !user) {
    return next('/login')
  }

  // 2. Lógica de protección por roles
  if (to.meta.role) {
    // Si el rol de la ruta coincide con el del usuario, adelante
    if (to.meta.role === role) {
      return next()
    } else {
      // Si el rol no coincide, lo mandamos a su home correspondiente
      if (role === 'operator') return next('/operator')
      if (role === 'supervisor') return next('/supervisor')
      return next('/citizen')
    }
  }

  next()
})
export default router
