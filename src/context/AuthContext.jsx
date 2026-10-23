import { createContext, useContext, useMemo, useState } from 'react'
import { changePassword, signIn, signOut } from '../services/authService'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const login = async (values) => { setIsLoading(true); try { const result = await signIn(values); setUser(result.user); return result } finally { setIsLoading(false) } }
  const logout = async () => {
    try { await signOut() } catch { /* Local state is still cleared when an expired session cannot be logged out remotely. */ }
    setUser(null)
  }
  const updatePassword = async (values) => { const result = await changePassword(values); setUser(result.user); return result }
  const value = useMemo(() => ({ user, isLoading, login, logout, updatePassword }), [user, isLoading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
