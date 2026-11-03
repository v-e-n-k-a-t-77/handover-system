import { useAuth } from './store'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function api(path, { method = 'GET', body } = {}) {
  const token = useAuth.getState().token
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (res.status === 401 && token) useAuth.getState().logout()
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
  return data
}