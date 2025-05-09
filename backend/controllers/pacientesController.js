// backend/controllers/pacientesController.js
const db = require('../config/db');

exports.obtenerPacientes = async (req, res) => {
  console.log("BACKEND: obtenerPacientes - Solicitud RECIBIDA.");
  try {
    // Incluir la foto para convertirla a Base64
    const [rows] = await db.query('SELECT id, usuario_id, fecha_nacimiento, direccion, nombre, apellido, dni, genero, telefono, notas, foto FROM pacientes ORDER BY apellido ASC, nombre ASC');
    
    const pacientesConFoto = rows.map(p => ({
      ...p,
      fotoBase64: (p.foto && p.foto.length > 0) ? Buffer.from(p.foto).toString('base64') : null
    }));
    console.log("BACKEND: Pacientes obtenidos:", pacientesConFoto.length);
    res.json(pacientesConFoto);
  } catch (error) {
    console.error('BACKEND: obtenerPacientes - Error:', error);
    res.status(500).json({ error: 'Error al obtener pacientes', details: error.message });
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
    console.log("BACKEND: crearPaciente - Foto recibida, tamaño:", fotoBuffer.length);
  }
  console.log("BACKEND: crearPaciente - Body:", req.body, "Foto:", fotoBuffer ? "Sí" : "No");

  if (!nombre || !apellido || !dni || !fecha_nacimiento || !genero) {
    return res.status(400).json({ error: "Nombre, apellido, DNI, fecha de nacimiento y género son requeridos." });
  }
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO pacientes 
      (usuario_id, fecha_nacimiento, direccion, nombre, apellido, dni, genero, telefono, notas, foto) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id || null, fecha_nacimiento, direccion || null, nombre, apellido, dni, genero, telefono || null, notas || null, fotoBuffer]
    );
    const nuevoPacienteId = result.insertId;
    console.log(`BACKEND: crearPaciente - Paciente creado con ID: ${nuevoPacienteId}`);

    // Devolver el paciente recién creado, incluyendo la foto como base64
    const [pacientesCreados] = await db.query("SELECT * FROM pacientes WHERE id = ?", [nuevoPacienteId]);
    const pacienteCreado = pacientesCreados[0];
    const pacienteParaEnviar = {
        ...pacienteCreado,
        fotoBase64: (pacienteCreado.foto && pacienteCreado.foto.length > 0) ? Buffer.from(pacienteCreado.foto).toString('base64') : null
    };
    delete pacienteParaEnviar.foto;


    res.status(201).json({ 
        mensaje: "Paciente registrado exitosamente", 
        paciente: pacienteParaEnviar // Enviar el paciente completo
    });
  } catch (error) { /* ... (manejo de error ER_DUP_ENTRY para DNI) ... */ }
};

exports.actualizarPaciente = async (req, res) => {
  const pacienteId = req.params.id;
  const {
    fecha_nacimiento, direccion, nombre, apellido, dni,
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
      nombre, apellido, dni, fecha_nacimiento, genero,
      telefono: telefono || null,
      direccion: direccion || null,
      notas: notas || null
    };
    // Solo añadir foto al objeto si se subió una nueva
    if (fotoBuffer) {
      camposAActualizar.foto = fotoBuffer;
    }

    const [result] = await db.query(
      'UPDATE pacientes SET ? WHERE id = ?',
      [camposAActualizar, pacienteId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Paciente no encontrado o datos sin cambios." });
    }

    console.log(`BACKEND: actualizarPaciente - Paciente ID: ${pacienteId} actualizado.`);
    const [pacientesActualizados] = await db.query('SELECT * FROM pacientes WHERE id = ?', [pacienteId]);
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
  } catch (error) { /* ... (manejo de error ER_DUP_ENTRY para DNI) ... */ }
};

exports.eliminarPaciente = async (req, res) => { /* ... (sin cambios en la lógica interna, solo asegúrate que devuelve JSON) ... */ };