import { http } from '@/shared/services/http.js'

function normalizeAuthenticatedResponse(payload) {
  const user = payload?.user ?? payload

  return {
    ...user,
    token: payload?.token ?? user?.token ?? null,
  }
}

export async function loginApi(email, password) {
  try {
    const response = await http.post('/auth/sign-in', {
      email,
      password,
    })

    return normalizeAuthenticatedResponse(response)
  } catch (_) {
    throw new Error('Credenciales incorrectas')
  }
}

export async function registerApi({ nombre, dni, email, password, role = 'citizen' }) {
  const response = await http.post('/auth/sign-up', {
    fullName: nombre,
    email,
    password,
    role,
    documentNumber: dni,
  })

  return normalizeAuthenticatedResponse(response)
}
