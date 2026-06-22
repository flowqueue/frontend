import { http } from '@/shared/services/http.js'

export async function loginApi(email, password) {
  try {
    // 1. Hacemos un POST a la ruta correcta enviando el body que espera el backend
    const user = await http.post('/auth/sign-in', {
      email: email,
      password: password
    });

    // 2. Si el backend responde con un 200 OK, significa que las credenciales son válidas.
    // Asumiendo que tu servicio 'http' devuelve directamente la data (el JSON de respuesta),
    // simplemente retornamos el usuario. Si usas Axios sin interceptores, podría ser 'return user.data'.
    return user;

  } catch (error) {
    // 3. Si el backend responde con un error (ej. 401 Unauthorized o 400 Bad Request),
    // el servicio HTTP arrojará una excepción. La capturamos aquí.
    throw new Error('Credenciales incorrectas');
  }
}