<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/iam/application/auth.store.js'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function routeByRole(user) {
  if (user.isOperator) return '/operator'
  if (user.isSupervisor) return '/supervisor'
  return '/citizen'
}

async function handleLogin() {
  error.value = ''
  if (!email.value || !password.value) { error.value = 'Completa todos los campos.'; return }
  loading.value = true
  try {
    const user = await auth.login(email.value, password.value)
    router.push(routeByRole(user))
  } catch (_) {
    error.value = 'Credenciales incorrectas. Intenta de nuevo.'
  } finally { loading.value = false }
}

function fillDemo(type) {
  const data = {
    citizen: ['alex@flowqueue.pe','123456'],
    operator: ['carlos@flowqueue.pe','123456'],
    supervisor: ['ana@flowqueue.pe','123456'],
  }[type]
  email.value = data[0]
  password.value = data[1]
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo"><div class="logo-icon">FQ</div><span class="logo-name">FlowQueue</span></div>
        <h1>Iniciar sesión</h1>
        <p class="subtitle">Accede a tu panel de colas virtuales</p>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
        <label>Correo electrónico<input v-model="email" type="email" placeholder="tu@correo.pe" /></label>
        <label>Contraseña<input v-model="password" type="password" placeholder="••••••" /></label>
        <p class="error-msg" v-if="error">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading">{{ loading ? 'Ingresando...' : 'Ingresar' }}</button>
      </form>
      <div class="demo-hint">
        <p><strong>Cuentas de prueba:</strong></p>
        <div class="demo-buttons">
          <button @click="fillDemo('citizen')">Ciudadano</button>
          <button @click="fillDemo('operator')">Operador</button>
          <button @click="fillDemo('supervisor')">Supervisor</button>
        </div>
        <p>Contraseña para todas: <code>123456</code></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page { min-height: 100vh; background: linear-gradient(135deg,#0b2238 0%,#0C447C 45%,#1d6fe9 100%); display:flex; align-items:center; justify-content:center; padding:1.5rem; }
.login-card { background:#fff; border-radius:18px; box-shadow:0 22px 70px rgba(0,0,0,.24); padding:2.5rem; width:100%; max-width:430px; }
.login-header { text-align:center; margin-bottom:2rem; }.logo{display:inline-flex;align-items:center;gap:.55rem;margin-bottom:1.2rem}.logo-icon{width:44px;height:44px;background:#1d6fe9;border-radius:10px;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center}.logo-name{font-size:1.4rem;font-weight:900;color:#0C447C}h1{font-size:1.55rem;margin-bottom:.4rem}.subtitle{color:var(--text-muted);font-size:.9rem}.login-form{display:flex;flex-direction:column;gap:1rem}label{font-size:.86rem;font-weight:700;color:var(--text)}input{margin-top:.4rem;width:100%;padding:.72rem .9rem;border:1.5px solid var(--border);border-radius:8px;font-size:.95rem;outline:none}input:focus{border-color:#1d6fe9;box-shadow:0 0 0 3px rgba(29,111,233,.1)}.error-msg{color:var(--danger);font-size:.84rem;padding:.55rem .75rem;background:#fee2e2;border-radius:7px}.demo-hint{margin-top:1.4rem;padding:1rem;background:#f8fafc;border-radius:10px;border:1px solid var(--border);font-size:.8rem;color:var(--text-muted);line-height:1.7}.demo-hint strong{color:var(--text)}.demo-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem;margin:.55rem 0}.demo-buttons button{border:none;background:#dbeafe;color:#1d4ed8;border-radius:7px;padding:.45rem;font-size:.72rem;font-weight:800;cursor:pointer}code{background:#e2e8f0;padding:.1rem .4rem;border-radius:4px;color:#0C447C}.w-full{width:100%}
</style>
