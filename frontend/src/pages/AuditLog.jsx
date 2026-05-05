import { useEffect, useState } from 'react'
import { productosAPI } from '../api/api.js'
import { useToast } from '../contexts/ToastContext.jsx'

const ACTION_COLOR = {
  INSERT:       'bg-green-100 text-green-700',
  UPDATE:       'bg-blue-100 text-blue-700',
  UPDATE_STOCK: 'bg-cyan-100 text-cyan-700',
  DELETE:       'bg-red-100 text-red-700',
  DENY_INSERT:  'bg-orange-100 text-orange-700',
  DENY_UPDATE:  'bg-orange-100 text-orange-700',
  DENY_DELETE:  'bg-red-100 text-red-800',
  DENY_SELECT:  'bg-yellow-100 text-yellow-700',
}

export default function AuditLog() {
  const toast = useToast()
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')

  useEffect(() => {
    productosAPI.auditLog()
      .then(r => setLogs(r.data.logs))
      .catch(() => toast.error('Error cargando el log de auditoría'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(l =>
    l.usuario_email?.toLowerCase().includes(filter.toLowerCase()) ||
    l.accion?.toLowerCase().includes(filter.toLowerCase())
  )

  const denied  = logs.filter(l => l.accion?.startsWith('DENY_')).length
  const success = logs.length - denied

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📋 Log de Auditoría</h1>
        <p className="text-gray-500 text-sm">Registro de todas las acciones realizadas y denegadas en el sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-800">{logs.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total registros</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{success}</p>
          <p className="text-sm text-gray-500 mt-1">Acciones exitosas</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-600">{denied}</p>
          <p className="text-sm text-gray-500 mt-1">Accesos denegados</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="card !p-3 mb-5">
        <input className="input" placeholder="🔍 Filtrar por email o acción..."
          value={filter} onChange={e=>setFilter(e.target.value)} />
      </div>

      {/* Tabla */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="th">Fecha</th>
                <th className="th">Usuario</th>
                <th className="th">Acción</th>
                <th className="th">Recurso ID</th>
                <th className="th">Detalles</th>
                <th className="th">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">⏳ Cargando logs...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Sin registros de auditoría</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className={`tr-hover ${l.accion?.startsWith('DENY')?'bg-red-50/30':''}`}>
                  <td className="td text-xs text-gray-500 whitespace-nowrap">
                    {new Date(l.fecha).toLocaleString('es-PE')}
                  </td>
                  <td className="td text-xs text-gray-700">{l.usuario_email||'—'}</td>
                  <td className="td">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLOR[l.accion]||'bg-gray-100 text-gray-600'}`}>
                      {l.accion?.startsWith('DENY')?'🚫':'✅'} {l.accion}
                    </span>
                  </td>
                  <td className="td text-xs text-gray-500 text-center">{l.recurso_id||'—'}</td>
                  <td className="td">
                    {l.detalles ? (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-500 hover:underline">Ver detalles</summary>
                        <pre className="mt-1 bg-gray-50 p-2 rounded text-xs text-gray-600 max-w-xs overflow-auto">
                          {JSON.stringify(l.detalles, null, 2)}
                        </pre>
                      </details>
                    ) : '—'}
                  </td>
                  <td className="td text-xs text-gray-400">{l.ip_address||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-400">
          Mostrando {filtered.length} de {logs.length} registros
        </div>
      </div>
    </div>
  )
}
