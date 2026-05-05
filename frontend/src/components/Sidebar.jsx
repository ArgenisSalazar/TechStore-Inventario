import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

const NavItem = ({ to, icon, label, end = false }) => (
  <NavLink to={to} end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-white/15 text-white shadow-sm'
          : 'text-blue-100 hover:bg-white/10 hover:text-white'
      }`
    }>
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
)

export default function Sidebar() {
  const { user, logout, isAdmin, isAuditor } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const roleBadge = {
    Admin: 'bg-red-500',
    Gerente: 'bg-orange-500',
    Empleado: 'bg-green-500',
    Auditor: 'bg-blue-400',
  }
  const primaryRole = user?.roles?.[0] || ''
  const badgeColor  = roleBadge[primaryRole] || 'bg-gray-500'

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gradient-to-b from-brand-dark to-brand text-white">
      {/* Logo */}
      <div className="flex flex-col items-center py-8 px-4 border-b border-white/10">
        <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-lg">
          🏪
        </div>
        <h1 className="text-lg font-bold tracking-wide">TechStore</h1>
        <p className="text-blue-200 text-xs mt-0.5">Sistema de Inventario</p>
      </div>

      {/* Usuario */}
      <div className="flex items-center gap-3 mx-4 my-4 p-3 bg-white/10 rounded-xl">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {user?.nombre_completo?.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate">{user?.nombre_completo}</p>
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full text-white font-medium ${badgeColor}`}>
            {primaryRole}
          </span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 pb-4 space-y-1">
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest px-4 mb-2 mt-2">Principal</p>
        <NavItem to="/"           end icon="📊" label="Dashboard" />
        <NavItem to="/productos"       icon="📦" label="Productos" />

        {isAdmin() && (
          <>
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest px-4 mb-2 mt-4">Administración</p>
            <NavItem to="/usuarios" icon="👥" label="Usuarios" />
            <NavItem to="/roles"    icon="🔑" label="Roles" />
          </>
        )}

        {(isAdmin() || isAuditor()) && (
          <>
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest px-4 mb-2 mt-4">Auditoría</p>
            <NavItem to="/auditoria" icon="📋" label="Log de Auditoría" />
          </>
        )}

        <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest px-4 mb-2 mt-4">Cuenta</p>
        <NavItem to="/perfil" icon="⚙️" label="Mi Perfil / MFA" />
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-200 hover:bg-red-600/30 hover:text-white transition-all">
          <span className="text-lg">🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
