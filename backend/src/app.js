// =============================================
// TechStore Inventory API - Punto de entrada
// Node.js + Express | Laboratorio 8 - Seguridad
// Autor: Argenis Salazar
// =============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────
// Middlewares globales
// ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requests (simple)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ──────────────────────────────────────────
// Rutas
// ──────────────────────────────────────────
app.use('/auth',      require('./routes/auth.routes'));
app.use('/roles',     require('./routes/role.routes'));
app.use('/usuarios',  require('./routes/user.routes'));
app.use('/productos', require('./routes/product.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: process.env.APP_NAME || 'TechStore API',
    timestamp: new Date().toISOString(),
  });
});

// Ruta raíz - documentación básica de endpoints
app.get('/', (req, res) => {
  res.json({
    app: 'TechStore Inventory API',
    version: '1.0.0',
    autor: 'Argenis Salazar',
    endpoints: {
      auth: {
        'POST /auth/register':     'Registrar nuevo usuario',
        'POST /auth/login':        'Iniciar sesión (retorna JWT o temp_token si MFA)',
        'POST /auth/mfa/verify':   'Verificar código TOTP (con temp_token)',
        'GET  /auth/me':           'Perfil del usuario autenticado',
        'POST /auth/mfa/setup':    'Generar QR para Google Authenticator',
        'POST /auth/mfa/activate': 'Activar MFA con primer código TOTP',
      },
      roles: {
        'GET    /roles':     'Listar roles (todos los autenticados)',
        'GET    /roles/:id': 'Ver rol por ID',
        'POST   /roles':     'Crear rol (solo Admin)',
        'PUT    /roles/:id': 'Editar rol (solo Admin)',
        'DELETE /roles/:id': 'Eliminar rol (solo Admin)',
      },
      usuarios: {
        'GET    /usuarios':                   'Listar usuarios (solo Admin)',
        'GET    /usuarios/:id':               'Ver usuario por ID',
        'PUT    /usuarios/:id':               'Editar usuario',
        'DELETE /usuarios/:id':               'Eliminar usuario (solo Admin)',
        'POST   /usuarios/:id/roles':         'Asignar rol (solo Admin)',
        'DELETE /usuarios/:id/roles/:rol_id': 'Quitar rol (solo Admin)',
      },
      productos: {
        'GET    /productos':          'Listar productos (filtrado por rol/tienda)',
        'GET    /productos/:id':      'Ver producto (ABAC)',
        'POST   /productos':          'Crear producto (ABAC)',
        'PUT    /productos/:id':      'Actualizar producto (ABAC)',
        'DELETE /productos/:id':      'Eliminar producto (ABAC)',
        'GET    /productos/audit-log':'Log de auditoría (Admin/Auditor)',
      },
    },
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: `Ruta '${req.method} ${req.path}' no encontrada` });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ──────────────────────────────────────────
// Iniciar servidor
// ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║       TechStore Inventory API             ║');
  console.log('║  Laboratorio 8 - Seguridad en la Nube     ║');
  console.log(`║  Servidor corriendo en: http://localhost:${PORT} ║`);
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
