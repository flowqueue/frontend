<script setup>
import { computed, ref } from 'vue'
import AppLayout from '@/shared/components/AppLayout.vue'

const notifs = ref([
  { id:1, tipo:'info',    titulo:'Turno A-001 completado',         desc:'Juan García Pérez fue atendido exitosamente.',         hora:'09:15', leido:true  },
  { id:2, tipo:'warning', titulo:'Ciudadano ausente',              desc:'El ciudadano del turno A-003 no se presentó.',          hora:'09:32', leido:true  },
  { id:3, tipo:'success', titulo:'Turno A-004 completado',         desc:'Carmen Vega Huanca fue atendida exitosamente.',         hora:'09:48', leido:false },
  { id:4, tipo:'info',    titulo:'Nueva asignación de ventana',    desc:'Has sido reasignado a la Ventana 2 por el supervisor.', hora:'10:05', leido:false },
  { id:5, tipo:'warning', titulo:'Cola alcanzó 8 turnos',          desc:'La cola de espera supera el umbral configurado.',       hora:'10:22', leido:false },
  { id:6, tipo:'success', titulo:'Turno A-006 completado',         desc:'Rosa Flores Cueva fue atendida exitosamente.',          hora:'10:38', leido:false },
])
const filter = ref('todas')
const feedback = ref('')
const iconMap = { info:'ℹ', warning:'⚠', success:'✓' }
const colorMap = { info:'notif-info', warning:'notif-warn', success:'notif-ok' }
const visibleNotifs = computed(() => filter.value === 'no_leidas' ? notifs.value.filter(n => !n.leido) : notifs.value)
const unreadCount = computed(() => notifs.value.filter(n => !n.leido).length)
function markRead(n) { n.leido = true; feedback.value = `Notificación "${n.titulo}" marcada como leída.` }
function markAllRead() { notifs.value.forEach(n => n.leido = true); feedback.value = 'Todas las notificaciones fueron marcadas como leídas.' }
function removeNotif(id) { notifs.value = notifs.value.filter(n => n.id !== id); feedback.value = 'Notificación eliminada.' }
</script>

<template>
  <AppLayout title="Notificaciones" subtitle="Alertas y eventos recientes">
    <template #actions>
      <button class="action-btn" @click="filter = filter === 'todas' ? 'no_leidas' : 'todas'">
        {{ filter === 'todas' ? 'Ver no leídas' : 'Ver todas' }}
      </button>
      <button class="action-btn action-dark" @click="markAllRead">Marcar todas</button>
    </template>
    <p v-if="feedback" class="feedback">{{ feedback }}</p>
    <div class="notif-list card">
      <div class="notif-header">
        <p class="section-title">Hoy</p>
        <span class="badge badge-blue">{{ unreadCount }} nuevas</span>
      </div>
      <div class="notif-item" v-for="n in visibleNotifs" :key="n.id" :class="{ unread: !n.leido }">
        <div class="notif-icon" :class="colorMap[n.tipo]">{{ iconMap[n.tipo] }}</div>
        <div class="notif-body">
          <div class="notif-titulo">{{ n.titulo }}</div>
          <div class="notif-desc">{{ n.desc }}</div>
        </div>
        <div class="notif-hora">{{ n.hora }}</div>
        <button v-if="!n.leido" class="mini-btn" @click="markRead(n)">Leída</button>
        <button class="mini-btn danger" @click="removeNotif(n.id)">Eliminar</button>
        <div class="notif-dot" v-if="!n.leido"></div>
      </div>
      <div v-if="!visibleNotifs.length" class="empty-state">No hay notificaciones para mostrar.</div>
    </div>
  </AppLayout>
</template>

<style scoped>
.action-btn{border:1.5px solid var(--border);background:white;color:var(--text-muted);border-radius:8px;padding:.42rem .85rem;font-size:.8rem;font-weight:800;cursor:pointer}.action-dark{background:#1e293b;color:white;border-color:#1e293b}.feedback{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;border-radius:8px;padding:.65rem .85rem;margin-bottom:1rem;font-size:.82rem;font-weight:800}
.notif-list { overflow: hidden; }
.notif-header { display: flex; align-items: center; justify-content: space-between; padding: .875rem 1.25rem; border-bottom: 1px solid var(--border); }
.section-title { font-size: .9rem; font-weight: 600; }
.notif-item { display: flex; align-items: flex-start; gap: .875rem; padding: .875rem 1.25rem; border-bottom: 1px solid var(--border); position: relative; transition: background .12s; }
.notif-item:last-child { border-bottom: none; }.notif-item:hover { background: #f8fafc; }.notif-item.unread { background: #f0f9ff; }
.notif-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .95rem; font-weight: 700; flex-shrink: 0; }.notif-info { background: #dbeafe; color: #1d4ed8; }.notif-warn { background: #ffedd5; color: #c2410c; }.notif-ok{ background: #dcfce7; color: #15803d; }
.notif-body { flex: 1; min-width: 0; }.notif-titulo { font-size: .875rem; font-weight: 600; color: var(--text); }.notif-desc{ font-size: .78rem; color: var(--text-muted); margin-top: 2px; }.notif-hora{ font-size: .75rem; color: var(--text-muted); white-space: nowrap; margin-top: 2px; flex-shrink: 0; }.notif-dot{ width: 8px; height: 8px; border-radius: 50%; background: var(--primary); position: absolute; top: 1.1rem; right: 1.25rem; }.mini-btn{border:none;border-radius:7px;background:#e2e8f0;color:#475569;font-size:.7rem;font-weight:800;padding:.32rem .6rem;cursor:pointer}.mini-btn.danger{background:#fee2e2;color:#b91c1c}.empty-state{text-align:center;color:var(--text-muted);padding:2rem}
@media(max-width:800px){.notif-item{flex-wrap:wrap}.notif-hora{width:100%}}
</style>
