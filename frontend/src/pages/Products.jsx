import { useEffect, useState } from 'react'
import { productosAPI } from '../api/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'
import Modal from '../components/Modal.jsx'

const TIENDAS = [{id:1,nombre:'Lima Centro'},{id:2,nombre:'Miraflores'},{id:3,nombre:'Arequipa'}]
const CATEGORIAS = ['Laptops','Computadoras','Smartphones','Tablets','Accesorios','Monitores','Audio','Gaming']

const initForm = { nombre:'', descripcion:'', precio:'', stock:'', categoria:'', tienda_id:'', es_premium:false }

export default function Products() {
  const { user, hasRole } = useAuth()
  const toast = useToast()
  const [productos, setProductos] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null) // null | 'create' | 'edit' | 'delete'
  const [selected,  setSelected]  = useState(null)
  const [form,      setForm]      = useState(initForm)
  const [search,    setSearch]    = useState('')
  const [saving,    setSaving]    = useState(false)

  const isAdmin   = hasRole('Admin')
  const isGerente = hasRole('Admin','Gerente')
  const isEmpleado= hasRole('Empleado') && !isAdmin && !isGerente
  const canCreate = isAdmin || isGerente || hasRole('Empleado')
  const canDelete = isAdmin || isGerente

  const load = () => {
    setLoading(true)
    productosAPI.list()
      .then(r => setProductos(r.data.productos))
      .catch(() => toast.error('Error cargando productos'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => { setForm({...initForm, tienda_id: user.tienda_id||''}); setModal('create') }
  const openEdit   = (p)  => { setSelected(p); setForm({...p, tienda_id:p.tienda_id||'', es_premium:p.es_premium}); setModal('edit') }
  const openDelete = (p)  => { setSelected(p); setModal('delete') }
  const closeModal = ()   => { setModal(null); setSelected(null); setForm(initForm) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, precio: parseFloat(form.precio)||0, stock: parseInt(form.stock)||0 }
      if (modal === 'create') await productosAPI.create(payload)
      else                    await productosAPI.update(selected.id, isEmpleado ? {stock:payload.stock} : payload)
      toast.success(modal==='create' ? 'Producto creado ✅' : 'Producto actualizado ✅')
      closeModal(); load()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await productosAPI.delete(selected.id)
      toast.success('Producto eliminado ✅')
      closeModal(); load()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.detalle || 'No tienes permiso para eliminar')
    } finally { setSaving(false) }
  }

  const filtered = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📦 Productos</h1>
          <p className="text-gray-500 text-sm">Gestión de inventario con control ABAC</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            ➕ Nuevo Producto
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="card mb-5 !p-3">
        <input className="input" placeholder="🔍 Buscar por nombre o categoría..."
          value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {/* Tabla */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="th">Producto</th>
                <th className="th">Categoría</th>
                <th className="th">Precio</th>
                <th className="th">Stock</th>
                <th className="th">Tienda</th>
                <th className="th">Estado</th>
                <th className="th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">⏳ Cargando productos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No hay productos registrados</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="tr-hover">
                  <td className="td">
                    <div className="font-medium text-gray-900">{p.nombre}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[200px]">{p.descripcion}</div>
                  </td>
                  <td className="td">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">{p.categoria||'—'}</span>
                  </td>
                  <td className="td font-semibold text-gray-900">S/ {parseFloat(p.precio).toFixed(2)}</td>
                  <td className="td">
                    <span className={`font-bold text-sm ${p.stock===0?'text-red-600':p.stock<5?'text-orange-500':'text-green-600'}`}>
                      {p.stock} uds.
                    </span>
                  </td>
                  <td className="td text-xs text-gray-500">{p.tienda_nombre||`Tienda ${p.tienda_id}`}</td>
                  <td className="td">
                    {p.es_premium
                      ? <span className="badge-premium">⭐ Premium</span>
                      : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">Estándar</span>
                    }
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={()=>openEdit(p)}
                        className="text-blue-600 hover:bg-blue-50 rounded-lg p-1.5 transition-colors text-sm" title="Editar">✏️</button>
                      {canDelete && (
                        <button onClick={()=>openDelete(p)}
                          className="text-red-500 hover:bg-red-50 rounded-lg p-1.5 transition-colors text-sm" title="Eliminar">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} producto(s) mostrado(s)
          {user?.roles?.includes('Empleado') && !isAdmin && !isGerente && (
            <span className="ml-3 text-orange-600 font-medium">ℹ️ Como Empleado, solo puedes editar el stock</span>
          )}
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'➕ Nuevo Producto':'✏️ Editar Producto'} onClose={closeModal} size="lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nombre del producto *</label>
              <input className="input" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}
                placeholder="Laptop HP 15" disabled={isEmpleado} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Descripción</label>
              <textarea className="input" rows={2} value={form.descripcion}
                onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))}
                placeholder="Descripción opcional..." disabled={isEmpleado} />
            </div>
            <div>
              <label className="label">Precio (S/) *</label>
              <input type="number" step="0.01" className="input" value={form.precio}
                onChange={e=>setForm(f=>({...f,precio:e.target.value}))} placeholder="0.00" disabled={isEmpleado} />
            </div>
            <div>
              <label className="label">Stock *</label>
              <input type="number" className="input" value={form.stock}
                onChange={e=>setForm(f=>({...f,stock:e.target.value}))} placeholder="0" />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="input" value={form.categoria}
                onChange={e=>setForm(f=>({...f,categoria:e.target.value}))} disabled={isEmpleado || (modal==='edit'&&hasRole('Gerente')&&!isAdmin)}>
                <option value="">-- Seleccionar --</option>
                {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
              </select>
              {modal==='edit'&&hasRole('Gerente')&&!isAdmin&&
                <p className="text-xs text-orange-600 mt-1">⚠️ Los gerentes no pueden cambiar la categoría</p>}
            </div>
            <div>
              <label className="label">Tienda *</label>
              <select className="input" value={form.tienda_id}
                onChange={e=>setForm(f=>({...f,tienda_id:e.target.value}))} disabled={!isAdmin||modal==='edit'}>
                <option value="">-- Seleccionar --</option>
                {TIENDAS.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            {isAdmin && (
              <div className="sm:col-span-2 flex items-center gap-3">
                <input type="checkbox" id="premium" checked={form.es_premium}
                  onChange={e=>setForm(f=>({...f,es_premium:e.target.checked}))}
                  className="w-4 h-4 rounded border-gray-300" />
                <label htmlFor="premium" className="text-sm text-gray-700 cursor-pointer">
                  ⭐ Producto Premium (solo Admin puede marcarlo)
                </label>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={closeModal} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving?<span className="animate-spin">⏳</span>:'💾'} {saving?'Guardando...':'Guardar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Eliminar */}
      {modal==='delete' && (
        <Modal title="🗑️ Eliminar Producto" onClose={closeModal} size="sm">
          <p className="text-gray-600 mb-2">¿Seguro que deseas eliminar el producto:</p>
          <p className="font-semibold text-gray-900 mb-1">"{selected?.nombre}"</p>
          {selected?.es_premium && (
            <p className="text-sm text-orange-600 bg-orange-50 rounded-lg p-3 mb-3">
              ⚠️ Este es un producto premium. Solo el Admin puede eliminarlo.
            </p>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={closeModal} className="btn-secondary">Cancelar</button>
            <button onClick={handleDelete} disabled={saving} className="btn-danger flex items-center gap-2">
              {saving?<span className="animate-spin">⏳</span>:'🗑️'} {saving?'Eliminando...':'Sí, eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
