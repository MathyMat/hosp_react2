// backend/controllers/historialClinicoController.js
const db = require('../config/db');

// Obtener el historial clínico de un paciente específico Y la información del paciente
exports.obtenerHistorialPorPacienteId = async (req, res) => {
  const pacienteId = req.params.pacienteId;
  console.log(`BACKEND (historial): obtenerHistorialPorPacienteId - Solicitud para paciente ID: ${pacienteId}`);

  if (!pacienteId || isNaN(parseInt(pacienteId))) {
    return res.status(400).json({ error: "El ID del paciente es requerido y debe ser un número." });
  }

  try {
    // 1. Obtener datos del paciente
    const [pacienteRows] = await db.query(
      'SELECT id, nombre, apellido, dni, fecha_nacimiento, genero, foto, edad FROM pacientes WHERE id = ?', // 'edad' si es columna generada
      [pacienteId]
    );

    if (pacienteRows.length === 0) {
      console.log(`BACKEND (historial): Paciente con ID ${pacienteId} no encontrado.`);
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }

    const pacienteData = {
      ...pacienteRows[0],
      fotoBase64: (pacienteRows[0].foto && pacienteRows[0].foto.length > 0) ? Buffer.from(pacienteRows[0].foto).toString('base64') : null,
    };
    delete pacienteData.foto; // No enviar el buffer si ya tenemos base64

    // 2. Obtener todos los registros del historial clínico para ese paciente
    const [historialRows] = await db.query(
      'SELECT * FROM historial_clinico WHERE id_paciente = ? ORDER BY fecha_registro_historial DESC',
      [pacienteId]
    );

    console.log(`BACKEND (historial): ${historialRows.length} registros de historial encontrados para paciente ID ${pacienteId}.`);
    res.json({
      paciente: pacienteData,
      historial: historialRows
    });

  } catch (error) {
    console.error(`BACKEND (historial): Error en obtenerHistorialPorPacienteId para ID ${pacienteId}:`, error);
    res.status(500).json({ error: 'Error interno al obtener el historial clínico.', details: error.message });
  }
};

// Crear una nueva entrada en el historial clínico para un paciente
exports.crearEntradaHistorial = async (req, res) => {
  const {
    id_paciente, id_atencion, edad, genero, enfermedad,
    tiempo_ultima_atencion_dias, visitas_ultimos_30_dias,
    visitas_ultimos_6_meses, hospitalizaciones_ultimo_anio,
    medicamentos_actuales, observaciones
  } = req.body;

  console.log(`BACKEND (historial): crearEntradaHistorial - Solicitud para paciente ID: ${id_paciente}`);
  console.log(`BACKEND (historial): Datos recibidos para crear:`, req.body);

  if (!id_paciente || !enfermedad || !medicamentos_actuales || !observaciones) {
    return res.status(400).json({ error: 'ID del paciente, enfermedad, medicamentos y observaciones son requeridos.' });
  }
  if (isNaN(parseInt(id_paciente))) {
      return res.status(400).json({ error: 'ID del paciente debe ser un número.' });
  }

  try {
    const nuevaEntrada = {
      id_paciente: parseInt(id_paciente, 10),
      id_atencion: id_atencion || null,
      edad: (edad !== undefined && edad !== '' && !isNaN(parseInt(edad))) ? parseInt(edad, 10) : null,
      genero: genero || null,
      enfermedad,
      tiempo_ultima_atencion_dias: (tiempo_ultima_atencion_dias !== undefined && tiempo_ultima_atencion_dias !== '' && !isNaN(parseInt(tiempo_ultima_atencion_dias))) ? parseInt(tiempo_ultima_atencion_dias, 10) : 0,
      visitas_ultimos_30_dias: (visitas_ultimos_30_dias !== undefined && visitas_ultimos_30_dias !== '' && !isNaN(parseInt(visitas_ultimos_30_dias))) ? parseInt(visitas_ultimos_30_dias, 10) : 0,
      visitas_ultimos_6_meses: (visitas_ultimos_6_meses !== undefined && visitas_ultimos_6_meses !== '' && !isNaN(parseInt(visitas_ultimos_6_meses))) ? parseInt(visitas_ultimos_6_meses, 10) : 0,
      hospitalizaciones_ultimo_anio: (hospitalizaciones_ultimo_anio !== undefined && hospitalizaciones_ultimo_anio !== '' && !isNaN(parseInt(hospitalizaciones_ultimo_anio))) ? parseInt(hospitalizaciones_ultimo_anio, 10) : 0,
      medicamentos_actuales,
      observaciones,
      // fecha_registro_historial se establece por DEFAULT CURRENT_TIMESTAMP en la BD
    };

    const [result] = await db.query('INSERT INTO historial_clinico SET ?', [nuevaEntrada]);
    const nuevaEntradaId = result.insertId;

    const [entradaCreada] = await db.query('SELECT * FROM historial_clinico WHERE historial_id = ?', [nuevaEntradaId]);

    console.log(`BACKEND (historial): Nueva entrada de historial ID: ${nuevaEntradaId} creada.`);
    res.status(201).json({
      mensaje: 'Nueva entrada de historial creada exitosamente.',
      historialCreado: entradaCreada[0]
    });

  } catch (error) {
    console.error(`BACKEND (historial): Error en crearEntradaHistorial para paciente ID ${id_paciente}:`, error);
    res.status(500).json({ error: 'Error interno al crear la entrada del historial.', details: error.message });
  }
};

// Actualizar una entrada específica del historial clínico
exports.actualizarEntradaHistorial = async (req, res) => {
  const { historialId } = req.params;
  const {
    edad, genero, enfermedad, tiempo_ultima_atencion_dias,
    visitas_ultimos_30_dias, visitas_ultimos_6_meses, hospitalizaciones_ultimo_anio,
    medicamentos_actuales, observaciones
    // No se actualiza id_paciente ni id_atencion ni fecha_registro desde aquí
  } = req.body;

  console.log(`BACKEND (historial): actualizarEntradaHistorial - Solicitud para historial_id: ${historialId}`);
  console.log(`BACKEND (historial): Datos recibidos para actualizar:`, req.body);

  if (!historialId || isNaN(parseInt(historialId))) {
    return res.status(400).json({ error: "El ID del historial es requerido y debe ser un número." });
  }
  if (!enfermedad || !medicamentos_actuales || !observaciones) {
    return res.status(400).json({ error: 'Enfermedad, medicamentos y observaciones son campos requeridos.' });
  }

  try {
    const camposAActualizar = {
      edad: (edad !== undefined && edad !== '' && !isNaN(parseInt(edad))) ? parseInt(edad, 10) : null,
      genero: genero || null, // Permitir null si se envía vacío
      enfermedad,
      tiempo_ultima_atencion_dias: (tiempo_ultima_atencion_dias !== undefined && tiempo_ultima_atencion_dias !== '' && !isNaN(parseInt(tiempo_ultima_atencion_dias))) ? parseInt(tiempo_ultima_atencion_dias, 10) : null,
      visitas_ultimos_30_dias: (visitas_ultimos_30_dias !== undefined && visitas_ultimos_30_dias !== '' && !isNaN(parseInt(visitas_ultimos_30_dias))) ? parseInt(visitas_ultimos_30_dias, 10) : null,
      visitas_ultimos_6_meses: (visitas_ultimos_6_meses !== undefined && visitas_ultimos_6_meses !== '' && !isNaN(parseInt(visitas_ultimos_6_meses))) ? parseInt(visitas_ultimos_6_meses, 10) : null,
      hospitalizaciones_ultimo_anio: (hospitalizaciones_ultimo_anio !== undefined && hospitalizaciones_ultimo_anio !== '' && !isNaN(parseInt(hospitalizaciones_ultimo_anio))) ? parseInt(hospitalizaciones_ultimo_anio, 10) : null,
      medicamentos_actuales,
      observaciones
    };
    
    // Filtrar campos que no se enviaron para no intentar actualizarlos a undefined
    // En este caso, si un campo no se envía en el body, no se incluirá en camposAActualizar
    // y por ende no se actualizará en la BD, manteniendo su valor previo.
    // Si se envía un string vacío y se parsea a null, se actualizará a NULL.

    const [result] = await db.query(
      'UPDATE historial_clinico SET ? WHERE historial_id = ?',
      [camposAActualizar, historialId]
    );

    if (result.affectedRows === 0) {
      console.log(`BACKEND (historial): No se encontró o no hubo cambios para historial ID: ${historialId}`);
      return res.status(404).json({ error: 'Entrada de historial no encontrada o sin cambios.' });
    }

    const [updatedEntry] = await db.query('SELECT * FROM historial_clinico WHERE historial_id = ?', [historialId]);
    
    console.log(`BACKEND (historial): Entrada de historial ID: ${historialId} actualizada.`);
    res.json({
      mensaje: 'Entrada de historial actualizada exitosamente.',
      historialActualizado: updatedEntry[0]
    });

  } catch (error) {
    console.error(`BACKEND (historial): Error en actualizarEntradaHistorial para ID ${historialId}:`, error);
    res.status(500).json({ error: 'Error interno al actualizar la entrada del historial.', details: error.message });
  }
};