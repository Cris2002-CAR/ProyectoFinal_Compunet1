// Archivo: /middleware/auth.js

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'mi_secreta_llave';

// Middleware para validar el token JWT y proteger rutas privadas
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Se requiere token de autenticación' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = verifyToken;
