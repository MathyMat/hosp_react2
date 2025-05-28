// backend/routes/historialClinicoRoutes.js
const express = require('express');
const router = express.Router();
const historialClinicoController = require('../controllers/historialClinicoController');

// Obtener el historial y datos del paciente para un pacienteId específico
router.get('/paciente/:pacienteId', historialClinicoController.obtenerHistorialPorPacienteId);

// Crear una nueva entrada en el historial clínico
router.post('/', historialClinicoController.crearEntradaHistorial);

// Actualizar una entrada específica del historial clínico por su historial_id
router.put('/:historialId', historialClinicoController.actualizarEntradaHistorial);

// Podrías añadir una ruta DELETE si necesitas eliminar entradas del historial
// router.delete('/:historialId', historialClinicoController.eliminarEntradaHistorial);

module.exports = router;