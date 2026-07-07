import {
  applyClientFilters,
  buildSyntheticResource,
  normalizeRequest,
  transformResponse,
} from '@/shared/services/apiAdapter.js'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://flowqueue-backend-production.up.railway.app/api/v1'

function getAuthToken() {
  const directToken = localStorage.getItem('fq_token')
  if (directToken) return directToken

  try {
    return JSON.parse(localStorage.getItem('fq_user') || '{}')?.token ?? null
  } catch (_) {
    return null
  }
}

async function request(path, options = {}) {
  const normalized = normalizeRequest(path, options)

  if (normalized.syntheticResource) {
    return buildSyntheticResource(normalized.syntheticResource, request)
  }

  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const requestOptions = {
    ...options,
    headers,
  }

  if (normalized.body) {
    requestOptions.body = JSON.stringify(normalized.body)
  } else if ('body' in requestOptions) {
    delete requestOptions.body
  }

  const res = await fetch(`${BASE_URL}${normalized.path}`, requestOptions)

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
  const data = text ? JSON.parse(text) : null
  const transformed = transformResponse(data, normalized.path)
  return applyClientFilters(transformed, normalized.filters)
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
