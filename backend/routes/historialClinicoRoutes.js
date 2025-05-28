// backend/routes/historialClinicoRoutes.js
const express = require('express');
const router = express.Router();
const historialClinicoController = require('../controllers/historialClinicoController');

// Ruta para obtener el historial clínico de un paciente específico
// :pacienteId será el ID del paciente
router.get('/paciente/:pacienteId', historialClinicoController.obtenerHistorialPorPacienteId);

// Aquí podrías añadir rutas para POST, PUT, DELETE si implementas esas funcionalidades
// router.post('/', historialClinicoController.crearEntradaHistorial);
// router.put('/:historialId', historialClinicoController.actualizarEntradaHistorial);
// router.delete('/:historialId', historialClinicoController.eliminarEntradaHistorial);


module.exports = router;