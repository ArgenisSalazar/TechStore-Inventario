import { useEffect, useState } from 'react'
import { rolesAPI } from '../api/api.js'
import { useToast } from '../contexts/ToastContext.jsx'
import Modal from '../components/Modal.jsx'

export default function Roles() {
  const toast = useToast()
  const [roles,   setRoles]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [selected,setSelected]= useState(null)
  const [form,    setForm]    = useState({ nombre:'', descripcion:'' })
  const [saving,  setSaving]  = useState(false)

  const colors = { Admin:'badge-admin', Gerente:'badge-gerente', Empleado:'badge-empleado', Auditor:'badge-auditor' }

  const load = () => {
    setLoading(true)
    rolesAPI.list().then(r=>setRoles(r.data.roles)).catch(()=>toast.error('Error cargando roles')).finally(()=>setLoading(false))
  }
  useEffect(load, [])

  const openCreate = () => { setForm({nombre:'',descripcion:''}); setModal('create') }
  const openEdit   = (r) => { setSelected(r); setForm({nombre:r.nombre,descripcion:r.descripcion||''}); setModal('edit') }
  const openDelete = (r) => { setSelected(r); setModal('delete') }
  const close      = () => { setModal(null); setSelected(null) }

  const handleSave = async () => {
    if (!form.nombre.trim()) return toast.warn('El nombre del rol es requerido')
    setSaving(true)
    try {
      if (modal==='create') await rolesAPI.create(form)
      else                  await rolesAPI.update(selected.id, form)
      toast.success(modal==='create'?'Rol creado ✅':'Rol actualizado ✅')
      close(); load()
    } catch(err) { toast.error(err.response?.data?.error||'Error guardando rol')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await rolesAPI.delete(selected.id)
      toast.success('Rol eliminado ✅'); close(); load()
    } catch(err) { toast.error(err.response?.data?.message||'No se puede eliminar: tiene usuarios asignados')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🔑 Roles del Sistema</h1>
          <p className="text-gray-500 text-sm">Control de Acceso Basado en Roles (RBAC)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">➕ Nuevo Rol</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {['Admin','Gerente','Empleado','Auditor'].map(n => {
          const r = roles.find(x=>x.nombre===n)
          const desc = {Admin:'Acceso total',Gerente:'Su tienda',Empleado:'Consulta/Stock',Auditor:'Solo lectura'}
          const icon = {Admin:'👑',Gerente:'🏬',Empleado:'👤',Auditor:'🔍'}
          return (
            <div key={n} className="card border-t-4 border-brand hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{icon[n]}</span>
                <span className={colors[n]||'badge-auditor'}>{n}</span>
              </div>
              <p className="text-xs text-gray-500">{r?.descripcion||desc[n]}</p>
            </div>
          )
        })}
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="th w-12">#</th>
              <th className="th">Nombre</th>
              <th className="th">Descripción</th>
              <th className="th">Creado</th>
              <th className="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">⏳ Cargando...</td></tr>
            ) : roles.map(r=>(
              <tr key={r.id} className="tr-hover">
                <td className="td text-gray-400 text-xs">{r.id}</td>
                <td className="td"><span className={colors[r.nombre]||'badge-auditor'}>{r.nombre}</span></td>
                <td className="td text-gray-500 text-sm">{r.descripcion||'—'}</td>
                <td className="td text-xs text-gray-400">{new Date(r.fecha_creacion).toLocaleDateString('es-PE')}</td>
                <td className="td">
                  <div className="flex justify-end gap-2">
                    <button onClick={()=>openEdit(r)} className="text-blue-600 hover:bg-blue-50 rounded-lg p-1.5 text-sm">✏️</button>
                    <button onClick={()=>openDelete(r)} className="text-red-500 hover:bg-red-50 rounded-lg p-1.5 text-sm">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'➕ Nuevo Rol':'✏️ Editar Rol'} onClose={close} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">Nombre del rol *</label>
              <input className="input" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Supervisor" />
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea className="input" rows={3} value={form.descripcion}
                onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))}
                placeholder="Descripción de los permisos de este rol..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={close} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving?'Guardando...':'💾 Guardar'}
            </button>
          </div>
        </Modal>
      )}

      {modal==='delete' && (
        <Modal title="🗑️ Eliminar Rol" onClose={close} size="sm">
          <p className="text-gray-600">¿Eliminar el rol <strong>"{selected?.nombre}"</strong>?</p>
          <p className="text-sm text-orange-600 mt-2">⚠️ No se puede eliminar si hay usuarios asignados a este rol.</p>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={close} className="btn-secondary">Cancelar</button>
            <button onClick={handleDelete} disabled={saving} className="btn-danger">{saving?'Eliminando...':'Eliminar'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
