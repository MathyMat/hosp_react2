// backend/controllers/doctoresController.js
const db = require('../config/db');

// Obtener todos los doctores
exports.obtenerDoctores = async (req, res) => {
  console.log("BACKEND: doctoresController.obtenerDoctores - Solicitud RECIBIDA.");
  try {
    const [doctores] = await db.execute(`
      SELECT id, usuario_id, nombre, apellidos, especialidad, dni, 
             telefono, correo, genero, fecha_nacimiento, foto
      FROM doctores
      ORDER BY apellidos ASC, nombre ASC
    `);

    const doctoresConFotoBase64 = doctores.map(doc => {
      if (doc.foto && doc.foto.length > 0) {
        return { ...doc, fotoBase64: Buffer.from(doc.foto).toString('base64') };
      }
      return { ...doc, fotoBase64: null };
    });
    console.log("BACKEND: doctoresController.obtenerDoctores - Doctores obtenidos:", doctoresConFotoBase64.length);
    res.status(200).json(doctoresConFotoBase64);
  } catch (error) {
    console.error('BACKEND: doctoresController.obtenerDoctores - Error:', error);
    res.status(500).json({ mensaje: 'Error al obtener doctores', error: error.message });
  }
};

// Crear nuevo doctor
exports.crearDoctor = async (req, res) => {
  const {
    usuario_id, especialidad, nombre, apellidos, dni,
    telefono, correo, genero, fecha_nacimiento
  } = req.body;
  let fotoBuffer = null;

  if (req.file && req.file.buffer) {
    fotoBuffer = req.file.buffer;
  }
  console.log("BACKEND: doctoresController.crearDoctor - Body:", req.body, "Foto:", fotoBuffer ? "Sí" : "No");

  if (!nombre || !apellidos || !dni || !especialidad || !fecha_nacimiento || !genero || !correo || !telefono) {
    return res.status(400).json({ mensaje: "Todos los campos marcados con * son requeridos." });
  }
  if (req.fileValidationError) {
    return res.status(400).json({ mensaje: req.fileValidationError });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO doctores (usuario_id, especialidad, nombre, apellidos, dni, telefono, correo, genero, fecha_nacimiento, foto) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, especialidad, nombre, apellidos, dni, telefono, correo, genero, fecha_nacimiento, fotoBuffer]
    );
    const nuevoDoctorId = result.insertId;
    console.log(`BACKEND: doctoresController.crearDoctor - Doctor creado con ID: ${nuevoDoctorId}`);

    // Devolver el doctor creado con la foto en base64
    const [nuevoDoctorArray] = await db.query("SELECT * FROM doctores WHERE id = ?", [nuevoDoctorId]);
    const nuevoDoctor = nuevoDoctorArray[0];
    let fotoBase64Response = null;
    if (nuevoDoctor.foto) {
        fotoBase64Response = Buffer.from(nuevoDoctor.foto).toString('base64');
    }
    
    res.status(201).json({ 
        mensaje: 'Doctor registrado exitosamente', 
        doctor: { ...nuevoDoctor, fotoBase64: fotoBase64Response }
    });
  } catch (err) {
    console.error("BACKEND: doctoresController.crearDoctor - Error:", err);
    if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('dni')) {
        return res.status(409).json({ mensaje: 'El DNI ingresado ya está registrado para otro doctor.' });
    }
    if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('correo')) { // Si correo también es UNIQUE
        return res.status(409).json({ mensaje: 'El Correo ingresado ya está registrado para otro doctor.' });
    }
    res.status(500).json({ mensaje: "Error al registrar el doctor", error: err.message });
  }
};

// Actualizar doctor
exports.actualizarDoctor = async (req, res) => {
  const { id } = req.params;
  const {
    usuario_id, especialidad, nombre, apellidos, dni,
    telefono, correo, genero, fecha_nacimiento
  } = req.body;
  let fotoBuffer = null;

  if (req.file && req.file.buffer) {
    fotoBuffer = req.file.buffer;
  }
  console.log(`BACKEND: doctoresController.actualizarDoctor - ID: ${id}, Body:`, req.body, "Foto:", fotoBuffer ? "Sí" : "No");
  
  if (!nombre || !apellidos || !dni || !especialidad || !fecha_nacimiento || !genero || !correo || !telefono) {
    return res.status(400).json({ mensaje: "Todos los campos marcados con * son requeridos." });
  }
  if (req.fileValidationError) {
    return res.status(400).json({ mensaje: req.fileValidationError });
  }

  try {
    let query = `UPDATE doctores SET usuario_id=?, especialidad=?, nombre=?, apellidos=?, dni=?, 
                 telefono=?, correo=?, genero=?, fecha_nacimiento=?`;
    const queryParams = [
      usuario_id || null, especialidad, nombre, apellidos, dni,
      telefono, correo, genero, fecha_nacimiento
    ];

    if (fotoBuffer) {
      query += ', foto=?';
      queryParams.push(fotoBuffer);
    }
    query += ' WHERE id=?';
    queryParams.push(id);

    const [result] = await db.query(query, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Doctor no encontrado o datos idénticos." });
    }
    console.log(`BACKEND: doctoresController.actualizarDoctor - Doctor ID: ${id} actualizado.`);

    const [doctorActualizadoArray] = await db.query("SELECT * FROM doctores WHERE id = ?", [id]);
    const doctorActualizado = doctorActualizadoArray[0];
    let fotoBase64Response = null;
    if (doctorActualizado.foto) {
        fotoBase64Response = Buffer.from(doctorActualizado.foto).toString('base64');
    }
    
    res.json({ 
        mensaje: 'Doctor actualizado exitosamente',
        doctor: { ...doctorActualizado, fotoBase64: fotoBase64Response }
    });
  } catch (err) {
    console.error("BACKEND: doctoresController.actualizarDoctor - Error:", err);
     if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('dni')) {
        return res.status(409).json({ mensaje: 'El DNI ingresado ya está registrado para otro doctor.' });
    }
    if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('correo')) { 
        return res.status(409).json({ mensaje: 'El Correo ingresado ya está registrado para otro doctor.' });
    }
    res.status(500).json({ mensaje: "Error al actualizar doctor", error: err.message });
  }
};

// Eliminar doctor
exports.eliminarDoctor = async (req, res) => {
  const { id } = req.params;
  console.log(`BACKEND: doctoresController.eliminarDoctor - ID: ${id}`);
  try {
    // Considerar si hay citas u otras dependencias antes de eliminar
    const [result] = await db.query('DELETE FROM doctores WHERE id=?', [id]);
    if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Doctor no encontrado." });
    }
    console.log(`BACKEND: doctoresController.eliminarDoctor - Doctor ID: ${id} eliminado.`);
    res.json({ mensaje: 'Doctor eliminado exitosamente' });
  } catch (err) {
    console.error("BACKEND: doctoresController.eliminarDoctor - Error:", err);
    // Manejar errores de foreign key si el doctor tiene citas asignadas
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ mensaje: "No se puede eliminar el doctor porque tiene citas u otros registros asociados." });
    }
    res.status(500).json({ mensaje: "Error al eliminar doctor", error: err.message });
  }
};