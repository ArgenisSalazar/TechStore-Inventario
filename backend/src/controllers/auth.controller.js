// =============================================
// Controller: Autenticación
// Registro, Login, MFA TOTP, Setup/Activación
// =============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { generateTOTPSecret, verifyTOTP, generateQRCode } = require('../utils/mfa.utils');

// Regex: mínimo 8 chars, 1 mayúscula, 1 número, 1 especial
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._#-])[A-Za-z\d@$!%*?&._#-]{8,}$/;

// ──────────────────────────────────────────
// POST /auth/register
// ──────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, password, nombre_completo, tienda_id } = req.body;

    if (!email || !password || !nombre_completo) {
      return res.status(400).json({ error: 'email, password y nombre_completo son requeridos' });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        error: 'Contraseña insegura',
        requisitos: 'Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&._#-)',
      });
    }

    // Verificar email único
    const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const result = await pool.query(
      `INSERT INTO usuarios (email, password, nombre_completo, tienda_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, nombre_completo, tienda_id, fecha_creacion`,
      [email.toLowerCase(), hashedPassword, nombre_completo, tienda_id || null]
    );

    const newUser = result.rows[0];

    // Asignar rol Empleado por defecto
    const rolResult = await pool.query("SELECT id FROM roles WHERE nombre = 'Empleado'");
    if (rolResult.rows.length > 0) {
      await pool.query(
        'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [newUser.id, rolResult.rows[0].id]
      );
    }

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Rol asignado: Empleado',
      user: newUser,
    });
  } catch (error) {
    console.error('[AUTH] Error en register:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ──────────────────────────────────────────
// POST /auth/login
// ──────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar bloqueo
    if (user.bloqueado_hasta && new Date() < new Date(user.bloqueado_hasta)) {
      const minutos = Math.ceil((new Date(user.bloqueado_hasta) - new Date()) / 60000);
      return res.status(403).json({
        error: 'Cuenta bloqueada temporalmente',
        message: `Intenta nuevamente en ${minutos} minuto(s)`,
      });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Cuenta desactivada. Contacta al administrador' });
    }

    // Verificar contraseña
    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;
      let bloqueadoHasta = null;

      if (nuevosIntentos >= 5) {
        bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000); // Bloqueo 15 min
      }

      await pool.query(
        'UPDATE usuarios SET intentos_fallidos = $1, bloqueado_hasta = $2 WHERE id = $3',
        [nuevosIntentos, bloqueadoHasta, user.id]
      );

      const restantes = 5 - nuevosIntentos;
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: restantes > 0
          ? `Intentos restantes antes del bloqueo: ${restantes}`
          : 'Cuenta bloqueada por 15 minutos',
      });
    }

    // Resetear intentos fallidos
    await pool.query(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
      [user.id]
    );

    // Si MFA está habilitado → emitir token temporal
    if (user.mfa_habilitado) {
      const tempToken = jwt.sign(
        { id: user.id, mfa_pending: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      return res.status(200).json({
        mfa_required: true,
        temp_token: tempToken,
        message: 'Ingresa el código de 6 dígitos de Google Authenticator',
      });
    }

    // Sin MFA → generar JWT completo
    const roles = await getUserRoles(user.id);
    const token = generateJWT(user, roles);

    res.json({
      message: 'Login exitoso',
      token,
      user: { id: user.id, email: user.email, nombre_completo: user.nombre_completo, tienda_id: user.tienda_id, roles },
    });
  } catch (error) {
    console.error('[AUTH] Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ──────────────────────────────────────────
// POST /auth/mfa/verify
// ──────────────────────────────────────────
const verifyMFA = async (req, res) => {
  try {
    const { totp_code } = req.body;
    const tempToken = req.headers.authorization?.split(' ')[1];

    if (!tempToken || !totp_code) {
      return res.status(400).json({ error: 'temp_token (header) y totp_code (body) son requeridos' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token temporal inválido o expirado' });
    }

    if (!decoded.mfa_pending) {
      return res.status(400).json({ error: 'Este token no es un token MFA temporal' });
    }

    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [decoded.id]);
    const user = result.rows[0];

    if (!user || !user.mfa_secret) {
      return res.status(400).json({ error: 'Usuario sin MFA configurado' });
    }

    const valid = verifyTOTP(user.mfa_secret, totp_code);
    if (!valid) {
      return res.status(401).json({
        error: 'Código MFA inválido',
        message: 'Verifica que el código sea correcto y no haya expirado (válido 30 seg)',
      });
    }

    // MFA correcto → JWT completo
    const roles = await getUserRoles(user.id);
    const token = generateJWT(user, roles);

    res.json({
      message: 'Autenticación MFA exitosa',
      token,
      user: { id: user.id, email: user.email, nombre_completo: user.nombre_completo, tienda_id: user.tienda_id, roles },
    });
  } catch (error) {
    console.error('[AUTH] Error en verifyMFA:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ──────────────────────────────────────────
// POST /auth/mfa/setup   (requiere JWT válido)
// ──────────────────────────────────────────
const setupMFA = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const { base32, otpauth_url } = generateTOTPSecret(user.email);

    // Guardar secreto (aún no activado)
    await pool.query('UPDATE usuarios SET mfa_secret = $1 WHERE id = $2', [base32, user.id]);

    const qrCode = await generateQRCode(otpauth_url);

    res.json({
      message: 'Escanea el código QR con Google Authenticator y luego actívalo en POST /auth/mfa/activate',
      secret_base32: base32,
      qr_code: qrCode, // Data URL base64 → mostrar en <img src="...">
      instrucciones: [
        '1. Abre Google Authenticator en tu móvil',
        '2. Toca el botón + y selecciona Escanear código QR',
        '3. Escanea el QR de esta respuesta',
        '4. Envía el código de 6 dígitos a POST /auth/mfa/activate',
      ],
    });
  } catch (error) {
    console.error('[AUTH] Error en setupMFA:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ──────────────────────────────────────────
// POST /auth/mfa/activate  (requiere JWT válido)
// ──────────────────────────────────────────
const activateMFA = async (req, res) => {
  try {
    const { totp_code } = req.body;

    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user.mfa_secret) {
      return res.status(400).json({
        error: 'Primero debes configurar MFA en POST /auth/mfa/setup',
      });
    }

    const valid = verifyTOTP(user.mfa_secret, totp_code);
    if (!valid) {
      return res.status(400).json({
        error: 'Código TOTP inválido',
        message: 'Verifica el código en Google Authenticator',
      });
    }

    await pool.query('UPDATE usuarios SET mfa_habilitado = TRUE WHERE id = $1', [user.id]);

    res.json({ message: '✅ MFA activado exitosamente. A partir de ahora se requerirá al iniciar sesión' });
  } catch (error) {
    console.error('[AUTH] Error en activateMFA:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ──────────────────────────────────────────
// GET /auth/me   (requiere JWT válido)
// ──────────────────────────────────────────
const me = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.nombre_completo, u.tienda_id, u.mfa_habilitado,
              u.activo, u.fecha_creacion, t.nombre AS tienda_nombre
       FROM usuarios u
       LEFT JOIN tiendas t ON t.id = u.tienda_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    const roles = await getUserRoles(req.user.id);

    res.json({ ...result.rows[0], roles });
  } catch (error) {
    console.error('[AUTH] Error en me:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
async function getUserRoles(userId) {
  const result = await pool.query(
    `SELECT r.nombre FROM roles r
     JOIN usuario_roles ur ON ur.rol_id = r.id
     WHERE ur.usuario_id = $1`,
    [userId]
  );
  return result.rows.map(r => r.nombre);
}

function generateJWT(user, roles) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nombre_completo: user.nombre_completo,
      tienda_id: user.tienda_id,
      roles,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

module.exports = { register, login, verifyMFA, setupMFA, activateMFA, me };
