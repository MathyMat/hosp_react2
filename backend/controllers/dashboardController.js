// Backend - controller/dashboardController.js
const db = require('../config/db');

// Resumen del sistema
exports.getResumen = async (req, res) => {
  try {
    const [[pacientes]] = await db.query('SELECT COUNT(*) AS total FROM pacientes');
    const [[citas]] = await db.query('SELECT COUNT(*) AS total FROM citas');
    const [[ocupadas]] = await db.query("SELECT COUNT(*) AS total FROM habitaciones_disponibles WHERE estado = 'Ocupada'");
    const [[emergencias]] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM citas 
      WHERE motivo LIKE '%emergencia%' AND DATE(fecha) = CURDATE()
    `);
    const [[espera]] = await db.query(`
      SELECT AVG(TIMESTAMPDIFF(MINUTE, fecha, NOW())) AS promedio 
      FROM citas 
      WHERE estado != 'pendiente'
    `);

    res.json({
      pacientes: pacientes.total,
      citas: citas.total,
      ocupadas: ocupadas.total,
      emergencias: emergencias.total,
      espera: Math.round(espera.promedio || 0),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

// Últimas actividades
exports.getActividades = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT(p.nombre, ' ', p.apellido) AS paciente, 
        CONCAT(d.nombre, ' ', d.apellidos) AS doctor, 
        d.especialidad,
        c.fecha,
        c.estado,
        c.motivo,
        TIMESTAMPDIFF(MINUTE, c.fecha, NOW()) AS minutos_ago
      FROM citas c
      JOIN pacientes p ON c.paciente_id = p.id
      JOIN doctores d ON c.doctor_id = d.id
      ORDER BY c.fecha DESC
      LIMIT 6
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener actividades' });
  }
};

// Distribución de pacientes y tipos de citas
exports.getDistribucion = async (req, res) => {
  try {
    const [[masculinos]] = await db.query("SELECT COUNT(*) AS total FROM pacientes WHERE genero = 'Masculino'");
    const [[femeninos]] = await db.query("SELECT COUNT(*) AS total FROM pacientes WHERE genero = 'Femenino'");
    const [tipos] = await db.query(`
      SELECT motivo AS tipo, COUNT(*) AS total 
      FROM citas 
      GROUP BY motivo
    `);

    res.json({
      sexos: {
        masculinos: masculinos.total,
        femeninos: femeninos.total,
      },
      tipos,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener distribución' });
  }
};
