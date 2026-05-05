import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({ baseURL: API_URL })

// Adjuntar token automáticamente
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Redirigir a login si el token expira
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────
export const authAPI = {
  login:        (data) => api.post('/auth/login', data),
  register:     (data) => api.post('/auth/register', data),
  verifyMFA:    (data, tempToken) => api.post('/auth/mfa/verify', data, { headers: { Authorization: `Bearer ${tempToken}` } }),
  setupMFA:     ()     => api.post('/auth/mfa/setup'),
  activateMFA:  (data) => api.post('/auth/mfa/activate', data),
  me:           ()     => api.get('/auth/me'),
}

// ── Roles ───────────────────────────────────
export const rolesAPI = {
  list:    ()         => api.get('/roles'),
  get:     (id)       => api.get(`/roles/${id}`),
  create:  (data)     => api.post('/roles', data),
  update:  (id, data) => api.put(`/roles/${id}`, data),
  delete:  (id)       => api.delete(`/roles/${id}`),
}

// ── Usuarios ────────────────────────────────
export const usuariosAPI = {
  list:       ()             => api.get('/usuarios'),
  get:        (id)           => api.get(`/usuarios/${id}`),
  update:     (id, data)     => api.put(`/usuarios/${id}`, data),
  delete:     (id)           => api.delete(`/usuarios/${id}`),
  assignRol:  (id, data)     => api.post(`/usuarios/${id}/roles`, data),
  removeRol:  (id, rolId)    => api.delete(`/usuarios/${id}/roles/${rolId}`),
}

// ── Productos ───────────────────────────────
export const productosAPI = {
  list:    ()         => api.get('/productos'),
  get:     (id)       => api.get(`/productos/${id}`),
  create:  (data)     => api.post('/productos', data),
  update:  (id, data) => api.put(`/productos/${id}`, data),
  delete:  (id)       => api.delete(`/productos/${id}`),
  auditLog:()         => api.get('/productos/audit-log'),
}

export default api
