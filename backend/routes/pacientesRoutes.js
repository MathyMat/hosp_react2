// backend/routes/pacientesRoutes.js
const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const multer = require('multer');

// Configuración de Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif") {
      cb(null, true);
    } else {
      req.fileValidationError = "Tipo de archivo no permitido (solo JPG, PNG, GIF).";
      cb(null, false);
    }
  }
});

router.get('/', pacientesController.obtenerPacientes);
// Usar multer para el campo 'fotoPaciente'
router.post('/', upload.single('fotoPaciente'), pacientesController.crearPaciente);
router.put('/:id', upload.single('fotoPaciente'), pacientesController.actualizarPaciente);
router.delete('/:id', pacientesController.eliminarPaciente);

module.exports = router;