// backend/controllers/pacientesController.js
const db = require('../config/db');

exports.obtenerPacientes = async (req, res) => {
  console.log("BACKEND: obtenerPacientes - Solicitud RECIBIDA.");
  try {
    const query = 'SELECT id, usuario_id, fecha_nacimiento, direccion, nombre, apellido, dni, genero, telefono, notas, foto, edad, activo FROM pacientes ORDER BY apellido ASC, nombre ASC';
    const [rows] = await db.query(query);
    
    const pacientesProcesados = rows.map(p => ({
      ...p,
      fotoBase64: (p.foto && p.foto.length > 0) ? Buffer.from(p.foto).toString('base64') : null,
      // activo ya viene como 0 o 1 de la BD
    }));
    // console.log("BACKEND: Pacientes obtenidos:", pacientesProcesados.length);
    res.json(pacientesProcesados);
  } catch (error) {
    console.error('BACKEND: obtenerPacientes - Error:', error);
    res.status(500).json({ error: 'Error al obtener pacientes', details: error.message });
  }
};

exports.obtenerPacientePorId = async (req, res) => {
  const pacienteId = req.params.id;
  console.log(`BACKEND: obtenerPacientePorId - Solicitud RECIBIDA para ID: ${pacienteId}`);
  try {
    const [rows] = await db.query(
      'SELECT id, usuario_id, fecha_nacimiento, direccion, nombre, apellido, dni, genero, telefono, notas, foto, edad, activo FROM pacientes WHERE id = ?',
      [pacienteId]
    );
    if (rows.length === 0) {
      console.log(`BACKEND: obtenerPacientePorId - Paciente con ID ${pacienteId} no encontrado.`);
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    const paciente = {
      ...rows[0],
      fotoBase64: (rows[0].foto && rows[0].foto.length > 0) ? Buffer.from(rows[0].foto).toString('base64') : null
    };
    delete paciente.foto; // No es necesario enviar el buffer si ya está en base64
    // console.log(`BACKEND: obtenerPacientePorId - Paciente encontrado:`, paciente);
    res.json(paciente);
  } catch (error) {
    console.error(`BACKEND: obtenerPacientePorId - Error para ID ${pacienteId}:`, error);
    res.status(500).json({ error: 'Error al obtener el paciente', details: error.message });
  }
};

exports.crearPaciente = async (req, res) => {
  const {
    usuario_id, fecha_nacimiento, direccion, nombre, apellido,
    dni, genero, telefono, notas
  } = req.body;
  let fotoBuffer = null;

  if (req.file && req.file.buffer) {
    fotoBuffer = req.file.buffer;
  }
  console.log("BACKEND: crearPaciente - Body:", req.body, "Foto:", fotoBuffer ? "Sí" : "No");

  if (!nombre || !apellido || !dni || !fecha_nacimiento || !genero) {
    return res.status(400).json({ error: "Nombre, apellido, DNI, fecha de nacimiento y género son requeridos." });
  }
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }

  try {
    // 'activo' tomará su valor por defecto (1) de la BD
    const [result] = await db.query(
      `INSERT INTO pacientes 
      (usuario_id, fecha_nacimiento, direccion, nombre, apellido, dni, genero, telefono, notas, foto) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, fecha_nacimiento, direccion || null, nombre, apellido, dni, genero, telefono || null, notas || null, fotoBuffer]
    );
    const nuevoPacienteId = result.insertId;
    console.log(`BACKEND: crearPaciente - Paciente creado con ID: ${nuevoPacienteId}`);

    const [pacientesCreados] = await db.query("SELECT id, usuario_id, fecha_nacimiento, direccion, nombre, apellido, dni, genero, telefono, notas, foto, edad, activo FROM pacientes WHERE id = ?", [nuevoPacienteId]);
    const pacienteCreado = pacientesCreados[0];
    const pacienteParaEnviar = {
        ...pacienteCreado,
        fotoBase64: (pacienteCreado.foto && pacienteCreado.foto.length > 0) ? Buffer.from(pacienteCreado.foto).toString('base64') : null
    };
    delete pacienteParaEnviar.foto;

    res.status(201).json({ 
        mensaje: "Paciente registrado exitosamente", 
        paciente: pacienteParaEnviar
    });
  } catch (error) {
    console.error('BACKEND: crearPaciente - Error:', error);
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes('dni')) {
        return res.status(409).json({ error: 'El DNI ingresado ya está registrado.' });
    }
    res.status(500).json({ error: 'Error al registrar el paciente.', details: error.message });
   }
};

exports.actualizarPaciente = async (req, res) => {
  const pacienteId = req.params.id;
  const {
    usuario_id, fecha_nacimiento, direccion, nombre, apellido, dni,
    genero, telefono, notas
  } = req.body;
  let fotoBuffer = null;

  if (req.file && req.file.buffer) {
    fotoBuffer = req.file.buffer;
  }
  console.log(`BACKEND: actualizarPaciente - ID: ${pacienteId}, Body:`, req.body, "Foto:", fotoBuffer ? "Sí" : "No");

  if (!nombre || !apellido || !dni || !fecha_nacimiento || !genero) {
    return res.status(400).json({ error: "Nombre, apellido, DNI, fecha de nacimiento y género son requeridos." });
  }
   if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }

  try {
    const camposAActualizar = {
      usuario_id: usuario_id || null,
      nombre, apellido, dni, fecha_nacimiento, genero,
      telefono: telefono || null,
      direccion: direccion || null,
      notas: notas || null
    };
    if (fotoBuffer) {
      camposAActualizar.foto = fotoBuffer;
    } else if (req.body.eliminarFoto === 'true') { // Lógica opcional para eliminar foto
        camposAActualizar.foto = null;
    }

    const [result] = await db.query(
      'UPDATE pacientes SET ? WHERE id = ?',
      [camposAActualizar, pacienteId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Paciente no encontrado o datos sin cambios." });
    }

    console.log(`BACKEND: actualizarPaciente - Paciente ID: ${pacienteId} actualizado.`);
    const [pacientesActualizados] = await db.query('SELECT id, usuario_id, fecha_nacimiento, direccion, nombre, apellido, dni, genero, telefono, notas, foto, edad, activo FROM pacientes WHERE id = ?', [pacienteId]);
    const pacienteActualizado = pacientesActualizados[0];
     const pacienteParaEnviar = {
        ...pacienteActualizado,
        fotoBase64: (pacienteActualizado.foto && pacienteActualizado.foto.length > 0) ? Buffer.from(pacienteActualizado.foto).toString('base64') : null
    };
    delete pacienteParaEnviar.foto;

    res.status(200).json({ 
        mensaje: "Paciente actualizado exitosamente.", 
        paciente: pacienteParaEnviar
    });
  } catch (error) {
    console.error(`BACKEND: actualizarPaciente - Error para ID ${pacienteId}:`, error);
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes('dni')) {
        return res.status(409).json({ error: 'El DNI ingresado ya pertenece a otro paciente.' });
    }
    res.status(500).json({ error: 'Error al actualizar el paciente.', details: error.message });
  }
};

// Cambia el estado 'activo' a 0
exports.deshabilitarPaciente = async (req, res) => {
  const pacienteId = req.params.id;
  console.log(`BACKEND: deshabilitarPaciente - Solicitud para ID: ${pacienteId}`);
  try {
    const [result] = await db.query('UPDATE pacientes SET activo = 0 WHERE id = ?', [pacienteId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }
    const [pacientesActualizados] = await db.query('SELECT id, nombre, apellido, dni, genero, activo FROM pacientes WHERE id = ?', [pacienteId]); // Devolver datos relevantes
    res.json({ mensaje: 'Paciente deshabilitado exitosamente.', paciente: pacientesActualizados[0] });
  } catch (error) {
    console.error(`BACKEND: deshabilitarPaciente - Error para ID ${pacienteId}:`, error);
    res.status(500).json({ error: 'Error al deshabilitar el paciente.', details: error.message });
  }
};

// Cambia el estado 'activo' a 1
exports.habilitarPaciente = async (req, res) => {
  const pacienteId = req.params.id;
  console.log(`BACKEND: habilitarPaciente - Solicitud para ID: ${pacienteId}`);
  try {
    const [result] = await db.query('UPDATE pacientes SET activo = 1 WHERE id = ?', [pacienteId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }
    const [pacientesActualizados] = await db.query('SELECT id, nombre, apellido, dni, genero, activo FROM pacientes WHERE id = ?', [pacienteId]); // Devolver datos relevantes
    res.json({ mensaje: 'Paciente habilitado exitosamente.', paciente: pacientesActualizados[0] });
  } catch (error) {
    console.error(`BACKEND: habilitarPaciente - Error para ID ${pacienteId}:`, error);
    res.status(500).json({ error: 'Error al habilitar el paciente.', details: error.message });
  }
};