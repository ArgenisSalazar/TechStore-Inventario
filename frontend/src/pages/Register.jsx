import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api/api.js'
import { useToast } from '../contexts/ToastContext.jsx'

const TIENDAS = [
  { id: 1, nombre: 'TechStore Lima Centro' },
  { id: 2, nombre: 'TechStore Miraflores' },
  { id: 3, nombre: 'TechStore Arequipa' },
]

const rules = [
  { test: v => v.length >= 8,           label: 'Mínimo 8 caracteres' },
  { test: v => /[A-Z]/.test(v),         label: '1 letra mayúscula' },
  { test: v => /\d/.test(v),            label: '1 número' },
  { test: v => /[@$!%*?&._#-]/.test(v), label: '1 carácter especial' },
]

export default function Register() {
  const [form, setForm] = useState({ email:'', password:'', nombre_completo:'', tienda_id:'' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.register({ ...form, tienda_id: form.tienda_id || null })
      toast.success('¡Cuenta creada! Ahora puedes iniciar sesión')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.requisitos || 'Error al registrarse')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark via-brand to-primary-700 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand rounded-2xl text-3xl mb-3">🏪</div>
          <h1 className="text-2xl font-bold text-gray-800">Crear Cuenta</h1>
          <p className="text-gray-500 text-sm">TechStore Inventory System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre completo</label>
            <input className="input" placeholder="Juan Pérez" value={form.nombre_completo}
              onChange={e=>set('nombre_completo',e.target.value)} required />
          </div>
          <div>
            <label className="label">Correo electrónico</label>
            <input type="email" className="input" placeholder="correo@empresa.com"
              value={form.email} onChange={e=>set('email',e.target.value)} required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <input type={showPass?'text':'password'} className="input pr-10"
                placeholder="••••••••" value={form.password}
                onChange={e=>set('password',e.target.value)} required />
              <button type="button" onClick={()=>setShowPass(s=>!s)}
                className="absolute right-3 top-2 text-gray-400">
                {showPass?'🙈':'👁️'}
              </button>
            </div>
            {/* Indicadores de seguridad */}
            {form.password && (
              <div className="grid grid-cols-2 gap-1 mt-2">
                {rules.map(r=>(
                  <div key={r.label} className={`flex items-center gap-1 text-xs ${r.test(form.password)?'text-green-600':'text-gray-400'}`}>
                    <span>{r.test(form.password)?'✅':'○'}</span> {r.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Tienda asignada</label>
            <select className="input" value={form.tienda_id} onChange={e=>set('tienda_id',e.target.value)}>
              <option value="">-- Seleccionar tienda --</option>
              {TIENDAS.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2">
            {loading?<span className="animate-spin">⏳</span>:'👤'}
            {loading?'Registrando...':'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand font-medium hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
