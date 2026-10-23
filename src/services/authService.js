import { apiRequest } from './api'

export async function signIn({ identifier, password }) {
  if (!identifier || !password) throw new Error('Enter your university ID and password.')
  return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) })
}

export const signOut = () => apiRequest('/auth/logout', { method: 'POST' })
export const changePassword = (values) => apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(values) })
