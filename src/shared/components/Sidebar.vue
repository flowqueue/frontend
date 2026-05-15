<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/iam/application/auth.store.js'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const icons = {
  home: 'M3 10.8 12 3l9 7.8V21a1 1 0 0 1-1 1h-5v-6H8v6H4a1 1 0 0 1-1-1z',
  ticket: 'M4 5h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z',
  search: 'M10.5 18a7.5 7.5 0 1 1 5.3-12.8 7.5 7.5 0 0 1-5.3 12.8Zm5.2-2.3L21 21',
  bell: 'M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16zM9.5 20a2.5 2.5 0 0 0 5 0',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 5v6h6M12 7v5l3 2',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-13v3m0 13v3m9.5-9.5h-3m-13 0h-3m16.1-6.1-2.1 2.1M7.5 16.5l-2.1 2.1m0-13.2 2.1 2.1m9 9 2.1 2.1',
  monitor: 'M4 5h16v11H4zM9 21h6M12 16v5',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  pause: 'M8 5h3v14H8zM13 5h3v14h-3z',
  chart: 'M4 19V5M8 17v-6M13 17V7M18 17v-9M22 19H4',
  building: 'M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  report: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6',
}

const citizenNav = [
  { label: 'Inicio', icon: 'home', to: '/citizen' },
  { label: 'Mis turnos', icon: 'ticket', to: '/citizen/mis-turnos' },
  { label: 'Buscar entidad', icon: 'search', to: '/citizen/buscar-entidad' },
  { label: 'Notificaciones', icon: 'bell', to: '/citizen/notificaciones' },
  { label: 'Historial', icon: 'history', to: '/citizen/historial' },
  { divider: true, label: 'CONFIGURACIÓN' },
  { label: 'Ajustes', icon: 'settings', to: '/citizen/ajustes' },
]

const operatorNav = [
  { label: 'Mi ventanilla', icon: 'monitor', to: '/operator' },
  { label: 'Cola activa', icon: 'list', to: '/operator/cola' },
  { label: 'Pausar', icon: 'pause', to: '/operator/configuracion' },
  { label: 'Estadísticas', icon: 'chart', to: '/operator/estadisticas' },
  { label: 'Notificaciones', icon: 'bell', to: '/operator/notificaciones' },
]

const supervisorNav = [
  { label: 'Dashboard', icon: 'chart', to: '/supervisor' },
  { label: 'Analítica', icon: 'settings', to: '/supervisor/analitica' },
  { label: 'Sedes', icon: 'building', to: '/supervisor/sedes' },
  { label: 'Servicios', icon: 'list', to: '/supervisor/gestionar-turnos' },
  { label: 'Operadores', icon: 'users', to: '/supervisor/usuarios' },
  { label: 'Reportes', icon: 'report', to: '/supervisor/reportes' },
]

const navItems = computed(() => {
  if (auth.user?.isOperator) return operatorNav
  if (auth.user?.isSupervisor) return supervisorNav
  return citizenNav
})

const roleTitle = computed(() => {
  if (auth.user?.isOperator) return 'OPERADOR'
  if (auth.user?.isSupervisor) return 'ADMINISTRADOR'
  return 'MENÚ PRINCIPAL'
})

const roleLabel = computed(() => {
  if (auth.user?.isOperator) return 'Ventanilla 3'
  if (auth.user?.isSupervisor) return 'Supervisor'
  return 'Ciudadano'
})

const initials = computed(() => {
  return auth.user?.nombre?.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase() ?? 'U'
})

function isActive(item) {
  if (!item.to) return false
  if (item.to === '/operator' || item.to === '/supervisor' || item.to === '/citizen') return route.path === item.to
  return route.path.startsWith(item.to)
}

function navigate(to) { router.push(to) }
function handleLogout() { auth.logout(); router.push('/login') }
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-logo" @click="navigate(auth.user?.isSupervisor ? '/supervisor' : auth.user?.isOperator ? '/operator' : '/citizen')">
      <div class="logo-icon">FQ</div>
      <div>
        <span class="logo-name">FlowQueue</span>
        <span class="logo-caption">Queue Management</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section">{{ roleTitle }}</div>
      <template v-for="item in navItems" :key="item.label">
        <div v-if="item.divider" class="nav-section divider-section">{{ item.label }}</div>
        <a v-else class="nav-item" :class="{ active: isActive(item) }" href="#" @click.prevent="navigate(item.to)">
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path :d="icons[item.icon]" />
            </svg>
          </span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </template>
    </nav>

    <div class="sidebar-footer">
      <div class="user-avatar">{{ initials }}</div>
      <div class="user-meta">
        <span class="user-name">{{ auth.user?.nombre }}</span>
        <span class="user-role">{{ roleLabel }}</span>
      </div>
      <button class="logout-btn" @click="handleLogout" title="Cerrar sesión" aria-label="Cerrar sesión">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: linear-gradient(180deg, #071f33 0%, #061827 100%);
  display: flex;
  flex-direction: column;
  z-index: 100;
  border-right: 1px solid rgba(255,255,255,0.08);
}
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
  cursor: pointer;
}
.logo-icon {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #1d6fe9, #5dcaa5);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.72rem;
  color: #fff;
  box-shadow: 0 10px 24px rgba(29,111,233,0.25);
}
.logo-name,
.logo-caption {
  display: block;
}
.logo-name {
  font-size: 0.95rem;
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
}
.logo-caption {
  margin-top: 2px;
  font-size: 0.62rem;
  color: #8ca0b8;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.sidebar-nav {
  flex: 1;
  padding: 0.9rem 0.75rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.nav-section {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #738196;
  padding: 0.65rem 0.5rem 0.45rem;
}
.divider-section {
  border-top: 1px solid var(--sidebar-border);
  margin-top: 0.7rem;
  padding-top: 0.95rem;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.72rem;
  padding: 0.7rem 0.75rem;
  margin: 0.12rem 0;
  font-size: 0.84rem;
  font-weight: 650;
  color: var(--sidebar-text);
  text-decoration: none;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, transform 0.14s;
  position: relative;
  border-radius: 9px;
}
.nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: #e5eefb;
  transform: translateX(2px);
}
.nav-item.active {
  background: var(--sidebar-active);
  color: var(--sidebar-text-active);
  font-weight: 800;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: -0.75rem;
  top: 0.55rem;
  bottom: 0.55rem;
  width: 3px;
  background: #5dcaa5;
  border-radius: 999px;
}
.nav-icon {
  width: 19px;
  height: 19px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.95;
  flex-shrink: 0;
}
.nav-icon svg {
  width: 19px;
  height: 19px;
}
.nav-label { flex: 1; }
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.95rem 1rem;
  border-top: 1px solid var(--sidebar-border);
  flex-shrink: 0;
  background: rgba(0,0,0,0.16);
}
.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #1d6fe9;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.user-name {
  font-size: 0.76rem;
  font-weight: 800;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-role {
  font-size: 0.65rem;
  color: #8ca0b8;
  margin-top: 2px;
}
.logout-btn {
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: #8ca0b8;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  flex-shrink: 0;
}
.logout-btn svg { width: 17px; height: 17px; }
.logout-btn:hover {
  color: #ef4444;
  background: rgba(239,68,68,0.08);
  border-color: rgba(239,68,68,0.22);
}
</style>
