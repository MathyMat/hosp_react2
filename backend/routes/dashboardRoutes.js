const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/resumen', dashboardController.getResumen);
router.get('/actividades', dashboardController.getActividades);
router.get('/distribucion', dashboardController.getDistribucion);

module.exports = router;
