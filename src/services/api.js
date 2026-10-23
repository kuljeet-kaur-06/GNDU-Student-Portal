const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) throw new Error('API base URL is not configured.')
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${response.status}).`)
  }
  return response.status === 204 ? null : response.json()
}
