// backend/routes/pacientesRoutes.js
const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const multer = require('multer');

// Configuración de Multer (sin cambios)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif") {
      cb(null, true);
    } else {
      req.fileValidationError = "Tipo de archivo no permitido (solo JPG, PNG, GIF).";
      cb(null, false); // Rechazar archivo pero no lanzar error para que el controlador pueda manejarlo
    }
  }
});

router.get('/', pacientesController.obtenerPacientes);
router.get('/:id', pacientesController.obtenerPacientePorId);
router.post('/', upload.single('fotoPaciente'), pacientesController.crearPaciente);
router.put('/:id', upload.single('fotoPaciente'), pacientesController.actualizarPaciente);

// Rutas para cambiar el estado del paciente
router.patch('/:id/deshabilitar', pacientesController.deshabilitarPaciente);
router.patch('/:id/habilitar', pacientesController.habilitarPaciente);

// La ruta DELETE original se elimina o comenta si ya no se usa para borrado físico.
// router.delete('/:id', pacientesController.eliminarPaciente); 

module.exports = router;