// =============================================
// Rutas: Roles (RBAC)
// =============================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const {
  getRoles, getRolById, createRol, updateRol, deleteRol,
} = require('../controllers/role.controller');

// Todos los autenticados pueden ver los roles
router.get('/',    authenticate,                        getRoles);
router.get('/:id', authenticate,                        getRolById);

// Solo Admin puede crear, editar y eliminar roles
router.post('/',    authenticate, requireRole('Admin'), createRol);
router.put('/:id',  authenticate, requireRole('Admin'), updateRol);
router.delete('/:id', authenticate, requireRole('Admin'), deleteRol);

module.exports = router;
