// =============================================
// Middleware ABAC - Attribute-Based Access Control
// Verifica acceso granular a productos según atributos
// =============================================

const { checkPolicy } = require('../utils/policy-engine');
const pool = require('../config/database');

/**
 * checkProductAccess(action, getFields?)
 *
 * Verifica si el usuario puede ejecutar la acción sobre un producto.
 * Para UPDATE/DELETE/SELECT_ONE carga el producto desde BD.
 *
 * @param {string} action     - 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
 * @param {Function} getFields - Función que extrae los campos del req (para UPDATE)
 */
const checkProductAccess = (action, getFields = null) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      // Obtener el rol primario del usuario
      const userRoles = user.roles || [];
      const primaryRole = userRoles[0];

      if (!primaryRole) {
        return res.status(403).json({ error: 'Usuario sin rol asignado' });
      }

      let resourceData = {};

      // Para operaciones sobre un producto existente, cargar sus datos
      if (['UPDATE', 'DELETE', 'SELECT'].includes(action) && req.params.id) {
        const result = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }

        req.producto = result.rows[0];
        resourceData = result.rows[0];
      }

      // Para INSERT, los datos vienen del body
      if (action === 'INSERT') {
        resourceData = req.body;
      }

      // Extraer campos afectados (para UPDATE)
      const fields = getFields ? getFields(req) : null;

      // Evaluar política
      const allowed = checkPolicy(primaryRole, action, user, resourceData, fields);

      if (!allowed) {
        // Guardar intento denegado en audit log
        await pool.query(
          `INSERT INTO audit_log (usuario_id, usuario_email, accion, recurso, recurso_id, detalles, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            user.id,
            user.email,
            `DENY_${action}`,
            'productos',
            req.params.id || null,
            JSON.stringify({ rol: primaryRole, campos: fields, recurso: resourceData }),
            req.ip,
          ]
        ).catch(() => {}); // No fallar si el log falla

        return res.status(403).json({
          error: 'Permiso denegado',
          message: `El rol '${primaryRole}' no puede realizar ${action} en este producto`,
          detalle: getDetalle(primaryRole, action, resourceData),
        });
      }

      next();
    } catch (error) {
      console.error('Error en middleware ABAC:', error);
      res.status(500).json({ error: 'Error verificando permisos de acceso' });
    }
  };
};

// Mensaje descriptivo para el rechazo
function getDetalle(role, action, resource) {
  if (action === 'DELETE' && role === 'Empleado') return 'Los empleados no pueden eliminar productos';
  if (action === 'DELETE' && role === 'Gerente' && resource.es_premium) return 'No puedes eliminar productos premium';
  if (action === 'INSERT' && role === 'Empleado' && resource.es_premium) return 'Los empleados no pueden crear productos premium';
  if (action === 'UPDATE' && role === 'Empleado') return 'Los empleados solo pueden actualizar el campo stock';
  if (action === 'UPDATE' && role === 'Gerente') return 'Los gerentes no pueden modificar la categoría o productos de otras tiendas';
  if (role === 'Auditor') return 'Los auditores solo tienen acceso de lectura';
  return 'No tienes permiso para esta operación';
}

module.exports = { checkProductAccess };
