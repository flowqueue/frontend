<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/iam/application/auth.store.js'

const router = useRouter()
const auth = useAuthStore()
const form = ref({ nombre: '', dni: '', email: '', password: '', role: 'citizen' })
const loading = ref(false)
const error = ref('')

const roleOptions = [
  {
    value: 'citizen',
    label: 'Ciudadano',
    title: 'Crea tu cuenta ciudadana',
    description: 'Genera tickets virtuales, revisa tu posicion y recibe alertas antes de acercarte a la sede.',
    bullets: [
      'Selecciona institucion, sede y tramite.',
      'Recibe un codigo de turno digital.',
      'Consulta cuantos faltan y cuando acercarte.',
    ],
  },
  {
    value: 'operator',
    label: 'Operador',
    title: 'Crea tu cuenta operativa',
    description: 'Atiende turnos, llama al siguiente ticket y mantiene la ventanilla sincronizada con la cola.',
    bullets: [
      'Gestiona la cola asignada a tu ventanilla.',
      'Cambia estados de atencion en tiempo real.',
      'Consulta alertas operativas de la sede.',
    ],
  },
]

const selectedRole = computed(() => {
  return roleOptions.find(option => option.value === form.value.role) ?? roleOptions[0]
})

const passwordStrength = computed(() => {
  const value = form.value.password
  if (!value) return 'Ingresa una contrasena segura'
  if (value.length < 6) return 'Minimo 6 caracteres'
  if (!/[0-9]/.test(value)) return 'Agrega al menos un numero'
  return 'Lista para crear tu cuenta'
})

function routeByRole(role) {
  return role === 'operator' ? '/operator' : '/citizen'
}

async function register() {
  error.value = ''
  if (!form.value.nombre || !form.value.dni || !form.value.email || !form.value.password) {
    error.value = 'Completa todos los campos.'
    return
  }
  if (form.value.password.length < 6) {
    error.value = 'La contrasena debe tener al menos 6 caracteres.'
    return
  }

  loading.value = true
  try {
    const user = await auth.register(form.value)
    router.push(routeByRole(user.role))
  } catch (_) {
    error.value = 'No se pudo crear la cuenta. Revisa los datos o intenta con otro correo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <section class="register-card">
      <button class="back-link" @click="router.push('/login')">Volver al ingreso</button>

      <div class="logo">
        <div>FQ</div>
        <span>FlowQueue</span>
      </div>

      <h1>{{ selectedRole.title }}</h1>
      <p class="intro">{{ selectedRole.description }}</p>

      <form @submit.prevent="register">
        <div class="role-selector" role="radiogroup" aria-label="Tipo de cuenta">
          <button
            v-for="option in roleOptions"
            :key="option.value"
            type="button"
            :class="{ active: form.role === option.value }"
            role="radio"
            :aria-checked="form.role === option.value"
            @click="form.role = option.value"
          >
            <span>{{ option.value === 'citizen' ? 'C' : 'O' }}</span>
            {{ option.label }}
          </button>
        </div>

        <label>
          Nombre completo
          <input v-model="form.nombre" placeholder="Ej. Mariana Rojas" autocomplete="name" />
        </label>
        <label>
          DNI
          <input v-model="form.dni" placeholder="8 digitos" maxlength="8" inputmode="numeric" />
        </label>
        <label>
          Correo electronico
          <input v-model="form.email" type="email" placeholder="tu@correo.pe" autocomplete="email" />
        </label>
        <label>
          Contrasena
          <input v-model="form.password" type="password" placeholder="Minimo 6 caracteres" autocomplete="new-password" />
        </label>

        <div class="password-hint" :class="{ ready: passwordStrength === 'Lista para crear tu cuenta' }">
          <span></span>
          {{ passwordStrength }}
        </div>

        <span v-if="error" class="error">{{ error }}</span>

        <button class="btn btn-primary btn-lg w-full" :disabled="loading">
          {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>
    </section>

    <aside class="register-aside">
      <span class="aside-kicker">{{ selectedRole.label }}</span>
      <h2>{{ form.role === 'operator' ? 'La cola se mueve desde tu ventanilla.' : 'Tu turno se mueve contigo.' }}</h2>
      <ul>
        <li v-for="item in selectedRole.bullets" :key="item">{{ item }}</li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(360px, 500px) minmax(360px, 1fr);
  background:
    linear-gradient(rgba(16, 24, 40, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 24, 40, 0.035) 1px, transparent 1px),
    #eef2f6;
  background-size: 28px 28px;
  animation: page-grid-drift 20s linear infinite;
}

.register-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2.2rem;
  background: rgba(255, 255, 255, 0.94);
  border-right: 1px solid var(--line-soft);
  animation: register-card-in 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.back-link {
  align-self: flex-start;
  margin-bottom: 1.4rem;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 850;
  cursor: pointer;
  animation: register-item-in 0.42s ease 0.08s both;
}

.back-link:hover {
  color: var(--primary);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1.2rem;
  animation: register-item-in 0.42s ease 0.16s both;
}

.logo div {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--primary), var(--teal));
  color: #fff;
  font-weight: 950;
}

.logo span {
  color: var(--ink);
  font-weight: 950;
}

h1 {
  max-width: 380px;
  margin-bottom: 0.55rem;
  color: var(--ink);
  font-size: 2rem;
  line-height: 1.05;
  animation: register-item-in 0.42s ease 0.24s both;
}

.intro {
  max-width: 400px;
  margin-bottom: 1.35rem;
  color: var(--text-muted);
  font-size: 0.94rem;
  line-height: 1.55;
  animation: register-item-in 0.42s ease 0.32s both;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.role-selector {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  animation: register-item-in 0.42s ease 0.4s both;
}

.role-selector button {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  background: #fff;
  color: var(--ink-soft);
  font-size: 0.82rem;
  font-weight: 900;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.role-selector button span {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #eef2f6;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 950;
}

.role-selector button:hover {
  border-color: #bfdbfe;
  color: var(--primary);
  transform: translateY(-1px);
}

.role-selector button.active {
  border-color: var(--primary);
  background: #eff6ff;
  color: var(--primary);
  box-shadow: 0 10px 22px rgba(25, 103, 210, 0.12);
}

.role-selector button.active span {
  background: var(--primary);
  color: #fff;
}

label {
  color: var(--ink-soft);
  font-size: 0.82rem;
  font-weight: 850;
  animation: register-item-in 0.42s ease both;
}

label:nth-of-type(1) {
  animation-delay: 0.5s;
}

label:nth-of-type(2) {
  animation-delay: 0.58s;
}

label:nth-of-type(3) {
  animation-delay: 0.66s;
}

label:nth-of-type(4) {
  animation-delay: 0.74s;
}

input {
  width: 100%;
  margin-top: 0.38rem;
  padding: 0.76rem 0.85rem;
  border: 1.5px solid var(--border);
  border-radius: 6px;
  outline: none;
  background: #fff;
  color: var(--text);
}

input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(25, 103, 210, 0.1);
}

.password-hint {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.62rem 0.72rem;
  border-radius: 6px;
  background: #fff7ed;
  color: #b45309;
  font-size: 0.8rem;
  font-weight: 850;
  animation: register-item-in 0.42s ease 0.82s both;
}

.password-hint span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  animation: hint-pulse 1.8s ease-in-out infinite;
}

.password-hint.ready {
  background: #ecfdf3;
  color: #087852;
}

form > .btn {
  animation: register-item-in 0.42s ease 0.92s both;
}

.error {
  padding: 0.65rem 0.75rem;
  border: 1px solid #fda29b;
  border-radius: 6px;
  background: #fff1f0;
  color: var(--danger);
  font-size: 0.84rem;
  font-weight: 800;
}

.register-aside {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem;
  color: #fff;
  background:
    linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px),
    linear-gradient(135deg, #101828, #164c63 58%, #0f9f6e);
  background-size: 30px 30px, 30px 30px, auto;
  animation:
    register-aside-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.08s both,
    aside-grid-drift 18s linear infinite;
}

.aside-kicker {
  margin-bottom: 0.8rem;
  color: #8fd9ff;
  font-size: 0.76rem;
  font-weight: 950;
  text-transform: uppercase;
  animation: aside-item-in 0.44s ease 0.3s both;
}

.register-aside h2 {
  max-width: 520px;
  margin-bottom: 1.2rem;
  font-size: clamp(2.2rem, 6vw, 4.6rem);
  line-height: 0.95;
  animation: aside-item-in 0.44s ease 0.4s both;
}

.register-aside ul {
  display: grid;
  max-width: 520px;
  gap: 0.7rem;
  list-style: none;
}

.register-aside li {
  padding: 0.85rem 1rem;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  color: #dce8f5;
  font-weight: 760;
  animation: aside-item-in 0.44s ease both;
}

.register-aside li:nth-child(1) {
  animation-delay: 0.54s;
}

.register-aside li:nth-child(2) {
  animation-delay: 0.66s;
}

.register-aside li:nth-child(3) {
  animation-delay: 0.78s;
}

@keyframes page-grid-drift {
  from {
    background-position: 0 0, 0 0, 0 0;
  }

  to {
    background-position: 56px 56px, 56px 56px, 0 0;
  }
}

@keyframes register-card-in {
  from {
    opacity: 0;
    transform: translateX(-18px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes register-item-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hint-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 currentColor;
  }

  50% {
    transform: scale(1.2);
    box-shadow: 0 0 0 5px transparent;
  }
}

@keyframes register-aside-in {
  from {
    opacity: 0;
    transform: translateX(18px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes aside-grid-drift {
  from {
    background-position: 0 0, 0 0, 0 0;
  }

  to {
    background-position: 60px 60px, 60px 60px, 0 0;
  }
}

@keyframes aside-item-in {
  from {
    opacity: 0;
    transform: translateX(14px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 900px) {
  .register-page {
    grid-template-columns: 1fr;
  }

  .register-aside {
    min-height: 360px;
  }
}

@media (max-width: 560px) {
  .register-card,
  .register-aside {
    padding: 1.3rem;
  }
}
</style>
