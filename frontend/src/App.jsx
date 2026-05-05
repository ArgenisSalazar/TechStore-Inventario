import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login      from './pages/Login.jsx'
import Register   from './pages/Register.jsx'
import Dashboard  from './pages/Dashboard.jsx'
import Products   from './pages/Products.jsx'
import Users      from './pages/Users.jsx'
import Roles      from './pages/Roles.jsx'
import AuditLog   from './pages/AuditLog.jsx'
import Profile    from './pages/Profile.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/productos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/perfil"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="/usuarios"
        element={<ProtectedRoute roles={['Admin']}><Users /></ProtectedRoute>} />
      <Route path="/roles"
        element={<ProtectedRoute roles={['Admin']}><Roles /></ProtectedRoute>} />
      <Route path="/auditoria"
        element={<ProtectedRoute roles={['Admin','Auditor']}><AuditLog /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
