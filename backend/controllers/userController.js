// backend/controllers/userController.js
const db = require('../config/db'); // Ajusta la ruta a tu configuración de DB
const bcrypt = require('bcryptjs');

// --- OBTENER PERFIL DEL USUARIO AUTENTICADO ---
exports.obtenerPerfil = async (req, res) => {
  if (!req.user || !req.user.id) {
    console.error("UserController: obtenerPerfil - req.user.id no está definido. AuthMiddleware podría no estar funcionando.");
    return res.status(401).json({ message: "No autorizado o ID de usuario no encontrado en token." });
  }
  const userId = req.user.id;
  console.log(`BACKEND: userController.obtenerPerfil - Solicitud para userId (del token): ${userId}`);

  try {
    const [users] = await db.query(
      `SELECT id, nombre, apellido_paterno, apellido_materno, nombres, dni, correo, 
              correo_recuperacion, fecha_nacimiento, genero, telefono_celular, 
              tipo_telefono, distrito, direccion, foto, rol_id 
       FROM usuarios 
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      console.log(`BACKEND: userController.obtenerPerfil - Usuario no encontrado con ID (del token): ${userId}`);
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const usuario = users[0];
    const perfilParaEnviar = { ...usuario };

    if (usuario.foto && usuario.foto.length > 0) { // Verificar que foto no sea null o un buffer vacío
      perfilParaEnviar.fotoBase64 = Buffer.from(usuario.foto).toString('base64');
    } else {
      perfilParaEnviar.fotoBase64 = null;
    }
    delete perfilParaEnviar.foto; 
    delete perfilParaEnviar.password; // ¡NUNCA ENVIAR LA CONTRASEÑA!

    console.log(`BACKEND: userController.obtenerPerfil - Perfil encontrado y enviado para userId: ${userId}`);
    res.json(perfilParaEnviar);

  } catch (error) {
    console.error(`BACKEND: userController.obtenerPerfil - Error para userId ${userId}:`, error);
    res.status(500).json({ message: "Error al obtener la información del perfil.", error: error.message });
  }
};

// --- ACTUALIZAR PERFIL DEL USUARIO AUTENTICADO ---
exports.actualizarPerfil = async (req, res) => {
  if (!req.user || !req.user.id) {
    console.error("UserController: actualizarPerfil - req.user.id no está definido.");
    return res.status(401).json({ message: "No autorizado o ID de usuario no encontrado en token." });
  }
  const userId = req.user.id;
  console.log(`BACKEND: userController.actualizarPerfil - Solicitud para userId (del token): ${userId}. Body:`, req.body, "File:", req.file ? `Sí (${req.file.originalname}, ${req.file.size} bytes)` : "No");

  if (req.fileValidationError) {
    return res.status(400).json({ message: req.fileValidationError });
  }

  const {
    apellido_paterno, apellido_materno, nombres, dni,
    correo_recuperacion, fecha_nacimiento, genero,
    telefono_celular, tipo_telefono, distrito, direccion,
    nombre // Este es el campo 'nombre' original (display name)
  } = req.body;

  // Validación básica (puedes expandirla)
  if (!nombres || !apellido_paterno || !apellido_materno || !dni || !fecha_nacimiento || !genero || !telefono_celular || !direccion) {
    return res.status(400).json({ message: "Faltan campos obligatorios en la información personal." });
  }

  try {
    const camposAActualizar = {
      nombres,
      apellido_paterno,
      apellido_materno,
      dni,
      correo_recuperacion: correo_recuperacion || null,
      fecha_nacimiento,
      genero,
      telefono_celular,
      tipo_telefono: tipo_telefono || null,
      distrito: distrito || null,
      direccion,
      nombre: nombre || `${nombres} ${apellido_paterno}`.trim(), // Actualiza 'nombre' si se envía o genera uno
    };

    if (req.file && req.file.buffer) {
      camposAActualizar.foto = req.file.buffer;
      console.log(`BACKEND: userController.actualizarPerfil - Actualizando foto para userId: ${userId}, tamaño: ${req.file.buffer.length}`);
    }

    // Filtrar claves con valor undefined para no intentar actualizar con undefined
    Object.keys(camposAActualizar).forEach(key => {
        if (camposAActualizar[key] === undefined) {
            delete camposAActualizar[key];
        }
    });
    
    if (Object.keys(camposAActualizar).length === 0) {
      // Esto cubriría si solo se intenta "actualizar" sin cambiar nada Y sin subir foto
      if (req.file && req.file.buffer) { 
        // Si solo se subió foto, está bien, camposAActualizar.foto ya está seteado.
      } else {
        console.log("BACKEND: userController.actualizarPerfil - No hay datos para actualizar.");
        return res.status(400).json({ message: "No se proporcionaron datos para actualizar." });
      }
    }

    console.log("BACKEND: userController.actualizarPerfil - Campos a actualizar en DB:", Object.keys(camposAActualizar));
    const [result] = await db.query('UPDATE usuarios SET ? WHERE id = ?', [camposAActualizar, userId]);

    if (result.affectedRows === 0) {
      console.log(`BACKEND: userController.actualizarPerfil - Usuario no encontrado o datos idénticos para ID: ${userId}`);
      // Si no se afectaron filas pero se subió una foto, podría ser que solo la foto cambió.
      // Si no se subió foto y no se afectaron filas, significa que los datos de texto eran idénticos.
      if (!(req.file && req.file.buffer)) { // Solo error si no se subió foto y nada cambió
          return res.status(304).json({ message: "No se realizaron cambios o usuario no encontrado." });
      }
    }

    let newFotoBase64 = null;
    if (camposAActualizar.foto) {
      newFotoBase64 = Buffer.from(camposAActualizar.foto).toString('base64');
    } else if (result.affectedRows > 0) { // Si no se subió foto nueva pero se actualizaron otros datos, obtener la foto existente
        const [updatedUser] = await db.query('SELECT foto FROM usuarios WHERE id = ?', [userId]);
        if (updatedUser.length > 0 && updatedUser[0].foto) {
            newFotoBase64 = Buffer.from(updatedUser[0].foto).toString('base64');
        }
    }


    console.log(`BACKEND: userController.actualizarPerfil - Perfil actualizado exitosamente para userId: ${userId}`);
    res.json({ message: "Perfil actualizado exitosamente.", newFotoBase64: newFotoBase64 });

  } catch (error) {
    console.error(`BACKEND: userController.actualizarPerfil - Error para userId ${userId}:`, error);
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes('idx_dni_unique')) {
      return res.status(409).json({ message: 'El DNI ingresado ya está registrado por otro usuario.', field: 'dni' });
    }
    res.status(500).json({ message: "Error al actualizar el perfil.", error: error.message });
  }
};

// --- CAMBIAR CONTRASEÑA DEL USUARIO AUTENTICADO ---
exports.cambiarPassword = async (req, res) => {
  if (!req.user || !req.user.id) {
    console.error("UserController: cambiarPassword - req.user.id no está definido.");
    return res.status(401).json({ message: "No autorizado o ID de usuario no encontrado en token." });
  }
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  console.log(`BACKEND: userController.cambiarPassword - Solicitud para userId (del token): ${userId}`);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Contraseña actual y nueva contraseña son requeridas." });
  }
  if (newPassword.length < 6) { 
    return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres." });
  }

  try {
    const [users] = await db.query('SELECT password FROM usuarios WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    
    const usuario = users[0];
    const isMatch = await bcrypt.compare(currentPassword, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: "La contraseña actual es incorrecta." });
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
    
    console.log(`BACKEND: userController.cambiarPassword - Contraseña actualizada para userId: ${userId}`);
    res.json({ message: "Contraseña actualizada exitosamente." });

  } catch (error) {
    console.error(`BACKEND: userController.cambiarPassword - Error para userId ${userId}:`, error);
    res.status(500).json({ message: "Error al cambiar la contraseña.", error: error.message });
  }
};