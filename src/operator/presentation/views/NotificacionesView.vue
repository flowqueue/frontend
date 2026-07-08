<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/shared/components/AppLayout.vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { getNotifications, markNotificationAsRead } from '@/notification/infrastructure/notification.api.js'
import { formatTime, timeAgo } from '@/shared/utils/format.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const auth = useAuthStore()
const notifs = ref([])
const loading = ref(true)
const filter = ref('todas')
const feedback = ref('')

const iconMap = { info: 'ℹ', warning: '⚠', success: '✓', 'turn-called': '📣', 'turn-completed': '✓', 'turn-cancelled': '✗', 'turn-near': '⏳', general: 'ℹ' }
const colorMap = {
  info: 'notif-info',
  warning: 'notif-warn',
  success: 'notif-ok',
  'turn-called': 'notif-info',
  'turn-completed': 'notif-ok',
  'turn-cancelled': 'notif-warn',
  'turn-near': 'notif-warn',
  general: 'notif-info',
}

onMounted(loadNotifications)

async function loadNotifications() {
  loading.value = true
  try {
    notifs.value = await getNotifications(auth.user?.id)
  } finally {
    loading.value = false
  }
}

const visibleNotifs = computed(() =>
  filter.value === 'no_leidas' ? notifs.value.filter(n => !n.read) : notifs.value)
const unreadCount = computed(() => notifs.value.filter(n => !n.read).length)

const role = computed(() => (auth.user?.role || auth.user?.rol || '').toLowerCase())
const emptyHint = computed(() => {
  if (role.value === 'citizen') return 'Aquí verás avisos cuando tu turno sea llamado, atendido o cancelado.'
  if (role.value === 'operator' || role.value === 'operador') return 'Los ciudadanos reciben avisos automáticos cuando atiendes sus turnos. Aquí verás alertas dirigidas a tu cuenta.'
  return 'Aquí aparecerán las alertas del sistema dirigidas a tu cuenta.'
})

async function markRead(n) {
  try {
    await markNotificationAsRead(n.id)
    n.read = true
    feedback.value = t('notifications.markedRead')
  } catch (_) { /* sin cambios si falla */ }
}

async function markAllRead() {
  const unread = notifs.value.filter(n => !n.read)
  await Promise.allSettled(unread.map(n => markNotificationAsRead(n.id)))
  unread.forEach(n => { n.read = true })
  feedback.value = t('notifications.allRead')
}
</script>

<template>
  <AppLayout title="Notificaciones" subtitle="Alertas y eventos recientes">
    <template #actions>
      <button class="action-btn" @click="filter = filter === 'todas' ? 'no_leidas' : 'todas'">
        {{ filter === 'todas' ? t('notifications.unread') : t('notifications.all') }}
      </button>
      <button class="action-btn action-dark" :disabled="!unreadCount" @click="markAllRead">{{ t('notifications.markAll') }}</button>
    </template>
    <p v-if="feedback" class="feedback">{{ feedback }}</p>

    <div v-if="loading" class="loading-screen"><div class="spinner"></div><p>{{ t('common.loading') }}</p></div>

    <div v-else class="notif-list card">
      <div class="notif-header">
        <p class="section-title">{{ t('time.today') }}</p>
        <span class="badge badge-blue">{{ unreadCount }} {{ t('notifications.new') }}</span>
      </div>
      <div class="notif-item" v-for="n in visibleNotifs" :key="n.id" :class="{ unread: !n.read }">
        <div class="notif-icon" :class="colorMap[n.type] ?? 'notif-info'">{{ iconMap[n.type] ?? 'ℹ' }}</div>
        <div class="notif-body">
          <div class="notif-titulo">{{ n.title }}</div>
          <div class="notif-desc">{{ n.message }}</div>
        </div>
        <div class="notif-hora" :title="formatTime(n.createdAt)">{{ timeAgo(n.createdAt) }}</div>
        <button v-if="!n.read" class="mini-btn" @click="markRead(n)">{{ t('notifications.read') }}</button>
        <div class="notif-dot" v-if="!n.read"></div>
      </div>
      <div v-if="!visibleNotifs.length" class="empty-state">
        <span class="empty-icon">🔔</span>
        <p>{{ t('notifications.empty') }}</p>
        <p class="empty-hint">{{ emptyHint }}</p>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.action-btn{border:1.5px solid var(--border);background:white;color:var(--text-muted);border-radius:8px;padding:.42rem .85rem;font-size:.8rem;font-weight:800;cursor:pointer}.action-dark{background:#1e293b;color:white;border-color:#1e293b}.action-btn:disabled{opacity:.5;cursor:not-allowed}.feedback{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;border-radius:8px;padding:.65rem .85rem;margin-bottom:1rem;font-size:.82rem;font-weight:800}
.notif-list { overflow: hidden; }
.notif-header { display: flex; align-items: center; justify-content: space-between; padding: .875rem 1.25rem; border-bottom: 1px solid var(--border); }
.section-title { font-size: .9rem; font-weight: 600; }
.notif-item { display: flex; align-items: flex-start; gap: .875rem; padding: .875rem 1.25rem; border-bottom: 1px solid var(--border); position: relative; transition: background .12s; }
.notif-item:last-child { border-bottom: none; }.notif-item:hover { background: #f8fafc; }.notif-item.unread { background: #f0f9ff; }
.notif-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .95rem; font-weight: 700; flex-shrink: 0; }.notif-info { background: #dbeafe; color: #1d4ed8; }.notif-warn { background: #ffedd5; color: #c2410c; }.notif-ok{ background: #dcfce7; color: #15803d; }
.notif-body { flex: 1; min-width: 0; }.notif-titulo { font-size: .875rem; font-weight: 600; color: var(--text); }.notif-desc{ font-size: .78rem; color: var(--text-muted); margin-top: 2px; }.notif-hora{ font-size: .75rem; color: var(--text-muted); white-space: nowrap; margin-top: 2px; flex-shrink: 0; }.notif-dot{ width: 8px; height: 8px; border-radius: 50%; background: var(--primary); position: absolute; top: 1.1rem; right: 1.25rem; }.mini-btn{border:none;border-radius:7px;background:#e2e8f0;color:#475569;font-size:.7rem;font-weight:800;padding:.32rem .6rem;cursor:pointer}.empty-state{text-align:center;color:var(--text-muted);padding:2.4rem 2rem}
.empty-icon{font-size:1.6rem;display:block;margin-bottom:.4rem}
.empty-hint{font-size:.76rem;margin-top:.3rem}
.loading-screen{display:flex;flex-direction:column;gap:1rem;align-items:center;justify-content:center;min-height:220px;color:var(--text-muted)}
.spinner{width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:800px){.notif-item{flex-wrap:wrap}.notif-hora{width:100%}}
</style>
