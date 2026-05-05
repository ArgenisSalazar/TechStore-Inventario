import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import Layout from './Layout.jsx'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles.length > 0 && !roles.some(r => user.roles?.includes(r))) {
    return <Navigate to="/" replace />
  }
  return <Layout>{children}</Layout>
}
