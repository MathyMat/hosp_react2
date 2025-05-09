const jwt = require('jsonwebtoken');
require('dotenv').config(); // Asegúrate que dotenv esté configurado para cargar variables de .env

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    console.log("AuthMiddleware: No se encontró el header 'Authorization'.");
    return res.status(401).json({ mensaje: 'No hay token, autorización denegada.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log("AuthMiddleware: Formato de token inválido. Se esperaba 'Bearer <token>'. Header recibido:", authHeader);
    return res.status(401).json({ mensaje: 'Formato de token inválido.' });
  }
  
  const token = parts[1];

  if (!token) { // Doble verificación por si acaso
    console.log("AuthMiddleware: No se encontró el token después de 'Bearer '.");
    return res.status(401).json({ mensaje: 'No hay token (después de Bearer), autorización denegada.' });
  }
  
  if (!JWT_SECRET) {
    console.error("FATAL ERROR en authMiddleware: JWT_SECRET no está definido. No se puede verificar el token.");
    return res.status(500).json({ mensaje: "Error crítico de configuración del servidor." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // El payload del token, tal como lo creaste en authController (ej: { id: ..., rol: ... }),
    // se asigna a req.user.
    req.user = decoded; 
    console.log("AuthMiddleware: Token verificado exitosamente. req.user:", req.user);
    next();
  } catch (err) {
    console.error("AuthMiddleware: Error al verificar el token:", err.message);
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ mensaje: 'Token ha expirado.' });
    }
    // Para otros errores como JsonWebTokenError (token malformado/inválido)
    return res.status(401).json({ mensaje: 'Token no es válido.' });
  }
};