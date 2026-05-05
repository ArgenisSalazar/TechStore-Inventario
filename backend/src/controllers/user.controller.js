// =============================================
// Controller: Usuarios + Asignación de Roles
// =============================================

const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// GET /usuarios
const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.nombre_completo, u.tienda_id, u.mfa_habilitado,
              u.activo, u.fecha_creacion, t.nombre AS tienda_nombre,
              COALESCE(json_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL), '[]') AS roles
       FROM usuarios u
       LEFT JOIN tiendas t ON t.id = u.tienda_id
       LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
       LEFT JOIN roles r ON r.id = ur.rol_id
       GROUP BY u.id, t.nombre
       ORDER BY u.id`
    );
    res.json({ usuarios: result.rows, total: result.rowCount });
  } catch (error) {
    console.error('[USUARIOS] Error en getUsuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /usuarios/:id
const getUsuarioById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.nombre_completo, u.tienda_id, u.mfa_habilitado,
              u.activo, u.fecha_creacion, t.nombre AS tienda_nombre,
              COALESCE(json_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL), '[]') AS roles
       FROM usuarios u
       LEFT JOIN tiendas t ON t.id = u.tienda_id
       LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
       LEFT JOIN roles r ON r.id = ur.rol_id
       WHERE u.id = $1
       GROUP BY u.id, t.nombre`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[USUARIOS] Error en getUsuarioById:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PUT /usuarios/:id  (Admin puede editar cualquiera, usuario puede editarse a sí mismo)
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, tienda_id, activo, password } = req.body;
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('Admin');

    // No-Admin solo puede editarse a sí mismo
    if (!isAdmin && Number(req.user.id) !== Number(id)) {
      return res.status(403).json({ error: 'Solo puedes editar tu propio perfil' });
    }

    const existing = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    let hashedPassword = null;
    if (password) {
      const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._#-])[A-Za-z\d@$!%*?&._#-]{8,}$/;
      if (!regex.test(password)) {
        return res.status(400).json({ error: 'La nueva contraseña no cumple los requisitos de seguridad' });
      }
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const result = await pool.query(
      `UPDATE usuarios SET
         nombre_completo = COALESCE($1, nombre_completo),
         tienda_id       = COALESCE($2, tienda_id),
         activo          = COALESCE($3, activo),
         password        = COALESCE($4, password)
       WHERE id = $5 RETURNING id, email, nombre_completo, tienda_id, activo`,
      [nombre_completo || null, tienda_id || null, isAdmin ? activo : null, hashedPassword, id]
    );

    res.json({ message: 'Usuario actualizado', usuario: result.rows[0] });
  } catch (error) {
    console.error('[USUARIOS] Error en updateUsuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// DELETE /usuarios/:id  (Solo Admin)
const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }
    const existing = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ message: `Usuario '${existing.rows[0].email}' eliminado exitosamente` });
  } catch (error) {
    console.error('[USUARIOS] Error en deleteUsuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /usuarios/:id/roles  (Solo Admin - asignar rol)
const assignRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol_id } = req.body;
    if (!rol_id) return res.status(400).json({ error: 'rol_id es requerido' });

    const user = await pool.query('SELECT id FROM usuarios WHERE id = $1', [id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const rol = await pool.query('SELECT * FROM roles WHERE id = $1', [rol_id]);
    if (rol.rows.length === 0) return res.status(404).json({ error: 'Rol no encontrado' });

    await pool.query(
      `INSERT INTO usuario_roles (usuario_id, rol_id, asignado_por)
       VALUES ($1, $2, $3) ON CONFLICT (usuario_id, rol_id) DO NOTHING`,
      [id, rol_id, req.user.id]
    );

    res.json({ message: `Rol '${rol.rows[0].nombre}' asignado al usuario` });
  } catch (error) {
    console.error('[USUARIOS] Error en assignRol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// DELETE /usuarios/:id/roles/:rol_id  (Solo Admin - quitar rol)
const removeRol = async (req, res) => {
  try {
    const { id, rol_id } = req.params;
    const result = await pool.query(
      'DELETE FROM usuario_roles WHERE usuario_id = $1 AND rol_id = $2 RETURNING *',
      [id, rol_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }
    res.json({ message: 'Rol removido del usuario exitosamente' });
  } catch (error) {
    console.error('[USUARIOS] Error en removeRol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getUsuarios, getUsuarioById, updateUsuario, deleteUsuario, assignRol, removeRol };
