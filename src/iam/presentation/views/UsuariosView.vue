<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/shared/components/AppLayout.vue'
import { http } from '@/shared/services/http.js'

const usuarios = ref([])
const sedes = ref([])
const mostradores = ref([])
const loading = ref(true)
const search = ref('')
const roleFilter = ref('todos')
const saving = ref(false)
const error = ref('')

const form = ref({ nombre: '', email: '', password: '123456', rol: 'operator', sedeId: '', mostradorId: '' })

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const [u, s, m] = await Promise.all([http.get('/usuarios'), http.get('/sedes'), http.get('/mostradores')])
    usuarios.value = u
    sedes.value = s
    mostradores.value = m
    if (!form.value.sedeId && s.length) form.value.sedeId = s[0].id
    if (!form.value.mostradorId && m.length) form.value.mostradorId = m[0].id
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  return usuarios.value.filter(u => {
    const matchesSearch = !q || u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchesRole = roleFilter.value === 'todos' || u.rol === roleFilter.value
    return matchesSearch && matchesRole
  })
})

const roleLabels = { operator: 'Operador', supervisor: 'Supervisor', admin: 'Admin', citizen: 'Ciudadano' }
const roleBadges = { operator: 'badge-blue', supervisor: 'badge-green', admin: 'badge-dark', citizen: 'badge-orange' }

function sedeName(id) { return sedes.value.find(s => String(s.id) === String(id))?.nombre ?? 'Sin sede' }
function mostradorName(id) {
  const m = mostradores.value.find(m => String(m.id) === String(id))
  return m ? `Ventanilla ${m.numero}` : 'Sin mostrador'
}

async function createUser() {
  error.value = ''
  if (!form.value.nombre || !form.value.email || !form.value.password) {
    error.value = 'Completa nombre, correo y contraseña.'
    return
  }
  saving.value = true
  try {
    const payload = {
      nombre: form.value.nombre.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      rol: form.value.rol,
      sedeId: Number(form.value.sedeId),
      mostradorId: form.value.rol === 'operator' ? Number(form.value.mostradorId) : null,
    }
    await http.post('/usuarios', payload)
    form.value = { nombre: '', email: '', password: '123456', rol: 'operator', sedeId: sedes.value[0]?.id ?? '', mostradorId: mostradores.value[0]?.id ?? '' }
    await loadData()
  } finally {
    saving.value = false
  }
}

async function deleteUser(user) {
  if (!confirm(`¿Eliminar a ${user.nombre}?`)) return
  await http.delete(`/usuarios/${user.id}`)
  await loadData()
}
</script>

<template>
  <AppLayout title="Usuarios" subtitle="Administración de operadores y supervisores">
    <div class="users-layout">
      <section class="card form-card">
        <p class="eyebrow">IAM</p>
        <h2>Nuevo usuario</h2>
        <p class="hint">Registra operadores para ventanillas o supervisores para una sede.</p>

        <form class="user-form" @submit.prevent="createUser">
          <label>Nombre completo<input v-model="form.nombre" placeholder="Nombre del usuario" /></label>
          <label>Correo<input v-model="form.email" type="email" placeholder="usuario@flowqueue.pe" /></label>
          <label>Contraseña<input v-model="form.password" type="password" /></label>
          <label>Rol
            <select v-model="form.rol">
              <option value="operator">Operador</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </label>
          <label>Sede
            <select v-model="form.sedeId">
              <option v-for="s in sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </label>
          <label v-if="form.rol === 'operator'">Mostrador
            <select v-model="form.mostradorId">
              <option v-for="m in mostradores" :key="m.id" :value="m.id">Ventanilla {{ m.numero }} · Sede {{ m.sedeId }}</option>
            </select>
          </label>
          <p v-if="error" class="form-error">{{ error }}</p>
          <button class="btn btn-primary w-full" :disabled="saving">{{ saving ? 'Guardando...' : 'Crear usuario' }}</button>
        </form>
      </section>

      <section class="card table-card">
        <div class="toolbar">
          <div>
            <p class="eyebrow">Equipo FlowQueue</p>
            <h2>Usuarios registrados</h2>
          </div>
          <span class="badge badge-dark">{{ filteredUsers.length }} usuarios</span>
        </div>

        <div class="filters-row">
          <input v-model="search" placeholder="Buscar por nombre o correo..." />
          <select v-model="roleFilter">
            <option value="todos">Todos los roles</option>
            <option value="operator">Operadores</option>
            <option value="supervisor">Supervisores</option>
            <option value="citizen">Ciudadanos</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div v-if="loading" class="loading-screen"><div class="spinner"></div><p>Cargando usuarios...</p></div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Sede</th><th>Mostrador</th><th>Acciones</th></tr></thead>
            <tbody>
              <tr v-for="u in filteredUsers" :key="u.id">
                <td><strong>{{ u.nombre }}</strong><br><span class="td-muted">{{ u.email }}</span></td>
                <td><span class="badge" :class="roleBadges[u.rol] ?? 'badge-gray'">{{ roleLabels[u.rol] ?? u.rol }}</span></td>
                <td class="td-muted">{{ sedeName(u.sedeId) }}</td>
                <td class="td-muted">{{ u.rol === 'operator' ? mostradorName(u.mostradorId) : 'No aplica' }}</td>
                <td><button class="pill-danger" @click="deleteUser(u)">Eliminar</button></td>
              </tr>
              <tr v-if="!filteredUsers.length"><td colspan="5" class="empty-cell">No hay usuarios con esos filtros</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.users-layout { display: grid; grid-template-columns: 330px 1fr; gap: 1rem; align-items: start; }
.form-card, .table-card { padding: 1.25rem; }
.eyebrow { font-size: .7rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: .08em; }
h2 { font-size: 1.15rem; margin: .2rem 0; }
.hint { color: var(--text-muted); font-size: .85rem; line-height: 1.55; margin-bottom: 1rem; }
.user-form { display: flex; flex-direction: column; gap: .8rem; }
label { display: flex; flex-direction: column; gap: .35rem; font-size: .78rem; font-weight: 700; color: var(--text); }
input, select { width: 100%; border: 1.5px solid var(--border); border-radius: 10px; padding: .6rem .75rem; font-size: .86rem; color: var(--text); background: #fff; outline: none; }
input:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(12,68,124,.1); }
.form-error { background: #fee2e2; color: #b91c1c; padding: .55rem .7rem; border-radius: 8px; font-size: .78rem; }
.toolbar { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: 1rem; }
.filters-row { display: grid; grid-template-columns: 1fr 220px; gap: .75rem; margin-bottom: 1rem; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
.data-table thead tr { background: #1e293b; }
.data-table th { padding: .7rem .85rem; text-align: left; font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; }
.data-table td { padding: .75rem .85rem; border-bottom: 1px solid var(--border); }
.td-muted { color: var(--text-muted); font-size: .8rem; }
.pill-danger { border: 1px solid #fca5a5; background: #fee2e2; color: #b91c1c; border-radius: 999px; padding: .32rem .75rem; font-size: .72rem; font-weight: 700; cursor: pointer; }
.empty-cell { text-align: center; padding: 2.5rem; color: var(--text-muted); }
.loading-screen { min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-muted); }
.spinner { width: 34px; height: 34px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media(max-width:1050px){ .users-layout { grid-template-columns: 1fr; } .filters-row { grid-template-columns: 1fr; } }
</style>
