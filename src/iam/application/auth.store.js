import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi } from '@/iam/infrastructure/auth.api.js'
import { User } from '@/iam/domain/User.js'

export const useAuthStore = defineStore('auth', () => {
  const _raw = localStorage.getItem('fq_user')
  const user = ref(_raw ? new User(JSON.parse(_raw)) : null)

  const isAuthenticated = computed(() => !!user.value)

  async function login(email, password) {
    const data = await loginApi(email, password)
    user.value = new User(data)
    localStorage.setItem('fq_user', JSON.stringify(data))
    return user.value
  }

  function logout() {
    user.value = null
    localStorage.removeItem('fq_user')
  }

  return { user, isAuthenticated, login, logout }
})
