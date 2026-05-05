import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
    warn:    (msg) => addToast(msg, 'warn'),
  }

  const icons  = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' }
  const colors = {
    success: 'bg-green-50 border-green-400 text-green-800',
    error:   'bg-red-50 border-red-400 text-red-800',
    info:    'bg-blue-50 border-blue-400 text-blue-800',
    warn:    'bg-yellow-50 border-yellow-400 text-yellow-800',
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id}
               className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg animate-pulse-once ${colors[t.type]}`}>
            <span className="text-lg">{icons[t.type]}</span>
            <p className="text-sm font-medium">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
