// controllers/habitacionesController.js
const db = require('../config/db');

exports.obtenerHabitacionesDisponibles = async (req, res) => {
  console.log("BACKEND: obtenerHabitacionesDisponibles - Solicitud RECIBIDA.");
  try {
    const [habitaciones] = await db.query(
      `SELECT id, numero, tipo FROM habitaciones_disponibles WHERE estado = 'Disponible'` // Asegurarse de obtener solo las disponibles
    );
    console.log("BACKEND: obtenerHabitacionesDisponibles - Consulta exitosa. ENVIANDO RESPUESTA.");
    res.json(habitaciones);
  } catch (error) {
    console.error('BACKEND: obtenerHabitacionesDisponibles - Error:', error);
    res.status(500).json({ mensaje: 'Error al obtener habitaciones disponibles' });
  }
};

exports.obtenerHabitaciones = async (req, res) => { // Esta parece ser la lista de asignaciones (tabla 'habitaciones')
  console.log("BACKEND: obtenerHabitaciones (asignaciones) - Solicitud RECIBIDA.");
  try {
    // Es mejor usar la función getAllHabitaciones para obtener datos más completos
    // o renombrar esta función para que sea más clara, ej: obtenerTodasLasFilasDeTablaHabitaciones
    const [result] = await db.query('SELECT * FROM habitaciones');
    console.log("BACKEND: obtenerHabitaciones (asignaciones) - Consulta exitosa. ENVIANDO RESPUESTA.");
    res.json(result);
  } catch (error) {
    console.error('BACKEND: obtenerHabitaciones (asignaciones) - Error:', error);
    res.status(500).json({ mensaje: 'Error del servidor al obtener asignaciones' });
  }
};

exports.createHabitacion = async (req, res) => { // Convertir a async
  console.log("BACKEND: createHabitacion - Solicitud RECIBIDA (async). Body:", req.body);
  const {
    habitacion_disponible_id,
    paciente_id,
    doctor_id,
    fecha_ingreso,
    fecha_salida_estimada,
    estado_paciente,
    motivo_ingreso
  } = req.body;

  if (!habitacion_disponible_id || !paciente_id || !doctor_id || !fecha_ingreso) {
    console.log("BACKEND: createHabitacion - Validación fallida.");
    return res.status(400).json({ message: 'Faltan campos requeridos.' });
  }

  const insertQuery = `
    INSERT INTO habitaciones (
      habitacion_disponible_id, paciente_id, doctor_id, fecha_ingreso,
      fecha_salida_estimada, estado_paciente, motivo_ingreso
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    habitacion_disponible_id, paciente_id, doctor_id, fecha_ingreso,
    fecha_salida_estimada || null, estado_paciente || 'Estable', motivo_ingreso || null
  ];

  try {
    console.log("BACKEND: createHabitacion - ANTES de await db.query(insertQuery). Values:", values);
    const [result] = await db.query(insertQuery, values); // Usar await
    console.log("BACKEND: createHabitacion - DESPUÉS de await db.query(insertQuery). Resultado:", JSON.stringify(result, null, 2));

    if (result.affectedRows === 0) {
      console.error('BACKEND: createHabitacion - No se insertaron filas.');
      // No es necesario un 'return' aquí si el res.status() es lo último
      res.status(500).json({ message: 'No se pudo registrar la asignación (affectedRows 0).' });
      return; // Añadido para claridad y seguridad
    }
    const nuevaAsignacionId = result.insertId;
    console.log(`BACKEND: createHabitacion - Inserción exitosa (ID: ${nuevaAsignacionId}). Procediendo a updateQuery.`);

    const updateQuery = `
      UPDATE habitaciones_disponibles
      SET estado = 'Ocupada'
      WHERE id = ? AND estado = 'Disponible'
    `;
    console.log("BACKEND: createHabitacion - ANTES de await db.query(updateQuery). habitacion_disponible_id:", habitacion_disponible_id);
    const [updateResult] = await db.query(updateQuery, [habitacion_disponible_id]); // Usar await
    console.log("BACKEND: createHabitacion - DESPUÉS de await db.query(updateQuery). UpdateResult:", JSON.stringify(updateResult, null, 2));

    if (updateResult.affectedRows === 0) {
      console.warn(`BACKEND: createHabitacion - No se actualizó estado de habitación ID ${habitacion_disponible_id}. Pudo estar ya ocupada o no existir.`);
      // Aún así, la asignación se creó. Enviar éxito.
    }

    console.log("BACKEND: createHabitacion - ENVIANDO RESPUESTA 201.");
    res.status(201).json({ message: 'Habitación asignada y estado actualizado.', id: nuevaAsignacionId });

  } catch (error) {
    console.error("BACKEND: createHabitacion - Error en el bloque try/catch (async):", error);
    res.status(500).json({ message: "Error en el servidor al procesar la asignación.", error: error.message });
  }
};

// Esta función devuelve las filas de la tabla 'habitaciones', que son las asignaciones.
// Es mejor renombrarla para que sea claro o usar getAllHabitaciones si esa es más completa.
exports.obtenerAsignaciones = async (req, res) => {
  console.log("BACKEND: obtenerAsignaciones - Solicitud RECIBIDA.");
  try {
    // Usar getAllHabitaciones es más descriptivo y trae más datos.
    // Si solo quieres las filas crudas de 'habitaciones':
    // const [rows] = await db.query('SELECT * FROM habitaciones ORDER BY fecha_ingreso DESC');
    // Redirigiendo a getAllHabitaciones o implementando su lógica aquí:
    const query = `
      SELECT h.*, 
             hd.numero AS numero_habitacion_asignada, /* Cambiado para evitar colisión con h.numero si existiera */
             hd.tipo AS tipo_habitacion_asignada,   /* Cambiado */
             p.nombre AS paciente_nombre,
             p.apellido AS paciente_apellido,
             d.nombre AS doctor_nombre,
             d.apellidos AS doctor_apellidos /* Cambiado */
      FROM habitaciones h
      LEFT JOIN pacientes p ON h.paciente_id = p.id
      LEFT JOIN doctores d ON h.doctor_id = d.id
      LEFT JOIN habitaciones_disponibles hd ON h.habitacion_disponible_id = hd.id
      ORDER BY h.fecha_ingreso DESC
    `;
    const [rows] = await db.query(query);
    console.log("BACKEND: obtenerAsignaciones (con detalles) - Consulta exitosa. ENVIANDO RESPUESTA.");
    res.json(rows);
  } catch (err) {
    console.error('BACKEND: obtenerAsignaciones - Error:', err);
    res.status(500).json({ error: 'Error del servidor al obtener asignaciones detalladas', details: err.message });
  }
};

// Esta función debe estar correctamente exportada y fuera de cualquier otro bloque de función.
exports.getAllHabitaciones = async (req, res) => { // Convertida a async/await para consistencia
  console.log("BACKEND: getAllHabitaciones - Solicitud RECIBIDA.");
  const query = `
    SELECT h.*, 
           hd.numero AS numero_habitacion_asignada, /* Cambiado para claridad */
           hd.tipo AS tipo_habitacion_asignada,   /* Cambiado */
           hd.estado AS estado_habitacion_fisica, /* Cambiado */
           p.nombre AS paciente_nombre,
           p.apellido AS paciente_apellido,
           d.nombre AS doctor_nombre,
           d.apellidos AS doctor_apellidos     /* Cambiado */
    FROM habitaciones h
    LEFT JOIN pacientes p ON h.paciente_id = p.id
    LEFT JOIN doctores d ON h.doctor_id = d.id
    LEFT JOIN habitaciones_disponibles hd ON h.habitacion_disponible_id = hd.id
    ORDER BY h.id DESC
  `;

  try {
    const [results] = await db.query(query);
    console.log("BACKEND: getAllHabitaciones - Consulta exitosa. ENVIANDO RESPUESTA.");
    res.json(results);
  } catch (err) {
    console.error('BACKEND: getAllHabitaciones - Error:', err);
    res.status(500).json({ message: 'Error al obtener todas las habitaciones con detalles', error: err.message });
  }
}; // <--- ASEGÚRATE QUE ESTE BLOQUE ESTÁ BIEN CERRADO Y NO DENTRO DE OTRO

exports.eliminarAsignacion = async (req, res) => {
  const { asignacionId } = req.params;
  console.log(`BACKEND: eliminarAsignacion - Solicitud RECIBIDA para ID: ${asignacionId}`);

  if (!asignacionId) {
      console.log("BACKEND: eliminarAsignacion - ID de asignación no proporcionado.");
      return res.status(400).json({ message: 'ID de asignación es requerido.' });
  }

  try {
      console.log(`BACKEND: eliminarAsignacion - Buscando asignación ID: ${asignacionId}`);
      const [asignacionInfo] = await db.query(
          'SELECT habitacion_disponible_id FROM habitaciones WHERE id = ?',
          [asignacionId]
      );

      if (!asignacionInfo.length) {
          console.log(`BACKEND: eliminarAsignacion - Asignación ID: ${asignacionId} no encontrada.`);
          return res.status(404).json({ message: 'Asignación no encontrada.' });
      }

      const habitacionFisicaId = asignacionInfo[0].habitacion_disponible_id;
      console.log(`BACKEND: eliminarAsignacion - Asignación encontrada. ID de habitación física a liberar: ${habitacionFisicaId}`);

      console.log(`BACKEND: eliminarAsignacion - Eliminando asignación ID: ${asignacionId} de la tabla 'habitaciones'.`);
      const [deleteResult] = await db.query(
          'DELETE FROM habitaciones WHERE id = ?',
          [asignacionId]
      );

      if (deleteResult.affectedRows === 0) {
          console.warn(`BACKEND: eliminarAsignacion - No se eliminaron filas para la asignación ID: ${asignacionId}. Pudo haber sido eliminada concurrentemente.`);
          return res.status(404).json({ message: 'No se pudo eliminar la asignación, puede que ya haya sido eliminada.' });
      }
      console.log(`BACKEND: eliminarAsignacion - Asignación ID: ${asignacionId} eliminada exitosamente.`);

      if (habitacionFisicaId) {
          console.log(`BACKEND: eliminarAsignacion - Actualizando estado de habitación física ID: ${habitacionFisicaId} a 'Disponible'.`);
          await db.query(
              "UPDATE habitaciones_disponibles SET estado = 'Disponible' WHERE id = ?",
              [habitacionFisicaId]
          );
          console.log(`BACKEND: eliminarAsignacion - Estado de habitación física ID: ${habitacionFisicaId} actualizado. ENVIANDO RESPUESTA 200.`);
          res.status(200).json({ message: `Asignación ID ${asignacionId} eliminada y habitación ${habitacionFisicaId} marcada como disponible.` });
      } else {
          console.warn(`BACKEND: eliminarAsignacion - Asignación ID ${asignacionId} eliminada, pero no tenía un habitacion_disponible_id asociado para liberar.`);
          res.status(200).json({ message: `Asignación ID ${asignacionId} eliminada. No se encontró ID de habitación física para liberar.` });
      }

  } catch (error) {
      console.error(`BACKEND: eliminarAsignacion - Error procesando ID ${asignacionId}:`, error);
      res.status(500).json({ message: 'Error interno del servidor al procesar la eliminación.', error: error.message });
  }
};