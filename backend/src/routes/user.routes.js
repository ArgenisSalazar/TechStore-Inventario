// =============================================
// Rutas: Usuarios + Asignación de Roles
// =============================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const {
  getUsuarios, getUsuarioById, updateUsuario, deleteUsuario, assignRol, removeRol,
} = require('../controllers/user.controller');

// Solo Admin puede listar todos los usuarios
router.get('/',    authenticate, requireRole('Admin'), getUsuarios);
router.get('/:id', authenticate,                       getUsuarioById);

// Editar: Admin edita cualquiera; el propio usuario puede editar su perfil
router.put('/:id', authenticate, updateUsuario);

// Solo Admin puede eliminar usuarios
router.delete('/:id', authenticate, requireRole('Admin'), deleteUsuario);

// Asignación de roles (solo Admin)
router.post('/:id/roles',             authenticate, requireRole('Admin'), assignRol);
router.delete('/:id/roles/:rol_id',   authenticate, requireRole('Admin'), removeRol);

module.exports = router;
