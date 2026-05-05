// =============================================
// Rutas: Productos (ABAC)
// =============================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const { checkProductAccess } = require('../middlewares/abac.middleware');
const {
  getProductos, getProductoById, createProducto,
  updateProducto, deleteProducto, getAuditLog,
} = require('../controllers/product.controller');

// GET /productos - SELECT masivo (filtrado por rol en el controller)
router.get('/', authenticate, getProductos);

// GET /productos/audit-log - Solo Admin y Auditor
router.get('/audit-log',
  authenticate,
  requireRole('Admin', 'Auditor'),
  getAuditLog
);

// GET /productos/:id - SELECT individual (ABAC verifica acceso)
router.get('/:id',
  authenticate,
  checkProductAccess('SELECT'),
  getProductoById
);

// POST /productos - INSERT (ABAC verifica tienda y premium)
router.post('/',
  authenticate,
  checkProductAccess('INSERT'),
  createProducto
);

// PUT /productos/:id - UPDATE (ABAC verifica tienda, campos permitidos y categoría)
router.put('/:id',
  authenticate,
  checkProductAccess('UPDATE', (req) => Object.keys(req.body)),
  updateProducto
);

// DELETE /productos/:id - DELETE (ABAC verifica tienda y premium)
router.delete('/:id',
  authenticate,
  checkProductAccess('DELETE'),
  deleteProducto
);

module.exports = router;
