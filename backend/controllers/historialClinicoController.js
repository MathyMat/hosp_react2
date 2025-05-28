// backend/controllers/historialClinicoController.js
const db = require('../config/db');

// Obtener el historial clínico de un paciente específico
exports.obtenerHistorialPorPacienteId = async (req, res) => {
  const pacienteId = req.params.pacienteId;
  console.log(`BACKEND: obtenerHistorialPorPacienteId - Solicitud RECIBIDA para paciente ID: ${pacienteId}`);

  if (!pacienteId) {
    return res.status(400).json({ error: "El ID del paciente es requerido." });
  }

  try {
    // Primero, obtenemos los datos del paciente para mostrar en la cabecera del historial
    const [pacienteRows] = await db.query('SELECT id, nombre, apellido, dni, fecha_nacimiento, genero, foto FROM pacientes WHERE id = ?', [pacienteId]);

    if (pacienteRows.length === 0) {
      console.log(`BACKEND: obtenerHistorialPorPacienteId - Paciente con ID ${pacienteId} no encontrado.`);
      return res.status(404).json({ error: 'Paciente no encontrado.' });
    }

    const paciente = {
      ...pacienteRows[0],
      fotoBase64: (pacienteRows[0].foto && pacienteRows[0].foto.length > 0) ? Buffer.from(pacienteRows[0].foto).toString('base64') : null,
      // Calculamos la edad actual del paciente aquí también, si no la tienes como columna generada o en el frontend
      // edad_actual: pacienteRows[0].fecha_nacimiento ? 
      //    new Date().getFullYear() - new Date(pacienteRows[0].fecha_nacimiento).getFullYear() : null 
      // (Mejor usar TIMESTAMPDIFF si es posible o la columna generada)
    };
    delete paciente.foto; // No necesitamos enviar el buffer de la foto del paciente si ya tenemos base64

    // Luego, obtenemos todos los registros del historial clínico para ese paciente
    // Ordenamos por fecha_registro_historial descendente para ver lo más reciente primero
    const [historialRows] = await db.query(
      'SELECT * FROM historial_clinico WHERE id_paciente = ? ORDER BY fecha_registro_historial DESC',
      [pacienteId]
    );

    console.log(`BACKEND: Historial clínico para paciente ID ${pacienteId} obtenido: ${historialRows.length} registros.`);
    res.json({
      paciente: paciente, // Datos del paciente
      historial: historialRows // Array de registros del historial
    });

  } catch (error) {
    console.error(`BACKEND: obtenerHistorialPorPacienteId - Error para paciente ID ${pacienteId}:`, error);
    res.status(500).json({ error: 'Error al obtener el historial clínico del paciente.', details: error.message });
  }
};

// Podrías añadir aquí funciones para crear, actualizar o eliminar entradas del historial si lo necesitas
// exports.crearEntradaHistorial = async (req, res) => { /* ... */ };
// exports.actualizarEntradaHistorial = async (req, res) => { /* ... */ };
// exports.eliminarEntradaHistorial = async (req, res) => { /* ... */ };