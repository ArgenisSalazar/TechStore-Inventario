// =============================================
// Middleware RBAC - Role-Based Access Control
// Verifica que el usuario tenga el rol requerido
// =============================================

/**
 * requireRole(...roles)
 * Uso: router.post('/ruta', authenticate, requireRole('Admin'), controller)
 *
 * @param  {...string} roles - Roles permitidos (al menos uno debe coincidir)
 * @returns Express middleware
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `Tu rol (${userRoles.join(', ')}) no tiene permiso para esta acción. Se requiere: ${roles.join(' o ')}`,
      });
    }

    next();
  };
};

/**
 * logAction - Middleware de auditoría (se usa después de validar permisos)
 * Registra en consola la acción del usuario (en producción iría a BD)
 */
const logAction = (action, resource) => {
  return (req, res, next) => {
    const user = req.user;
    console.log(`[AUDIT] ${new Date().toISOString()} | Usuario: ${user?.email} | Rol: ${user?.roles?.join(',')} | Acción: ${action} ${resource} | IP: ${req.ip}`);
    next();
  };
};

module.exports = { requireRole, logAction };
