// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/verificarToken.js'); // O como hayas nombrado tu middleware de verificar token
const multer = require('multer');

// Configuración de Multer para guardar en memoria (para luego pasar a BLOB)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif") {
      cb(null, true);
    } else {
      // Rechazar archivo pero no pasar un error a Express, el controlador puede chequear req.fileValidationError
      req.fileValidationError = "Tipo de archivo no permitido. Solo se aceptan imágenes (jpeg, png, gif).";
      cb(null, false); 
    }
  }
});

// --- RUTAS DE USUARIO PROTEGIDAS ---
// El ID del usuario se obtiene de req.user.id (inyectado por authMiddleware)

// GET /api/usuarios/perfil - Obtener perfil del usuario autenticado
router.get(
    '/perfil', 
    authMiddleware, 
    userController.obtenerPerfil
);

// PUT /api/usuarios/perfil - Actualizar perfil del usuario autenticado
// multer procesará un solo archivo del campo 'fotoFile'
router.put(
  '/perfil', 
  authMiddleware, 
  upload.single('fotoFile'), // 'fotoFile' es el nombre del campo en FormData del frontend
  userController.actualizarPerfil
);

// POST /api/usuarios/cambiar-password - Cambiar contraseña del usuario autenticado
router.post(
  '/cambiar-password', 
  authMiddleware, 
  userController.cambiarPassword
);

module.exports = router;