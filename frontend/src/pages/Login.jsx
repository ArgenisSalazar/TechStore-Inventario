import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'

export default function Login() {
  const [step, setStep]         = useState('login')   // 'login' | 'mfa'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const toast     = useToast()
  const navigate  = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login({ email, password })
      if (data.mfa_required) {
        setTempToken(data.temp_token)
        setStep('mfa')
        toast.info('Ingresa el código de Google Authenticator')
      } else {
        login(data.user, data.token)
        toast.success(`¡Bienvenido, ${data.user.nombre_completo}!`)
        navigate('/')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error al iniciar sesión')
    } finally { setLoading(false) }
  }

  const handleMFA = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.verifyMFA({ totp_code: totpCode }, tempToken)
      login(data.user, data.token)
      toast.success(`¡Bienvenido, ${data.user.nombre_completo}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Código MFA inválido')
      setTotpCode('')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-brand-dark via-brand to-primary-700 p-12 text-white">
        <div>
          <div className="flex items-center gap-3 text-2xl font-bold">
            <span className="text-4xl">🏪</span> TechStore
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Sistema de Gestión<br />de Inventario
          </h2>
          <p className="text-blue-200 text-lg">
            Controla tu inventario con seguridad robusta:<br />
            RBAC, ABAC y MFA integrados.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[['🔐','JWT + MFA'],['👥','Roles (RBAC)'],['🏷️','Atributos (ABAC)'],['🐳','Docker']].map(([i,l])=>(
            <div key={l} className="flex items-center gap-2 text-sm text-blue-100">
              <span className="text-xl">{i}</span> {l}
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">

          {step === 'login' ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl text-white text-3xl mb-4 shadow-lg">🏪</div>
                <h1 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h1>
                <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Correo electrónico</label>
                  <input type="email" className="input" placeholder="correo@techstore.com"
                    value={email} onChange={e=>setEmail(e.target.value)} required autoFocus />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input pr-10"
                      placeholder="••••••••" value={password}
                      onChange={e=>setPassword(e.target.value)} required />
                    <button type="button" onClick={()=>setShowPass(s=>!s)}
                      className="absolute right-3 top-2 text-gray-400 hover:text-gray-600">
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="btn-primary w-full py-3 mt-2 text-base flex items-center justify-center gap-2">
                  {loading ? <span className="animate-spin">⏳</span> : '🔓'}
                  {loading ? 'Verificando...' : 'Iniciar Sesión'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                ¿Sin cuenta?{' '}
                <Link to="/register" className="text-brand font-medium hover:underline">Registrarse</Link>
              </p>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-2">👤 Usuarios de prueba</p>
                {[
                  ['admin@techstore.com','Admin@1234','Admin'],
                  ['gerente@techstore.com','Gerente@2026','Gerente'],
                  ['empleado@techstore.com','Empleado@2026','Empleado'],
                  ['auditor@techstore.com','Auditor@2026','Auditor'],
                ].map(([e,p,r])=>(
                  <button key={r} onClick={()=>{setEmail(e);setPassword(p)}}
                    className="text-xs text-left w-full hover:bg-blue-100 rounded px-2 py-1 transition-colors text-blue-800">
                    <span className="font-mono">{e}</span> — {p}
                    <span className="ml-2 text-blue-500">[{r}]</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl text-white text-3xl mb-4 shadow-lg">🔐</div>
                <h1 className="text-2xl font-bold text-gray-800">Verificación MFA</h1>
                <p className="text-gray-500 text-sm mt-1">Abre Google Authenticator e ingresa el código de 6 dígitos</p>
              </div>

              <form onSubmit={handleMFA} className="space-y-5">
                <div>
                  <label className="label">Código TOTP (6 dígitos)</label>
                  <input type="text" inputMode="numeric" maxLength={6}
                    className="input text-center text-3xl font-mono tracking-widest py-4"
                    placeholder="000000" value={totpCode}
                    onChange={e=>setTotpCode(e.target.value.replace(/\D/g,''))} autoFocus required />
                </div>
                <button type="submit" disabled={loading || totpCode.length !== 6}
                  className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
                  {loading ? <span className="animate-spin">⏳</span> : '✅'}
                  {loading ? 'Verificando...' : 'Verificar código'}
                </button>
                <button type="button" onClick={()=>{setStep('login');setTotpCode('')}}
                  className="btn-secondary w-full">← Volver al login</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
