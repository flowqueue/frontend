<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import { useAuthStore } from '@/iam/application/auth.store.js'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})

const auth = useAuthStore()
const router = useRouter()
const { t, locale } = useI18n()
const profileOpen = ref(false)

const titleKeys = {
  'Inicio': 'pages.home.title',
  'Buscar entidad': 'pages.searchEntity.title',
  'Mi turno activo': 'pages.ticket.title',
  'Historial de trámites': 'pages.history.title',
  'Notificaciones': 'pages.notifications.title',
  'Configuración': 'pages.settings.title',
  'Cola en vivo': 'pages.liveQueue.title',
  'Panel Operador': 'pages.operatorPanel.title',
  'Reportes': 'pages.reports.title',
  'Dashboard': 'pages.dashboard.title',
  'Analítica': 'pages.analytics.title',
  'Sedes': 'pages.branches.title',
  'Usuarios': 'pages.users.title',
  'Gestionar turnos': 'pages.manageTurns.title',
  'Estado del turno': 'pages.turnStatus.title',
  'Turnos': 'pages.turns.title',
}

const subtitleKeys = {
  'Selecciona la institución y sede donde realizarás tu trámite': 'pages.searchEntity.subtitle',
  'Todos tus turnos anteriores en FlowQueue': 'pages.history.subtitle',
  'Alertas y eventos recientes': 'pages.notifications.subtitle',
  'Perfil y preferencias de tu cuenta': 'pages.settings.subtitle',
  'Actualización automática cada 15 segundos': 'pages.liveQueue.subtitle',
  'Exportación y análisis de datos históricos': 'pages.reports.subtitle',
  'Indicadores para tomar decisiones por sede y horario': 'pages.analytics.subtitle',
  'Administración de sedes y locales': 'pages.branches.subtitle',
  'Administración de operadores y supervisores': 'pages.users.subtitle',
  'Crea, filtra y actualiza los turnos de atención': 'pages.manageTurns.subtitle',
  'Consulta la posición actual de un ticket': 'pages.turnStatus.subtitle',
  'Gestión de turnos del día': 'pages.turns.subtitle',
}

const displayTitle = computed(() => titleKeys[props.title] ? t(titleKeys[props.title]) : props.title)
const displaySubtitle = computed(() => {
  if (!props.subtitle) return ''
  const staticKey = subtitleKeys[props.subtitle]
  if (staticKey) return t(staticKey)
  return props.subtitle
})

const initials = computed(() => {
  return auth.user?.nombre?.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase() ?? 'U'
})

const homePath = computed(() => {
  if (auth.user?.rol === 'operator') return '/operator'
  if (auth.user?.rol === 'supervisor') return '/supervisor'
  return '/citizen'
})

const notificationPath = computed(() => {
  if (auth.user?.rol === 'operator') return '/operator/notificaciones'
  if (auth.user?.rol === 'supervisor') return '/supervisor/notificaciones'
  return '/citizen/notificaciones'
})

const settingsPath = computed(() => {
  if (auth.user?.rol === 'operator') return '/operator/configuracion'
  if (auth.user?.rol === 'supervisor') return '/supervisor/configuracion'
  return '/citizen/ajustes'
})

function go(path) {
  profileOpen.value = false
  router.push(path)
}

function changeLanguage(lang) {
  locale.value = lang
  localStorage.setItem('fq_lang', lang)
}

function logout() {
  profileOpen.value = false
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-shell" @click="profileOpen = false">
    <Sidebar />
    <div class="app-main">
      <header class="topbar">
        <div class="topbar-left">
          <p class="topbar-title">{{ displayTitle }}</p>
          <p class="topbar-sub" v-if="displaySubtitle">{{ displaySubtitle }}</p>
        </div>

        <div class="topbar-right" @click.stop>
          <slot name="actions" />

          <div class="system-chip" aria-label="Estado de sincronizacion">
            <span></span>
            En vivo
          </div>

          <div class="lang-switcher" aria-label="Language switcher">
            <button :class="{ active: locale === 'es' }" @click="changeLanguage('es')">ES</button>
            <button :class="{ active: locale === 'en' }" @click="changeLanguage('en')">EN</button>
          </div>

          <button class="icon-btn bell" :title="t('topbar.goNotifications')" :aria-label="t('topbar.goNotifications')" @click="go(notificationPath)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16z" />
              <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
            </svg>
          </button>

          <div class="profile-wrap">
            <button class="user-bubble" :title="t('topbar.profile')" :aria-label="t('topbar.profile')" @click="profileOpen = !profileOpen">
              {{ initials }}
            </button>

            <div v-if="profileOpen" class="profile-menu">
              <div class="profile-head">
                <div class="profile-avatar">{{ initials }}</div>
                <div>
                  <strong>{{ auth.user?.nombre }}</strong>
                  <span>{{ auth.user?.email }}</span>
                </div>
              </div>

              <button @click="go(homePath)">{{ t('sidebar.home') }}</button>
              <button @click="go(notificationPath)">{{ t('common.notifications') }}</button>
              <button @click="go(settingsPath)">{{ t('common.settings') }}</button>

              <div class="profile-language">
                <span>{{ t('topbar.language') }}</span>
                <div>
                  <button :class="{ active: locale === 'es' }" @click="changeLanguage('es')">ES</button>
                  <button :class="{ active: locale === 'en' }" @click="changeLanguage('en')">EN</button>
                </div>
              </div>

              <button class="danger" @click="logout">{{ t('common.logout') }}</button>
            </div>
          </div>
        </div>
      </header>

      <main class="page-content"><slot /></main>
    </div>
  </div>
</template>

<style scoped>
.topbar-left { flex: 1; min-width: 0; }
.topbar-title { font-size: 1.05rem; font-weight: 900; color: var(--text); line-height: 1; letter-spacing: 0; }
.topbar-sub { font-size: 0.76rem; color: var(--text-muted); margin-top: 5px; }
.topbar-right { display: flex; align-items: center; gap: 0.75rem; }
.system-chip { display: inline-flex; align-items: center; gap: 0.42rem; min-height: 34px; padding: 0 0.7rem; border: 1px solid #c7f0df; border-radius: 999px; background: #ecfdf3; color: #087852; font-size: 0.72rem; font-weight: 900; white-space: nowrap; }
.system-chip span { width: 7px; height: 7px; border-radius: 50%; background: #12b76a; box-shadow: 0 0 0 4px rgba(18, 183, 106, 0.14); animation: topbar-pulse 1.7s ease-in-out infinite; }
.icon-btn { width: 36px; height: 36px; border-radius: 50%; background: #fff; border: 1px solid var(--border); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.18s ease; }
.icon-btn:hover { background: #eef6ff; color: var(--primary); border-color: #bfdbfe; transform: translateY(-1px); }
.bell svg { width: 17px; height: 17px; }
.lang-switcher { display: flex; align-items: center; gap: 0.25rem; padding: 0.18rem; border: 1px solid var(--border); border-radius: 999px; background: #fff; }
.lang-switcher button { border: 0; border-radius: 999px; padding: 0.34rem 0.55rem; font-size: 0.68rem; font-weight: 900; color: var(--text-muted); background: transparent; cursor: pointer; }
.lang-switcher button.active { background: var(--ink); color: #fff; }
.profile-wrap { position: relative; }
.user-bubble { width: 36px; height: 36px; border: 0; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--teal)); color: #fff; font-weight: 900; font-size: 0.76rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; box-shadow: 0 10px 22px rgba(25, 103, 210, 0.22); }
.profile-menu { position: absolute; right: 0; top: calc(100% + 0.7rem); width: 260px; background: #fff; border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 18px 45px rgba(15,23,42,0.16); padding: 0.7rem; z-index: 150; animation: menu-in 0.18s ease both; }
.profile-head { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem; border-bottom: 1px solid var(--border); margin-bottom: 0.4rem; }
.profile-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--teal)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; }
.profile-head strong { display: block; color: var(--text); font-size: 0.86rem; }
.profile-head span { display: block; color: var(--text-muted); font-size: 0.72rem; margin-top: 2px; }
.profile-menu > button { width: 100%; border: 0; background: transparent; text-align: left; padding: 0.72rem 0.75rem; border-radius: 6px; color: var(--text); font-weight: 750; cursor: pointer; }
.profile-menu > button:hover { background: #f1f5f9; color: var(--primary); }
.profile-menu > button.danger { color: #dc2626; }
.profile-menu > button.danger:hover { background: #fef2f2; color: #b91c1c; }
.profile-language { padding: 0.65rem 0.75rem; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin: 0.35rem 0; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.profile-language span { color: var(--text-muted); font-size: 0.78rem; font-weight: 800; }
.profile-language div { display: flex; gap: 0.3rem; }
.profile-language button { border: 1px solid var(--border); background: #f8fafc; color: var(--text-muted); padding: 0.3rem 0.5rem; border-radius: 6px; font-size: 0.68rem; font-weight: 900; cursor: pointer; }
.profile-language button.active { background: var(--ink); border-color: var(--ink); color: #fff; }
@keyframes topbar-pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 4px rgba(18, 183, 106, 0.14); } 50% { transform: scale(1.22); box-shadow: 0 0 0 8px rgba(18, 183, 106, 0.04); } }
@keyframes menu-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 860px) { .system-chip { display: none; } }
@media (max-width: 720px) { .lang-switcher { display: none; } .profile-menu { right: -0.2rem; width: 240px; } }
</style>
