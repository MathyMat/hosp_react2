// controllers/authController.js
const db = require("../config/db"); // Asegúrate que esta ruta es correcta
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config(); // Para cargar JWT_SECRET

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET no está definido en las variables de entorno. La autenticación no funcionará.");
    // process.exit(1); 
}

exports.login = async (req, res) => {
  const { correo, password } = req.body;
  console.log(`BACKEND: login - Intento de login para correo: ${correo}`);

  if (!correo || !password) {
    console.log("BACKEND: login - Correo o contraseña faltantes.");
    return res.status(400).json({ mensaje: "Correo y contraseña son requeridos." });
  }

  try {
    // --- MODIFICACIÓN DE LA QUERY ---
    // Seleccionar todos los campos necesarios para el token y la respuesta inicial
    const [usuarios] = await db.query(
        `SELECT id, nombre, nombres, apellido_paterno, apellido_materno, dni, 
                correo, password, rol_id 
         FROM usuarios WHERE correo = ?`, 
        [correo]
    );
    
    if (usuarios.length === 0) {
      console.log(`BACKEND: login - Usuario no encontrado con correo: ${correo}`);
      return res.status(401).json({ mensaje: "Credenciales inválidas." }); 
    }

    const usuario = usuarios[0];

    const esValido = await bcrypt.compare(password, usuario.password);
    if (!esValido) {
      console.log(`BACKEND: login - Contraseña incorrecta para correo: ${correo}`);
      return res.status(401).json({ mensaje: "Credenciales inválidas." });
    }

    if (usuario.rol_id !== 1) { // Tu lógica de restricción de rol
      console.log(`BACKEND: login - Acceso denegado para usuario ID ${usuario.id} con rol_id ${usuario.rol_id}. Se requiere rol de administrador (1).`);
      return res.status(403).json({ mensaje: "Acceso restringido. No tiene los permisos necesarios." });
    }

    if (!JWT_SECRET) {
        console.error("BACKEND: login - Error crítico: JWT_SECRET no está configurado.");
        return res.status(500).json({ mensaje: "Error de configuración del servidor que impide el login." });
    }

    // --- CONSTRUIR nombreCompleto ---
    const nombreCompleto = `${usuario.nombres || ''} ${usuario.apellido_paterno || ''} ${usuario.apellido_materno || ''}`.trim() || usuario.nombre; // Fallback al campo 'nombre' si los otros están vacíos


    // --- MODIFICACIÓN DEL PAYLOAD DEL JWT ---
    const payload = {
      id: usuario.id,
      rol: usuario.rol_id,
      nombreCompleto: nombreCompleto, // Nombre completo para mostrar en el header u otros lugares
      dni: usuario.dni || '',         // DNI para mostrar
      // 'nombre' (el campo original) podría ser un nombre de usuario o un display name diferente
      // Si lo necesitas en el token también, añádelo:
      // nombreUsuario: usuario.nombre 
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    console.log(`BACKEND: login - Login exitoso para usuario ID: ${usuario.id}. Payload del token:`, payload);
    
    // --- MODIFICACIÓN DE LA RESPUESTA JSON ---
    res.json({ 
      token, 
      usuario: { 
        id: usuario.id, 
        // nombre: usuario.nombre, // El 'nombre' original de la tabla (display name o username)
        nombreCompleto: nombreCompleto, // El nombre formateado
        rol_id: usuario.rol_id,
        correo: usuario.correo,
        dni: usuario.dni || '' // DNI
      } 
    });

  } catch (err) {
    console.error("BACKEND: login - Error interno del servidor:", err);
    res.status(500).json({ mensaje: "Error en el servidor al procesar el login." });
  }
};