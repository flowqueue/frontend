<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/shared/services/http.js'

const router = useRouter()
const form = ref({ nombre: '', dni: '', email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function register() {
  error.value = ''
  if (!form.value.nombre || !form.value.dni || !form.value.email || !form.value.password) {
    error.value = 'Completa todos los campos.'
    return
  }
  loading.value = true
  try {
    await http.post('/usuarios', { ...form.value, rol: 'citizen', sedeId: 1 })
    router.push('/login')
  } finally { loading.value = false }
}
</script>

<template>
  <div class="register-page">
    <section class="register-card">
      <div class="logo"><div>FQ</div><span>FlowQueue</span></div>
      <h1>Crear cuenta ciudadana</h1>
      <p>Regístrate para generar tickets virtuales y consultar tu cola en tiempo real.</p>
      <form @submit.prevent="register">
        <input v-model="form.nombre" placeholder="Nombre completo" />
        <input v-model="form.dni" placeholder="DNI" maxlength="8" />
        <input v-model="form.email" type="email" placeholder="Correo electrónico" />
        <input v-model="form.password" type="password" placeholder="Contraseña" />
        <span v-if="error" class="error">{{ error }}</span>
        <button class="btn btn-primary btn-lg w-full" :disabled="loading">{{ loading ? 'Creando...' : 'Crear cuenta' }}</button>
      </form>
      <button class="link-btn" @click="router.push('/login')">Ya tengo una cuenta</button>
    </section>
  </div>
</template>

<style scoped>
.register-page{min-height:100vh;background:#f1f5f9;display:grid;place-items:center;padding:1.5rem}.register-card{width:100%;max-width:460px;background:white;border:1px solid var(--border);box-shadow:var(--shadow-md);border-radius:18px;padding:2rem}.logo{display:flex;align-items:center;gap:.6rem;margin-bottom:1.2rem}.logo div{width:38px;height:38px;border-radius:9px;background:#1d6fe9;color:#fff;font-weight:900;display:grid;place-items:center}.logo span{font-weight:900;color:#0C447C}h1{font-size:1.5rem;margin-bottom:.4rem}p{color:var(--text-muted);font-size:.9rem;line-height:1.6;margin-bottom:1.2rem}form{display:flex;flex-direction:column;gap:.8rem}input{border:1.5px solid var(--border);border-radius:9px;padding:.75rem .9rem;font-size:.9rem;outline:none}input:focus{border-color:#1d6fe9;box-shadow:0 0 0 3px rgba(29,111,233,.1)}.error{color:#b91c1c;background:#fee2e2;border-radius:8px;padding:.55rem .75rem;font-size:.8rem}.link-btn{width:100%;border:none;background:transparent;color:#1d6fe9;font-weight:800;margin-top:1rem;cursor:pointer}.w-full{width:100%}
</style>
