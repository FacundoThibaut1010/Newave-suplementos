import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Autenticación del panel de administración.
 * El usuario y la contraseña viven SOLO en el servidor (ADMIN_USER / ADMIN_PASSWORD),
 * nunca en el código del admin que se descarga el navegador.
 */

const TOKEN_TTL = '12h';

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

// Límite simple de intentos por IP para frenar ataques de fuerza bruta
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const tooManyAttempts = (ip) => {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(ip, { first: now, count: 0 });
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
};

const registerFailure = (ip) => {
  const entry = attempts.get(ip) || { first: Date.now(), count: 0 };
  entry.count += 1;
  attempts.set(ip, entry);
};

export const adminLogin = (req, res) => {
  const { ADMIN_USER, ADMIN_PASSWORD, JWT_SECRET } = process.env;

  if (!ADMIN_USER || !ADMIN_PASSWORD || !JWT_SECRET) {
    console.error('⚠️ Faltan ADMIN_USER, ADMIN_PASSWORD o JWT_SECRET en las variables de entorno del backend.');
    return res.status(503).json({ message: 'El acceso al panel no está configurado en el servidor.' });
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ message: 'Demasiados intentos. Esperá 15 minutos y volvé a probar.' });
  }

  const { username = '', password = '' } = req.body || {};
  // Comparamos ambos siempre (sin cortar antes) para no filtrar cuál de los dos está mal
  const userOk = safeEqual(username, ADMIN_USER);
  const passOk = safeEqual(password, ADMIN_PASSWORD);

  if (!(userOk && passOk)) {
    registerFailure(ip);
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
  }

  attempts.delete(ip);
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: TOKEN_TTL });
  res.json({ token, expiresIn: TOKEN_TTL });
};

export const requireAdmin = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: 'No autorizado. Iniciá sesión en el panel.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.admin !== true) throw new Error('not admin');
    next();
  } catch {
    res.status(401).json({ message: 'Tu sesión del panel venció. Volvé a iniciar sesión.' });
  }
};
