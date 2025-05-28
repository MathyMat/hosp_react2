// backend/routes/pacientesRoutes.js
const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');

// Obtener todos los pacientes
router.get('/', pacientesController.obtenerPacientes);

// Crear nuevo paciente
router.post('/', pacientesController.crearPaciente);

// --- NUEVA RUTA PARA ACTUALIZAR PACIENTE ---
router.put('/:id', pacientesController.actualizarPaciente);



module.exports = router;