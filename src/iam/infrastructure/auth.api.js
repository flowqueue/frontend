import { http } from '@/shared/services/http.js'

export async function loginApi(email, password) {
    const users = await http.get(`/usuarios?email=eq.${encodeURIComponent(email)}`)
    if (!users.length) throw new Error('Credenciales incorrectas')
    const user = users[0]
    if (String(user.password) !== String(password)) throw new Error('Credenciales incorrectas')
    return user
}
