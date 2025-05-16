// src/routes/atenciones.js
const express = require('express');
const router = express.Router();
const atencionController = require('../controllers/atencionController');
// Podrías añadir middlewares de autenticación/autorización aquí si los tienes

// GET /api/atenciones (con filtros opcionales en query string)
router.get('/', atencionController.getAllAtenciones);

// POST /api/atenciones
router.post('/', atencionController.createAtencion);

// GET /api/atenciones/:idAtencion
router.get('/:idAtencion', atencionController.getAtencionById);

// PUT /api/atenciones/:idAtencion
router.put('/:idAtencion', atencionController.updateAtencion);

// DELETE /api/atenciones/:idAtencion
router.delete('/:idAtencion', atencionController.deleteAtencion);

module.exports = router;