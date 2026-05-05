// =============================================
// Motor de Políticas ABAC - TechStore
// Attribute-Based Access Control
// =============================================

/**
 * Políticas de acceso a recursos por rol y acción.
 * Cada función recibe (user, resource, fields) y retorna boolean.
 *
 * user: { id, tienda_id, roles[] }
 * resource: datos del recurso (producto)
 * fields: array de campos afectados en UPDATE
 */
const POLICIES = {
  productos: {
    // ──── SELECT ────────────────────────────────────────────
    SELECT: {
      Admin:    (user, resource) => true,
      Gerente:  (user, resource) => !resource.tienda_id || Number(user.tienda_id) === Number(resource.tienda_id),
      Empleado: (user, resource) => !resource.tienda_id || Number(user.tienda_id) === Number(resource.tienda_id),
      Auditor:  (user, resource) => true,
    },

    // ──── INSERT ────────────────────────────────────────────
    INSERT: {
      Admin:    (user, resource) => true,
      Gerente:  (user, resource) => Number(user.tienda_id) === Number(resource.tienda_id),
      Empleado: (user, resource) =>
        Number(user.tienda_id) === Number(resource.tienda_id) && !resource.es_premium,
      Auditor:  (user, resource) => false,
    },

    // ──── UPDATE ────────────────────────────────────────────
    UPDATE: {
      Admin:    (user, resource, fields) => true,
      Gerente:  (user, resource, fields) => {
        if (Number(user.tienda_id) !== Number(resource.tienda_id)) return false;
        if (fields && fields.includes('categoria')) return false; // No puede cambiar categoría
        return true;
      },
      Empleado: (user, resource, fields) => {
        if (Number(user.tienda_id) !== Number(resource.tienda_id)) return false;
        if (!fields) return false;
        const permitidos = ['stock']; // Solo puede actualizar stock
        return fields.every(f => permitidos.includes(f));
      },
      Auditor:  (user, resource, fields) => false,
    },

    // ──── DELETE ────────────────────────────────────────────
    DELETE: {
      Admin:    (user, resource) => true,
      Gerente:  (user, resource) =>
        Number(user.tienda_id) === Number(resource.tienda_id) && !resource.es_premium,
      Empleado: (user, resource) => false,
      Auditor:  (user, resource) => false,
    },
  },
};

/**
 * Evalúa si un rol puede realizar una acción sobre un recurso
 * @param {string} roleName - Nombre del rol: 'Admin', 'Gerente', etc.
 * @param {string} action   - 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
 * @param {object} user     - Datos del usuario autenticado
 * @param {object} resource - Datos del recurso afectado
 * @param {string[]} fields - Campos afectados (solo para UPDATE)
 * @returns {boolean}
 */
const checkPolicy = (roleName, action, user, resource = {}, fields = null) => {
  const resourcePolicies = POLICIES['productos'];
  if (!resourcePolicies) return false;

  const actionPolicies = resourcePolicies[action];
  if (!actionPolicies) return false;

  const rolePolicy = actionPolicies[roleName];
  if (typeof rolePolicy !== 'function') return false;

  return rolePolicy(user, resource, fields);
};

module.exports = { checkPolicy, POLICIES };
