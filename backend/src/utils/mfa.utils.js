// =============================================
// Utilidades MFA - TOTP (Google Authenticator)
// Usa speakeasy para generar/verificar tokens
// =============================================

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Genera un secreto TOTP para el usuario
 * @param {string} email - Email del usuario
 * @returns {object} - { base32, otpauth_url }
 */
const generateTOTPSecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `TechStore (${email})`,
    issuer: 'TechStore Inventory',
    length: 20,
  });

  return {
    base32: secret.base32,
    otpauth_url: secret.otpauth_url,
  };
};

/**
 * Verifica un código TOTP ingresado por el usuario
 * @param {string} secret - Secreto base32 almacenado en BD
 * @param {string} token - Código de 6 dígitos del usuario
 * @returns {boolean} - true si es válido
 */
const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: String(token),
    window: 1, // Permite ±30 segundos de diferencia
  });
};

/**
 * Genera la imagen QR como Data URL para mostrar al usuario
 * @param {string} otpauthUrl - URL otpauth:// del secreto
 * @returns {Promise<string>} - Data URL de la imagen QR (base64)
 */
const generateQRCode = async (otpauthUrl) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
    });
    return qrDataUrl;
  } catch (error) {
    throw new Error('Error al generar código QR: ' + error.message);
  }
};

module.exports = { generateTOTPSecret, verifyTOTP, generateQRCode };
