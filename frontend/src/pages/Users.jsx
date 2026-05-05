import { useEffect, useState } from 'react'
import { usuariosAPI, rolesAPI } from '../api/api.js'
import { useToast } from '../contexts/ToastContext.jsx'
import Modal from '../components/Modal.jsx'

const RoleBadge = ({ rol }) => {
  const map={Admin:'badge-admin',Gerente:'badge-gerente',Empleado:'badge-empleado',Auditor:'badge-auditor'}
  return <span className={map[rol]||'badge-auditor'}>{rol}</span>
}

export default function Users() {
  const toast = useToast()
  const [usuarios,  setUsuarios]  = useState([])
  const [roles,     setRoles]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [rolId,     setRolId]     = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([usuariosAPI.list(), rolesAPI.list()])
      .then(([u,r]) => { setUsuarios(u.data.usuarios); setRoles(r.data.roles) })
      .catch(()=>toast.error('Error cargando datos'))
      .finally(()=>setLoading(false))
  }

  useEffect(load, [])

  const openAssign = (u) => { setSelected(u); setRolId(''); setModal('assign') }
  const openDelete = (u) => { setSelected(u); setModal('delete') }
  const openToggle = (u) => { setSelected(u); setModal('toggle') }
  const close = () => { setModal(null); setSelected(null) }

  const handleAssign = async () => {
    if (!rolId) return toast.warn('Selecciona un rol')
    setSaving(true)
    try {
      await usuariosAPI.assignRol(selected.id, { rol_id: parseInt(rolId) })
      toast.success('Rol asignado ✅'); close(); load()
    } catch(err) { toast.error(err.response?.data?.error||'Error asignando rol')
    } finally { setSaving(false) }
  }

  const handleRemoveRol = async (userId, rId) => {
    try {
      await usuariosAPI.removeRol(userId, rId)
      toast.success('Rol removido ✅'); load()
    } catch(err) { toast.error(err.response?.data?.error||'Error removiendo rol') }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await usuariosAPI.delete(selected.id)
      toast.success('Usuario eliminado ✅'); close(); load()
    } catch(err) { toast.error(err.response?.data?.error||'Error eliminando usuario')
    } finally { setSaving(false) }
  }

  const handleToggle = async () => {
    setSaving(true)
    try {
      await usuariosAPI.update(selected.id, { activo: !selected.activo })
      toast.success(`Usuario ${selected.activo?'desactivado':'activado'} ✅`); close(); load()
    } catch(err) { toast.error('Error actualizando usuario')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👥 Usuarios</h1>
        <p className="text-gray-500 text-sm">Gestión de usuarios y asignación de roles (RBAC)</p>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="th">Usuario</th>
                <th className="th">Tienda</th>
                <th className="th">Roles</th>
                <th className="th">MFA</th>
                <th className="th">Estado</th>
                <th className="th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">⏳ Cargando...</td></tr>
              ) : usuarios.map(u => (
                <tr key={u.id} className="tr-hover">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center font-bold text-brand text-sm">
                        {u.nombre_completo?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{u.nombre_completo}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td text-sm text-gray-500">{u.tienda_nombre||'—'}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {(u.roles||[]).map(r=>(
                        <span key={r} className="group relative">
                          <RoleBadge rol={r} />
                          <button onClick={()=>handleRemoveRol(u.id, roles.find(x=>x.nombre===r)?.id)}
                            className="ml-1 text-red-400 hover:text-red-600 text-xs hidden group-hover:inline">×</button>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="td">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.mfa_habilitado?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {u.mfa_habilitado?'🔐 Activo':'○ Inactivo'}
                    </span>
                  </td>
                  <td className="td">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.activo?'bg-blue-100 text-blue-700':'bg-red-100 text-red-600'}`}>
                      {u.activo?'● Activo':'○ Inactivo'}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openAssign(u)} title="Asignar rol"
                        className="text-green-600 hover:bg-green-50 rounded-lg p-1.5 transition-colors text-sm">🔑</button>
                      <button onClick={()=>openToggle(u)} title={u.activo?'Desactivar':'Activar'}
                        className="text-yellow-600 hover:bg-yellow-50 rounded-lg p-1.5 transition-colors text-sm">
                        {u.activo?'🔒':'🔓'}
                      </button>
                      <button onClick={()=>openDelete(u)} title="Eliminar"
                        className="text-red-500 hover:bg-red-50 rounded-lg p-1.5 transition-colors text-sm">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-400">{usuarios.length} usuario(s)</div>
      </div>

      {/* Modal asignar rol */}
      {modal==='assign' && (
        <Modal title={`🔑 Asignar Rol a ${selected?.nombre_completo}`} onClose={close} size="sm">
          <p className="text-sm text-gray-500 mb-3">Roles actuales: {(selected?.roles||[]).join(', ') || 'ninguno'}</p>
          <label className="label">Selecciona el rol a asignar</label>
          <select className="input mb-4" value={rolId} onChange={e=>setRolId(e.target.value)}>
            <option value="">-- Seleccionar rol --</option>
            {roles.filter(r=>!(selected?.roles||[]).includes(r.nombre)).map(r=>(
              <option key={r.id} value={r.id}>{r.nombre} — {r.descripcion}</option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button onClick={close} className="btn-secondary">Cancelar</button>
            <button onClick={handleAssign} disabled={saving||!rolId} className="btn-primary">
              {saving?'Asignando...':'Asignar Rol'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal eliminar */}
      {modal==='delete' && (
        <Modal title="🗑️ Eliminar Usuario" onClose={close} size="sm">
          <p className="text-gray-600">¿Eliminar a <strong>{selected?.nombre_completo}</strong> ({selected?.email})?</p>
          <p className="text-red-600 text-sm mt-2">Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={close} className="btn-secondary">Cancelar</button>
            <button onClick={handleDelete} disabled={saving} className="btn-danger">{saving?'Eliminando...':'Eliminar'}</button>
          </div>
        </Modal>
      )}

      {/* Modal activar/desactivar */}
      {modal==='toggle' && (
        <Modal title={selected?.activo?'🔒 Desactivar Usuario':'🔓 Activar Usuario'} onClose={close} size="sm">
          <p className="text-gray-600">¿{selected?.activo?'Desactivar':'Activar'} la cuenta de <strong>{selected?.nombre_completo}</strong>?</p>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={close} className="btn-secondary">Cancelar</button>
            <button onClick={handleToggle} disabled={saving}
              className={selected?.activo?'btn-danger':'btn-primary'}>
              {saving?'Procesando...':selected?.activo?'Desactivar':'Activar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
