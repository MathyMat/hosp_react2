// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
// const authMiddleware = require('../middleware/verificarToken'); // Uncomment if you want to protect this route

// GET /api/dashboard/stats
router.get('/stats', /* authMiddleware, */ dashboardController.getDashboardStats);

module.exports = router;