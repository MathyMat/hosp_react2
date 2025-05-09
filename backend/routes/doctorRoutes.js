// backend/routes/doctoresRoutes.js
const express = require('express');
const router = express.Router();
const doctoresController = require('../controllers/doctoresController');
const multer = require('multer');

// Configuración de Multer (igual que para inventario)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif") {
      cb(null, true);
    } else {
      req.fileValidationError = "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF).";
      cb(null, false);
    }
  }
});

router.get('/', doctoresController.obtenerDoctores);
router.post('/', upload.single('fotoDoctor'), doctoresController.crearDoctor); // 'fotoDoctor' será el name del input file
router.put('/:id', upload.single('fotoDoctor'), doctoresController.actualizarDoctor);
router.delete('/:id', doctoresController.eliminarDoctor);

module.exports = router;