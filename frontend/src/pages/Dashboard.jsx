import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productosAPI, rolesAPI, usuariosAPI } from '../api/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const StatCard = ({ icon, label, value, color, to }) => (
  <Link to={to} className={`card flex items-center gap-4 hover:shadow-md transition-shadow border-l-4 ${color}`}>
    <div className="text-4xl">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value ?? '—'}</p>
    </div>
  </Link>
)

const RoleBadge = ({ rol }) => {
  const map = { Admin:'badge-admin', Gerente:'badge-gerente', Empleado:'badge-empleado', Auditor:'badge-auditor' }
  return <span className={map[rol] || 'badge-auditor'}>{rol}</span>
}

export default function Dashboard() {
  const { user, isAdmin, isAuditor } = useAuth()
  const [productos, setProductos] = useState([])
  const [roles,     setRoles]     = useState([])
  const [usuarios,  setUsuarios]  = useState([])

  useEffect(() => {
    productosAPI.list().then(r=>setProductos(r.data.productos)).catch(()=>{})
    rolesAPI.list().then(r=>setRoles(r.data.roles)).catch(()=>{})
    if (isAdmin()) usuariosAPI.list().then(r=>setUsuarios(r.data.usuarios)).catch(()=>{})
  }, [])

  const totalStock   = productos.reduce((a,p)=>a+p.stock,0)
  const premium      = productos.filter(p=>p.es_premium).length
  const sinStock     = productos.filter(p=>p.stock===0).length

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          ¡Buenos días, {user?.nombre_completo?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          {' · '}Tienda: <span className="text-brand font-medium">{user?.tienda_id ? `ID ${user.tienda_id}` : 'Todas'}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📦" label="Total Productos"    value={productos.length}  color="border-blue-500"   to="/productos" />
        <StatCard icon="🏷️" label="Productos Premium" value={premium}            color="border-yellow-500" to="/productos" />
        <StatCard icon="📉" label="Sin Stock"          value={sinStock}           color="border-red-500"    to="/productos" />
        <StatCard icon="🔢" label="Unidades Totales"  value={totalStock}         color="border-green-500"  to="/productos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Últimos productos */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">📦 Últimos Productos</h2>
            <Link to="/productos" className="text-sm text-brand hover:underline">Ver todos →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th">Nombre</th>
                  <th className="th">Precio</th>
                  <th className="th">Stock</th>
                  <th className="th">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productos.slice(0,6).map(p=>(
                  <tr key={p.id} className="tr-hover">
                    <td className="td font-medium">{p.nombre}</td>
                    <td className="td">S/ {parseFloat(p.precio).toFixed(2)}</td>
                    <td className="td">
                      <span className={`font-semibold ${p.stock===0?'text-red-600':p.stock<5?'text-orange-500':'text-green-600'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="td">
                      {p.es_premium && <span className="badge-premium">⭐ Premium</span>}
                      {p.stock === 0 && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Sin stock</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productos.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Sin productos registrados aún</p>}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-5">
          {/* Roles */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">🔑 Roles del Sistema</h2>
              {isAdmin() && <Link to="/roles" className="text-sm text-brand hover:underline">Gestionar</Link>}
            </div>
            <div className="space-y-2">
              {roles.map(r=>(
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <RoleBadge rol={r.nombre} />
                  <span className="text-xs text-gray-400 truncate max-w-[140px]">{r.descripcion}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Acceso rápido */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3">⚡ Acceso Rápido</h2>
            <div className="space-y-2">
              <Link to="/productos" className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <span className="text-xl">➕</span> Agregar producto
              </Link>
              {isAdmin() && (
                <Link to="/usuarios" className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <span className="text-xl">👤</span> Gestionar usuarios ({usuarios.length})
                </Link>
              )}
              {(isAdmin()||isAuditor()) && (
                <Link to="/auditoria" className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <span className="text-xl">📋</span> Ver log de auditoría
                </Link>
              )}
              <Link to="/perfil" className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <span className="text-xl">🔐</span> Configurar MFA
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
