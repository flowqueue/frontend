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
  if (!email.value || !password.value) {
    error.value = 'Completa todos los campos.'
    return
  }

  loading.value = true
  try {
    const user = await auth.login(email.value, password.value)
    router.push(routeByRole(user))
  } catch (_) {
    error.value = 'Credenciales incorrectas. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div class="login-page">
    <section class="login-visual" aria-label="Estado operativo de FlowQueue">
      <div class="brand-lockup">
        <div class="brand-mark">FQ</div>
        <div>
          <strong>FlowQueue</strong>
          <span>Turnos virtuales para atencion publica</span>
        </div>
      </div>

      <div class="signal-board">
        <div class="board-head">
          <span class="live-dot"></span>
          Monitor en vivo
        </div>
        <div class="turn-row active">
          <span>A-047</span>
          <strong>En atencion</strong>
          <small>Ventanilla 1</small>
        </div>
        <div class="turn-row">
          <span>B-023</span>
          <strong>12 min</strong>
          <small>3 personas delante</small>
        </div>
        <div class="turn-row">
          <span>C-156</span>
          <strong>Notificado</strong>
          <small>Acercarse a sede</small>
        </div>
      </div>

      <div class="impact-strip">
        <div><strong>100%</strong><span>web</span></div>
        <div><strong>3</strong><span>roles</span></div>
        <div><strong>24/7</strong><span>consulta</span></div>
      </div>
    </section>

    <section class="login-card">
      <div class="login-header">
        <span class="eyebrow">Acceso seguro</span>
        <h1>Ingresa a tu panel</h1>
        <p>Consulta tu turno, atiende una ventanilla o supervisa una sede desde una sola experiencia.</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <label>
          Correo electronico
          <input v-model="email" type="email" placeholder="tu@flowqueue.pe" autocomplete="email" />
        </label>
        <label>
          Contrasena
          <input v-model="password" type="password" placeholder="Minimo 6 caracteres" autocomplete="current-password" />
        </label>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading">
          {{ loading ? 'Validando...' : 'Ingresar' }}
        </button>
      </form>

      <div class="signup-panel">
        <div>
          <strong>No tienes cuenta?</strong>
          <span>Crea una cuenta ciudadana y genera tu primer ticket virtual.</span>
        </div>
        <button type="button" @click="router.push('/register')">Registrarme</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(360px, 1.1fr) minmax(360px, 460px);
  gap: 1.25rem;
  padding: 1.25rem;
  background:
    linear-gradient(120deg, rgba(25, 103, 210, 0.12), transparent 38%),
    linear-gradient(180deg, #f8fafc, #e9eff5);
}

.login-visual,
.login-card {
  border: 1px solid rgba(255, 255, 255, 0.66);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
}

.login-visual {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: calc(100vh - 2.5rem);
  padding: 2rem;
  color: #fff;
  background:
    linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
    linear-gradient(135deg, #0d1b2a 0%, #164c63 54%, #0f9f6e 120%);
  background-size: 28px 28px, 28px 28px, auto;
  animation:
    visual-in 0.72s cubic-bezier(0.2, 0.8, 0.2, 1) both,
    grid-drift 18s linear infinite;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  animation: rise-in 0.5s ease 0.08s both;
}

.brand-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--primary), var(--teal));
  font-weight: 950;
}

.brand-lockup strong,
.brand-lockup span {
  display: block;
}

.brand-lockup strong {
  font-size: 1.15rem;
}

.brand-lockup span {
  margin-top: 0.1rem;
  color: #c8d7e8;
  font-size: 0.8rem;
  font-weight: 700;
}

.signal-board {
  align-self: center;
  width: min(560px, 100%);
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(5, 13, 26, 0.46);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(14px);
  animation:
    board-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.18s both,
    board-breathe 4.8s ease-in-out 1.1s infinite;
}

.board-head {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.8rem;
  color: #dce8f5;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #12b76a;
  box-shadow: 0 0 0 5px rgba(18, 183, 106, 0.16);
  animation: live-pulse 1.6s ease-in-out infinite;
}

.turn-row {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 90px 1fr 150px;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  animation: row-in 0.46s ease both;
}

.turn-row:nth-child(2) {
  animation-delay: 0.3s;
}

.turn-row:nth-child(3) {
  animation-delay: 0.42s;
}

.turn-row:nth-child(4) {
  animation-delay: 0.54s;
}

.turn-row span {
  color: #8fd9ff;
  font-size: 1rem;
  font-weight: 950;
}

.turn-row strong {
  color: #fff;
}

.turn-row small {
  color: #bdd0df;
  text-align: right;
}

.turn-row.active {
  border-radius: 6px;
  border-top: 0;
  background: rgba(18, 183, 106, 0.14);
}

.turn-row.active::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(143, 217, 255, 0.18), transparent);
  transform: translateX(-115%);
  animation: row-scan 2.8s ease-in-out 1s infinite;
  pointer-events: none;
}

.impact-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.impact-strip div {
  padding: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  animation: metric-in 0.48s ease both;
}

.impact-strip div:nth-child(1) {
  animation-delay: 0.64s;
}

.impact-strip div:nth-child(2) {
  animation-delay: 0.76s;
}

.impact-strip div:nth-child(3) {
  animation-delay: 0.88s;
}

.impact-strip strong,
.impact-strip span {
  display: block;
}

.impact-strip strong {
  font-size: 1.25rem;
}

.impact-strip span {
  color: #c8d7e8;
  font-size: 0.75rem;
  font-weight: 800;
}

.login-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2.4rem;
  background: rgba(255, 255, 255, 0.94);
  animation: card-in 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) 0.08s both;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 0.7rem;
  color: var(--primary);
  font-size: 0.74rem;
  font-weight: 950;
  text-transform: uppercase;
}

.login-header h1 {
  margin-bottom: 0.55rem;
  color: var(--ink);
  font-size: 2rem;
  line-height: 1.05;
}

.login-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.55;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.6rem;
}

.login-header,
.login-form label,
.login-form .btn,
.signup-panel {
  animation: form-in 0.46s ease both;
}

.login-header {
  animation-delay: 0.18s;
}

.login-form label:nth-child(1) {
  animation-delay: 0.3s;
}

.login-form label:nth-child(2) {
  animation-delay: 0.4s;
}

.login-form .btn {
  animation-delay: 0.5s;
}

label {
  color: var(--ink-soft);
  font-size: 0.84rem;
  font-weight: 850;
}

input {
  width: 100%;
  margin-top: 0.45rem;
  padding: 0.8rem 0.9rem;
  border: 1.5px solid var(--border);
  border-radius: 6px;
  outline: none;
  background: #fff;
  color: var(--text);
  font-size: 0.95rem;
}

input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(25, 103, 210, 0.1);
}

.error-msg {
  padding: 0.65rem 0.75rem;
  border: 1px solid #fda29b;
  border-radius: 6px;
  background: #fff1f0;
  color: var(--danger);
  font-size: 0.84rem;
  font-weight: 800;
}

.signup-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.25rem;
  padding: 1rem;
  border: 1px solid #c7d7fe;
  border-radius: 8px;
  background: #eff6ff;
  animation-delay: 0.62s;
}

.signup-panel strong,
.signup-panel span {
  display: block;
}

.signup-panel strong {
  color: var(--ink);
  font-size: 0.8rem;
  font-weight: 950;
}

.signup-panel span {
  margin-top: 0.18rem;
  color: var(--text-muted);
  font-size: 0.76rem;
  line-height: 1.35;
}

.signup-panel button {
  flex-shrink: 0;
  min-height: 34px;
  padding: 0 0.85rem;
  border: 1px solid var(--primary);
  border-radius: 6px;
  background: #fff;
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;
}

.signup-panel button:hover {
  background: var(--primary);
  color: #fff;
}

@keyframes visual-in {
  from {
    opacity: 0;
    transform: translateX(-18px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes grid-drift {
  from {
    background-position: 0 0, 0 0, 0 0;
  }

  to {
    background-position: 56px 56px, 56px 56px, 0 0;
  }
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes board-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes board-breathe {
  0%,
  100% {
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
  }

  50% {
    box-shadow: 0 28px 95px rgba(18, 183, 166, 0.18);
  }
}

@keyframes live-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 5px rgba(18, 183, 106, 0.16);
  }

  50% {
    transform: scale(1.24);
    box-shadow: 0 0 0 9px rgba(18, 183, 106, 0.05);
  }
}

@keyframes row-in {
  from {
    opacity: 0;
    transform: translateX(-14px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes row-scan {
  0%,
  42% {
    transform: translateX(-115%);
  }

  78%,
  100% {
    transform: translateX(115%);
  }
}

@keyframes metric-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateX(18px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes form-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 920px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-visual {
    min-height: 420px;
  }
}

@media (max-width: 560px) {
  .login-page {
    padding: 0;
  }

  .login-visual {
    display: none;
  }

  .login-card {
    min-height: 100vh;
    border: 0;
    border-radius: 0;
    padding: 1.4rem;
  }

  .signup-panel {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
