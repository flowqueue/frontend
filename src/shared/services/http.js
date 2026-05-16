const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (ANON_KEY) {
    headers.apikey = ANON_KEY
    headers.Authorization = `Bearer ${ANON_KEY}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body?.message || body?.error || message
    } catch (_) {}
    throw new Error(message)
  }

  if (res.status === 204) return null

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const http = {
  get: (path) => request(path),
  post: (path, body) => request(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Prefer': 'return=representation' },
  }),
  patch: (path, body) => request(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Prefer': 'return=representation' },
  }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
