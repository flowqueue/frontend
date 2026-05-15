<script setup>
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useRouter } from 'vue-router'

const auth   = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-brand">
      <div class="brand-icon">FQ</div>
      <span class="brand-name">FlowQueue</span>
    </div>

    <div class="navbar-center" v-if="auth.user">
      <span class="role-chip" :class="auth.user.rol">
        {{ auth.user.rol === 'operator' ? 'Operador' : 'Supervisor' }}
      </span>
    </div>

    <div class="navbar-right" v-if="auth.user">
      <span class="user-name">{{ auth.user.nombre }}</span>
      <button class="btn-logout" @click="handleLogout">Salir</button>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--primary);
  color: #fff;
  padding: 0 1.5rem;
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.brand-icon {
  width: 34px;
  height: 34px;
  background: var(--green);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.85rem;
  color: #fff;
}
.brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.role-chip {
  padding: 0.25rem 0.85rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.role-chip.operator   { background: rgba(93,202,165,0.25); color: #5DCAA5; border: 1px solid rgba(93,202,165,0.4); }
.role-chip.supervisor { background: rgba(34,197,94,0.2);  color: #22c55e; border: 1px solid rgba(34,197,94,0.4); }

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.user-name {
  font-size: 0.9rem;
  opacity: 0.9;
}
.btn-logout {
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 6px;
  padding: 0.3rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-logout:hover { background: rgba(255,255,255,0.25); }
</style>
