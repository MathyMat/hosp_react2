// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController"); // Solo importamos 'login'

router.post("/login", login); // Solo la ruta de login

module.exports = router;