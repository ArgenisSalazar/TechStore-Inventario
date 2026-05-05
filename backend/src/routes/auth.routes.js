// =============================================
// Rutas: Autenticación
// =============================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {
  register, login, verifyMFA, setupMFA, activateMFA, me,
} = require('../controllers/auth.controller');

// Rutas públicas
router.post('/register',      register);       // Registro de usuario
router.post('/login',         login);          // Login (devuelve JWT o temp_token si MFA activo)
router.post('/mfa/verify',    verifyMFA);      // Verificar código TOTP con temp_token

// Rutas protegidas (requieren JWT completo)
router.get('/me',             authenticate, me);            // Perfil del usuario actual
router.post('/mfa/setup',     authenticate, setupMFA);     // Generar QR para configurar TOTP
router.post('/mfa/activate',  authenticate, activateMFA);  // Activar MFA con primer código

module.exports = router;
