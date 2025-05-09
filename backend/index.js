// backend/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Cargar variables de entorno al inicio

// Importación de todas tus rutas
const authRoutes = require("./routes/authRoutes");
const pacientesRoutes = require("./routes/pacientesRoutes");
const citasRoutes = require("./routes/citasRoutes");
const habitacionesRoutes = require("./routes/habitacionesRoutes");
const inventarioRoutes = require("./routes/inventarioRoutes");
const dashboardRoutes = require('./routes/dashboardRoutes');
const doctorRoutes = require('./routes/doctorRoutes'); // Asumiendo que ya lo tenías así
const facturacionRoutes = require('./routes/facturacionRoutes'); // Asumiendo que ya lo tenías así
const userRoutes = require('./routes/userRoutes'); // <--- NUEVA RUTA AÑADIDA

const app = express();

// --- Configuración de CORS ---
// Usar el middleware cors() es la forma recomendada y más completa.
// Maneja los headers Access-Control-Allow-Origin, Methods, Headers, y OPTIONS requests.
app.use(cors()); 
// La configuración manual que tenías abajo es generalmente innecesaria si usas app.use(cors())
// y podría incluso interferir o ser menos completa.
/*
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // '*' es menos seguro para producción
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Añadir OPTIONS
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { // Manejar preflight explícitamente si no usas cors()
        return res.sendStatus(200);
    }
    next();
});
*/

// Middlewares para parsear el cuerpo de las solicitudes
app.use(express.json()); // Para parsear JSON bodies (Content-Type: application/json)
app.use(express.urlencoded({ extended: true })); // Para parsear bodies de formularios URL-encoded (ej. de FormData sin archivos o con ellos)

// --- Definición de Rutas ---
app.use('/api/dashboard', dashboardRoutes);
app.use("/api/auth", authRoutes);             // Rutas de autenticación (login)
app.use("/api/usuarios", userRoutes);         // <--- NUEVAS RUTAS DE USUARIO (perfil, cambiar contraseña)
app.use("/api/pacientes", pacientesRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/habitaciones", habitacionesRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use('/api/doctores', doctorRoutes);       // Mantenido como lo tenías
app.use('/api/facturacion', facturacionRoutes); // Mantenido como lo tenías


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend iniciado en puerto ${PORT}`);
  if (!process.env.JWT_SECRET) {
    // Esta advertencia es útil para recordar configurar el JWT_SECRET
    console.warn(
      "ADVERTENCIA CRÍTICA: La variable de entorno JWT_SECRET no está configurada." +
      " La autenticación JWT no será segura y probablemente fallará al intentar firmar o verificar tokens." +
      " Asegúrate de tener un archivo .env con JWT_SECRET definido."
    );
  }
});