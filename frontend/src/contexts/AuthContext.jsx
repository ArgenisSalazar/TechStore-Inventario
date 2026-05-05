import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  const login = useCallback((userData, jwt) => {
    setUser(userData)
    setToken(jwt)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', jwt)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }, [])

  const hasRole  = (...roles) => roles.some(r => user?.roles?.includes(r))
  const isAdmin  = () => hasRole('Admin')
  const isGerente= () => hasRole('Admin', 'Gerente')
  const isAuditor= () => hasRole('Admin', 'Auditor')

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, isAdmin, isGerente, isAuditor }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
