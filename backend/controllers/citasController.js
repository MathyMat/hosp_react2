// backend/controllers/citasController.js
const db = require('../config/db'); // Ajusta la ruta a tu configuración de DB
const bcrypt = require("bcryptjs"); // Aunque no se usa aquí, puede ser necesario en otros controllers
const jwt = require("jsonwebtoken"); // Necesario si proteges rutas con middleware
require('dotenv').config();

exports.obtenerCitas = async (req, res) => {
  console.log("BACKEND: obtenerCitas - Solicitud RECIBIDA.");
  try {
    const [rows] = await db.query(`
      SELECT 
        c.id, 
        c.paciente_id,
        c.doctor_id,
        c.fecha, 
        c.motivo, 
        c.estado, 
        c.notas, 
        c.especialidad_cita, -- La especialidad guardada con la cita
        p.nombre AS paciente_nombre, 
        p.apellido AS paciente_apellido, 
        p.dni AS paciente_dni,
        p.foto AS paciente_foto_buffer, -- Foto del paciente
        d.nombre AS doctor_nombre, 
        d.apellidos AS doctor_apellidos, 
        d.especialidad AS doctor_especialidad_actual, -- Especialidad actual del doctor
        d.foto AS doctor_foto_buffer -- Foto del doctor
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN doctores d ON c.doctor_id = d.id
      ORDER BY c.fecha DESC
    `);

    const citasProcesadas = rows.map(cita => {
      let doctorFotoBase64 = null;
      if (cita.doctor_foto_buffer && Buffer.isBuffer(cita.doctor_foto_buffer) && cita.doctor_foto_buffer.length > 0) {
        doctorFotoBase64 = Buffer.from(cita.doctor_foto_buffer).toString('base64');
      }
      let pacienteFotoBase64 = null;
      if (cita.paciente_foto_buffer && Buffer.isBuffer(cita.paciente_foto_buffer) && cita.paciente_foto_buffer.length > 0) {
        pacienteFotoBase64 = Buffer.from(cita.paciente_foto_buffer).toString('base64');
      }
      
      // Remover los buffers originales
      const { doctor_foto_buffer, paciente_foto_buffer, ...citaResto } = cita; 
      
      return {
        ...citaResto,
        doctor_foto_base64: doctorFotoBase64,
        paciente_foto_base64: pacienteFotoBase64,
        // Usar la especialidad guardada con la cita, o la actual del doctor como fallback
        especialidad_cita: cita.especialidad_cita || cita.doctor_especialidad_actual || 'N/A' 
      };
    });

    console.log("BACKEND: obtenerCitas - Citas obtenidas (primer item):", citasProcesadas.length > 0 ? citasProcesadas[0] : "Ninguna");
    res.json(citasProcesadas);

  } catch (error) {
    console.error("BACKEND: obtenerCitas - Error:", error);
    res.status(500).json({ error: 'Error al obtener citas', details: error.message });
  }
};

exports.crearCita = async (req, res) => {
  const { 
    paciente_id, doctor_id, fecha, motivo, estado = 'pendiente', notas, 
    especialidad_cita // Campo que viene del frontend
  } = req.body;
  console.log("BACKEND: crearCita - Solicitud RECIBIDA. Body:", req.body);

  if (!paciente_id || !doctor_id || !fecha || !motivo || !especialidad_cita) {
    console.log("BACKEND: crearCita - Campos faltantes.");
    return res.status(400).json({ error: "Paciente, doctor, especialidad de la cita, fecha y motivo son requeridos." });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO citas (paciente_id, doctor_id, especialidad_cita, fecha, motivo, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [paciente_id, doctor_id, especialidad_cita, fecha, motivo, estado, notas || null]
    );
    const nuevaCitaId = result.insertId;
    console.log(`BACKEND: crearCita - Cita creada con ID: ${nuevaCitaId}`);
    
    // Devolver la cita recién creada con todos los detalles necesarios para la UI
    const [citasCreadas] = await db.query(`
        SELECT 
            c.*, /* Todos los campos de la cita recién creada */
            p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.dni AS paciente_dni,
            p.foto AS paciente_foto_buffer,
            d.nombre AS doctor_nombre, d.apellidos AS doctor_apellidos, 
            d.especialidad AS doctor_especialidad_actual, d.foto AS doctor_foto_buffer
        FROM citas c
        LEFT JOIN pacientes p ON c.paciente_id = p.id
        LEFT JOIN doctores d ON c.doctor_id = d.id
        WHERE c.id = ?
    `, [nuevaCitaId]);

    if (citasCreadas.length > 0) {
        const citaOriginal = citasCreadas[0];
        let doctorFotoBase64 = null;
        if (citaOriginal.doctor_foto_buffer && Buffer.isBuffer(citaOriginal.doctor_foto_buffer) && citaOriginal.doctor_foto_buffer.length > 0) {
            doctorFotoBase64 = Buffer.from(citaOriginal.doctor_foto_buffer).toString('base64');
        }
        let pacienteFotoBase64 = null;
        if (citaOriginal.paciente_foto_buffer && Buffer.isBuffer(citaOriginal.paciente_foto_buffer) && citaOriginal.paciente_foto_buffer.length > 0) {
            pacienteFotoBase64 = Buffer.from(citaOriginal.paciente_foto_buffer).toString('base64');
        }

        const { doctor_foto_buffer, paciente_foto_buffer, ...citaSinBuffers } = citaOriginal;
        const citaParaEnviar = {
            ...citaSinBuffers,
            doctor_foto_base64: doctorFotoBase64,
            paciente_foto_base64: pacienteFotoBase64,
            // Asegurar que la especialidad tenga un valor
            especialidad_cita: citaOriginal.especialidad_cita || citaOriginal.doctor_especialidad_actual || 'N/A'
        };

        res.status(201).json({ mensaje: "Cita creada exitosamente", cita: citaParaEnviar });
    } else {
        console.error(`BACKEND: crearCita - No se pudo recuperar la cita recién creada con ID: ${nuevaCitaId}`);
        res.status(201).json({ mensaje: "Cita creada, pero no se pudo recuperar el detalle completo.", id: nuevaCitaId });
    }
  } catch (error) {
    console.error("BACKEND: crearCita - Error:", error);
    res.status(500).json({ error: 'Error al crear cita', details: error.message });
  }
};

exports.actualizarEstadoCita = async (req, res) => { 
  const citaId = req.params.id;
  const { estado } = req.body; 
  console.log(`BACKEND: actualizarEstadoCita - ID: ${citaId}, Nuevo Estado: ${estado}`);

  if (!citaId) return res.status(400).json({ error: "ID de cita es requerido." });
  if (!estado) return res.status(400).json({ error: "El nuevo estado es requerido." });
  const estadosPermitidos = ['pendiente', 'confirmada', 'cancelada', 'completada'];
  if (!estadosPermitidos.includes(estado)) return res.status(400).json({ error: "Valor de estado no válido." });

  try {
    const [result] = await db.query('UPDATE citas SET estado = ? WHERE id = ?', [estado, citaId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Cita no encontrada." });
    
    console.log(`BACKEND: actualizarEstadoCita - Estado de cita ID: ${citaId} actualizado a ${estado}.`);
    
    // Devolver la cita actualizada con todos los detalles
    const [citasActualizadas] = await db.query(`
        SELECT c.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.dni AS paciente_dni, p.foto AS paciente_foto_buffer,
               d.nombre AS doctor_nombre, d.apellidos AS doctor_apellidos, d.especialidad AS doctor_especialidad_actual, d.foto AS doctor_foto_buffer
        FROM citas c LEFT JOIN pacientes p ON c.paciente_id = p.id LEFT JOIN doctores d ON c.doctor_id = d.id
        WHERE c.id = ?`, [citaId]);

    if (citasActualizadas.length > 0) {
        const citaOriginal = citasActualizadas[0];
        let doctorFotoBase64 = (citaOriginal.doctor_foto_buffer && Buffer.isBuffer(citaOriginal.doctor_foto_buffer) && citaOriginal.doctor_foto_buffer.length > 0) ? Buffer.from(citaOriginal.doctor_foto_buffer).toString('base64') : null;
        let pacienteFotoBase64 = (citaOriginal.paciente_foto_buffer && Buffer.isBuffer(citaOriginal.paciente_foto_buffer) && citaOriginal.paciente_foto_buffer.length > 0) ? Buffer.from(citaOriginal.paciente_foto_buffer).toString('base64') : null;
        const { doctor_foto_buffer, paciente_foto_buffer, ...citaSinBuffers } = citaOriginal;
        const citaParaEnviar = { ...citaSinBuffers, doctor_foto_base64: doctorFotoBase64, paciente_foto_base64: pacienteFotoBase64, especialidad_cita: citaOriginal.especialidad_cita || citaOriginal.doctor_especialidad_actual || 'N/A' };
        res.status(200).json({ mensaje: "Estado de la cita actualizado exitosamente.", cita: citaParaEnviar });
    } else {
        res.status(404).json({ error: "Cita no encontrada después de actualizar." });
    }
  } catch (error) {
    console.error(`BACKEND: actualizarEstadoCita - Error para ID ${citaId}:`, error);
    res.status(500).json({ error: 'Error al actualizar el estado de la cita', details: error.message });
  }
};

exports.eliminarCita = async (req, res) => { 
  const citaId = req.params.id;
  console.log(`BACKEND: eliminarCita - Solicitud RECIBIDA para ID: ${citaId}`);
  if (!citaId) return res.status(400).json({ error: "ID de cita es requerido." });

  try {
    const [result] = await db.query('DELETE FROM citas WHERE id = ?', [citaId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Cita no encontrada." });
    
    console.log(`BACKEND: eliminarCita - Cita ID: ${citaId} eliminada.`);
    res.status(200).json({ mensaje: "Cita eliminada exitosamente." }); 
  } catch (error) {
    console.error(`BACKEND: eliminarCita - Error para ID ${citaId}:`, error);
    res.status(500).json({ error: 'Error al eliminar cita', details: error.message });
  }
};