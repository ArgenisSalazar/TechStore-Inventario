// =============================================
// Controller: Productos (ABAC completo)
// Las verificaciones de atributos las hace el middleware abac
// =============================================

const pool = require('../config/database');

// Helper: guardar en audit log
const audit = async (userId, email, accion, recursoId, detalles, ip) => {
  try {
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, recurso, recurso_id, detalles, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, email, accion, 'productos', recursoId || null, JSON.stringify(detalles), ip]
    );
  } catch (_) {}
};

// GET /productos   (Admin y Auditor ven todos; Gerente y Empleado solo su tienda)
const getProductos = async (req, res) => {
  try {
    const user = req.user;
    const roles = user.roles || [];
    const isAdminOrAuditor = roles.some(r => ['Admin', 'Auditor'].includes(r));

    let query, params;
    if (isAdminOrAuditor) {
      query = `SELECT p.*, t.nombre AS tienda_nombre FROM productos p
               LEFT JOIN tiendas t ON t.id = p.tienda_id ORDER BY p.id`;
      params = [];
    } else {
      query = `SELECT p.*, t.nombre AS tienda_nombre FROM productos p
               LEFT JOIN tiendas t ON t.id = p.tienda_id
               WHERE p.tienda_id = $1 ORDER BY p.id`;
      params = [user.tienda_id];
    }

    const result = await pool.query(query, params);
    res.json({ productos: result.rows, total: result.rowCount });
  } catch (error) {
    console.error('[PRODUCTOS] Error en getProductos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /productos/:id
const getProductoById = async (req, res) => {
  try {
    // El middleware ABAC ya verificó acceso y cargó req.producto
    const result = await pool.query(
      `SELECT p.*, t.nombre AS tienda_nombre FROM productos p
       LEFT JOIN tiendas t ON t.id = p.tienda_id WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[PRODUCTOS] Error en getProductoById:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /productos
const createProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria, tienda_id, es_premium } = req.body;

    if (!nombre || precio === undefined || !tienda_id) {
      return res.status(400).json({ error: 'nombre, precio y tienda_id son requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nombre, descripcion || null, precio, stock || 0, categoria || null,
       tienda_id, es_premium || false, req.user.id]
    );

    const producto = result.rows[0];
    await audit(req.user.id, req.user.email, 'INSERT', producto.id, { producto }, req.ip);

    res.status(201).json({ message: 'Producto creado exitosamente', producto });
  } catch (error) {
    console.error('[PRODUCTOS] Error en createProducto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// PUT /productos/:id
const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria, es_premium } = req.body;
    const userRoles = req.user.roles || [];
    const isEmpleado = userRoles.includes('Empleado') && !userRoles.includes('Admin');

    // Empleado: solo puede actualizar stock
    if (isEmpleado) {
      if (stock === undefined) {
        return res.status(400).json({ error: 'Como Empleado, solo puedes actualizar el campo stock' });
      }
      const result = await pool.query(
        'UPDATE productos SET stock = $1, fecha_actualizacion = NOW() WHERE id = $2 RETURNING *',
        [stock, id]
      );
      await audit(req.user.id, req.user.email, 'UPDATE_STOCK', id, { stock }, req.ip);
      return res.json({ message: 'Stock actualizado', producto: result.rows[0] });
    }

    // Gerente/Admin: pueden actualizar más campos (categoria restringida para Gerente por middleware)
    const result = await pool.query(
      `UPDATE productos SET
         nombre             = COALESCE($1, nombre),
         descripcion        = COALESCE($2, descripcion),
         precio             = COALESCE($3, precio),
         stock              = COALESCE($4, stock),
         categoria          = COALESCE($5, categoria),
         es_premium         = COALESCE($6, es_premium),
         fecha_actualizacion = NOW()
       WHERE id = $7 RETURNING *`,
      [nombre || null, descripcion || null, precio || null,
       stock !== undefined ? stock : null, categoria || null,
       es_premium !== undefined ? es_premium : null, id]
    );

    await audit(req.user.id, req.user.email, 'UPDATE', id, req.body, req.ip);
    res.json({ message: 'Producto actualizado', producto: result.rows[0] });
  } catch (error) {
    console.error('[PRODUCTOS] Error en updateProducto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// DELETE /productos/:id
const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = req.producto; // ya cargado por middleware ABAC

    await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    await audit(req.user.id, req.user.email, 'DELETE', id, { producto }, req.ip);

    res.json({ message: `Producto '${producto.nombre}' eliminado exitosamente` });
  } catch (error) {
    console.error('[PRODUCTOS] Error en deleteProducto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /productos/audit-log   (Solo Admin y Auditor)
const getAuditLog = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM audit_log ORDER BY fecha DESC LIMIT 100'
    );
    res.json({ logs: result.rows, total: result.rowCount });
  } catch (error) {
    console.error('[PRODUCTOS] Error en getAuditLog:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getProductos, getProductoById, createProducto, updateProducto, deleteProducto, getAuditLog };
