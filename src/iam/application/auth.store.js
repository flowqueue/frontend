import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi } from '@/iam/infrastructure/auth.api.js'
import { User } from '@/iam/domain/User.js'

export const useAuthStore = defineStore('auth', () => {
  const _raw = localStorage.getItem('fq_user')
  const user = ref(_raw ? new User(JSON.parse(_raw)) : null)

  const isAuthenticated = computed(() => !!user.value)

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
