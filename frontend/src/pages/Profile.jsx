import { useState } from 'react'
import { authAPI } from '../api/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'

export default function Profile() {
  const { user } = useAuth()
  const toast    = useToast()
  const [step,      setStep]      = useState('info')   // info | setup | activate
  const [qrData,    setQrData]    = useState(null)
  const [secret,    setSecret]    = useState('')
  const [totpCode,  setTotpCode]  = useState('')
  const [loading,   setLoading]   = useState(false)

  const handleSetup = async () => {
    setLoading(true)
    try {
      const { data } = await authAPI.setupMFA()
      setQrData(data.qr_code)
      setSecret(data.secret_base32)
      setStep('setup')
      toast.info('Escanea el QR con Google Authenticator')
    } catch(err) { toast.error(err.response?.data?.error||'Error configurando MFA')
    } finally { setLoading(false) }
  }

  const handleActivate = async () => {
    if (totpCode.length !== 6) return toast.warn('El código debe tener 6 dígitos')
    setLoading(true)
    try {
      await authAPI.activateMFA({ totp_code: totpCode })
      toast.success('✅ MFA activado exitosamente. Recarga la página para ver el estado actualizado.')
      setStep('done')
    } catch(err) { toast.error(err.response?.data?.message||'Código inválido')
    } finally { setLoading(false) }
  }

  const roleBadge={Admin:'badge-admin',Gerente:'badge-gerente',Empleado:'badge-empleado',Auditor:'badge-auditor'}

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">⚙️ Mi Perfil</h1>
        <p className="text-gray-500 text-sm">Información de cuenta y configuración de seguridad</p>
      </div>

      {/* Info del usuario */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user?.nombre_completo?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user?.nombre_completo}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex gap-2 mt-1">
              {(user?.roles||[]).map(r=>(
                <span key={r} className={roleBadge[r]||'badge-auditor'}>{r}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Tienda asignada</p>
            <p className="font-semibold">{user?.tienda_id ? `Tienda #${user.tienda_id}` : 'Todas las tiendas'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Estado MFA</p>
            <p className={`font-semibold ${user?.mfa_habilitado?'text-green-600':'text-gray-500'}`}>
              {user?.mfa_habilitado ? '🔐 Habilitado' : '○ No configurado'}
            </p>
          </div>
        </div>
      </div>

      {/* Sección MFA */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">🔐 Autenticación Multifactor (MFA)</h2>
        <p className="text-sm text-gray-500 mb-5">
          Añade una capa extra de seguridad con Google Authenticator (TOTP).
          Una vez activo, necesitarás el código de 6 dígitos cada vez que inicies sesión.
        </p>

        {step === 'info' && (
          <>
            {user?.mfa_habilitado ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-green-800">MFA está activo en tu cuenta</p>
                  <p className="text-sm text-green-600">Puedes reconfigurar escaneando un nuevo QR</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-yellow-800">MFA no está configurado</p>
                  <p className="text-sm text-yellow-600">Se recomienda activarlo para mayor seguridad</p>
                </div>
              </div>
            )}
            <button onClick={handleSetup} disabled={loading}
              className="btn-primary mt-4 flex items-center gap-2">
              {loading?<span className="animate-spin">⏳</span>:'📱'}
              {loading?'Generando QR...':user?.mfa_habilitado?'Reconfigurar MFA':'Configurar Google Authenticator'}
            </button>
          </>
        )}

        {step === 'setup' && (
          <div className="space-y-5">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="font-semibold text-blue-800 mb-2">📱 Instrucciones:</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Abre <strong>Google Authenticator</strong> en tu smartphone</li>
                <li>Toca el ícono <strong>+</strong> → "Escanear código QR"</li>
                <li>Apunta la cámara al código QR de abajo</li>
                <li>Ingresa el código de 6 dígitos que aparece en la app</li>
              </ol>
            </div>
            {qrData && (
              <div className="flex flex-col items-center gap-3 py-4">
                <img src={qrData} alt="QR Code MFA" className="w-52 h-52 rounded-xl shadow-md border-4 border-white" />
                <p className="text-xs text-gray-400">Código secreto (alternativa manual):</p>
                <code className="text-xs bg-gray-100 px-4 py-2 rounded-lg font-mono text-gray-600 break-all">{secret}</code>
              </div>
            )}
            <div>
              <label className="label">Código de verificación (6 dígitos)</label>
              <input type="text" inputMode="numeric" maxLength={6}
                className="input text-center text-2xl font-mono tracking-widest py-4"
                placeholder="000000" value={totpCode}
                onChange={e=>setTotpCode(e.target.value.replace(/\D/g,''))} />
            </div>
            <div className="flex gap-3">
              <button onClick={()=>{setStep('info');setTotpCode('')}} className="btn-secondary">← Volver</button>
              <button onClick={handleActivate} disabled={loading||totpCode.length!==6} className="btn-primary flex-1">
                {loading?'Verificando...':'✅ Activar MFA'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-green-700 mb-2">¡MFA Activado!</h3>
            <p className="text-gray-500 text-sm mb-5">A partir del próximo login necesitarás el código de Google Authenticator.</p>
            <button onClick={()=>setStep('info')} className="btn-primary">Entendido</button>
          </div>
        )}
      </div>
    </div>
  )
}
