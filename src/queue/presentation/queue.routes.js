export const queueRoutes = [
  { path: '/citizen/mis-turnos', component: () => import('@/queue/presentation/views/TicketView.vue'), meta: { role: 'citizen' } },
  { path: '/citizen/historial', component: () => import('@/queue/presentation/views/HistorialView.vue'), meta: { role: 'citizen' } },
  { path: '/supervisor/turnos', component: () => import('@/queue/presentation/views/TurnosView.vue'), meta: { role: 'supervisor' } },
]
