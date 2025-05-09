// habitacionesRoutes.js
const express = require('express');
const router = express.Router();
const habitacionesController = require('../controllers/habitacionesController');

// Rutas existentes (revisadas para claridad)
router.get('/disponibles', habitacionesController.obtenerHabitacionesDisponibles); // GET /api/habitaciones/disponibles
router.get('/asignadas', habitacionesController.obtenerAsignaciones);         // GET /api/habitaciones/asignadas (esta es tu tabla 'habitaciones' que actúa como asignaciones)
router.post('/asignar', habitacionesController.createHabitacion);             // POST /api/habitaciones/asignar

// Ejemplo de una ruta GET general si la necesitas (decide cuál de las dos funciones usar)
// router.get('/', habitacionesController.getAllHabitaciones); // GET /api/habitaciones/ (lista todas las asignaciones con detalles)


// --- RUTA DELETE AÑADIDA ---
// El frontend llama a: DELETE http://localhost:3001/api/habitaciones/asignadas/:id
// Si tu index.js monta este router en '/api/habitaciones', entonces la ruta aquí debe ser '/asignadas/:asignacionId'
router.delete('/asignadas/:asignacionId', habitacionesController.eliminarAsignacion);

module.exports = router;