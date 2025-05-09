// backend/routes/inventarioRoutes.js
const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController'); // Verifica esta ruta
const multer = require('multer');

// Configuración de Multer para guardar en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif") {
      cb(null, true);
    } else {
      // Pasar un error a multer para que lo maneje
      // cb(new Error("Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF)."), false);
      // O, para que el controlador lo maneje con req.fileValidationError:
      req.fileValidationError = "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF).";
      cb(null, false);
    }
  }
});

// Obtener todo el inventario
router.get('/', inventarioController.obtenerInventario);

// Agregar insumo (con subida de imagen, campo 'fotoInsumo')
router.post('/', upload.single('fotoInsumo'), inventarioController.crearInsumo);

// Editar insumo (con subida de imagen opcional, campo 'fotoInsumo')
router.put('/:id', upload.single('fotoInsumo'), inventarioController.actualizarInsumo);

// Eliminar insumo
router.delete('/:id', inventarioController.eliminarInsumo);

module.exports = router;