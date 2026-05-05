// =============================================
// Controller: Roles (RBAC - CRUD completo)
// Solo Admin puede crear/editar/eliminar roles
// =============================================

const pool = require('../config/database');

// GET /roles
const getRoles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY id');
    res.json({ roles: result.rows, total: result.rowCount });
  } catch (error) {
    console.error('[ROLES] Error en getRoles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /roles/:id
const getRolById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rol no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[ROLES] Error en getRolById:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /roles   (Solo Admin)
const createRol = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El campo nombre es requerido' });

    const exists = await pool.query('SELECT id FROM roles WHERE nombre = $1', [nombre]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Ya existe un rol con ese nombre' });

    const result = await pool.query(
      'INSERT INTO roles (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion || null]
    );
    res.status(201).json({ message: 'Rol creado exitosamente', rol: result.rows[0] });
  } catch (error) {
    console.error('[ROLES] Error en createRol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PUT /roles/:id   (Solo Admin)
const updateRol = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Rol no encontrado' });

    const result = await pool.query(
      `UPDATE roles SET
         nombre = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion)
       WHERE id = $3 RETURNING *`,
      [nombre || null, descripcion || null, id]
    );
    res.json({ message: 'Rol actualizado', rol: result.rows[0] });
  } catch (error) {
    console.error('[ROLES] Error en updateRol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// DELETE /roles/:id   (Solo Admin)
const deleteRol = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el rol existe
    const existing = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Rol no encontrado' });

    // Verificar que no tiene usuarios asignados
    const inUse = await pool.query('SELECT COUNT(*) FROM usuario_roles WHERE rol_id = $1', [id]);
    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar el rol',
        message: `Existen ${inUse.rows[0].count} usuario(s) con este rol asignado`,
      });
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    res.json({ message: `Rol '${existing.rows[0].nombre}' eliminado exitosamente` });
  } catch (error) {
    console.error('[ROLES] Error en deleteRol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getRoles, getRolById, createRol, updateRol, deleteRol };
