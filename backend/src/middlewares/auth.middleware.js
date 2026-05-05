// =============================================
// Middleware de Autenticación JWT
// Verifica el token Bearer en cada request
// =============================================

const jwt = require('jsonwebtoken');

/**
 * Middleware: authenticate
 * Valida el JWT y agrega req.user con los datos del usuario autenticado.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso denegado',
      message: 'Se requiere token de autenticación (Bearer <token>)',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Bloquear tokens temporales de MFA (solo paso previo)
    if (decoded.mfa_pending) {
      return res.status(401).json({
        error: 'Autenticación incompleta',
        message: 'Debes completar la verificación MFA en POST /auth/mfa/verify',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', message: 'Inicia sesión nuevamente' });
    }
    return res.status(401).json({ error: 'Token inválido', message: error.message });
  }
};

module.exports = { authenticate };
