// backend/routes/citasRoutes.js
const express = require("express");
const router = express.Router();
const { 
    obtenerCitas, 
    crearCita, 
    eliminarCita, 
    actualizarEstadoCita 
} = require("../controllers/citasController"); // Asegúrate que la ruta sea correcta

router.get("/", obtenerCitas);
router.post("/", crearCita);
router.delete("/:id", eliminarCita);
router.put("/:id/estado", actualizarEstadoCita); // Ruta para actualizar solo el estado

module.exports = router;