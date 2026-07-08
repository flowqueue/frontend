import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi } from '@/iam/infrastructure/auth.api.js'
import { User } from '@/iam/domain/User.js'

function readStoredSession() {
  const raw = localStorage.getItem('fq_user')
  const token = localStorage.getItem('fq_token')

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    const sessionToken = token ?? parsed?.token
    if (!sessionToken) {
      localStorage.removeItem('fq_user')
      localStorage.removeItem('fq_token')
      return null
    }

    return new User({ ...parsed, token: sessionToken })
  } catch (_) {
    localStorage.removeItem('fq_user')
    localStorage.removeItem('fq_token')
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(readStoredSession())

  const isAuthenticated = computed(() => !!user.value?.token)

  async function login(email, password) {
    const data = await loginApi(email, password)
    user.value = new User(data)
    localStorage.setItem('fq_user', JSON.stringify(user.value))
    if (user.value.token) localStorage.setItem('fq_token', user.value.token)
    return user.value
  }

  async function register(payload) {
    const data = await registerApi(payload)
    user.value = new User(data)
    localStorage.setItem('fq_user', JSON.stringify(user.value))
    if (user.value.token) localStorage.setItem('fq_token', user.value.token)
    return user.value
  }

  function logout() {
    user.value = null
    localStorage.removeItem('fq_user')
    localStorage.removeItem('fq_token')
  }

  return { user, isAuthenticated, login, register, logout }
})
