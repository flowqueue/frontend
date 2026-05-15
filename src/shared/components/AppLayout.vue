<script setup>
import Sidebar from './Sidebar.vue'
import { useAuthStore } from '@/iam/application/auth.store.js'

const auth = useAuthStore()

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="app-shell">
    <Sidebar />
    <div class="app-main">
      <header class="topbar">
        <div class="topbar-left">
          <p class="topbar-title">{{ title }}</p>
          <p class="topbar-sub" v-if="subtitle">{{ subtitle }}</p>
        </div>
        <div class="topbar-right">
          <slot name="actions" />
          <span class="bell" aria-label="Notificaciones">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16z" />
              <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
            </svg>
          </span>
          <div class="user-bubble">{{ auth.user?.nombre?.split(' ').map(x => x[0]).slice(0,2).join('') }}</div>
        </div>
      </header>
      <main class="page-content"><slot /></main>
    </div>
  </div>
</template>

<style scoped>
.topbar-left { flex: 1; }
.topbar-title { font-size: 1.1rem; font-weight: 800; color: var(--text); line-height: 1; }
.topbar-sub { font-size: 0.76rem; color: var(--text-muted); margin-top: 4px; }
.topbar-right { display: flex; align-items: center; gap: 0.75rem; }
.bell { width: 34px; height: 34px; border-radius: 50%; background: #f1f5f9; border: 1px solid var(--border); color: var(--text-muted); display: flex; align-items: center; justify-content: center; }
.bell svg { width: 17px; height: 17px; }
.user-bubble { width: 34px; height: 34px; border-radius: 50%; background: #1d6fe9; color: #fff; font-weight: 800; font-size: 0.76rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; }
</style>
