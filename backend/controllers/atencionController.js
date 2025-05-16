// src/controllers/atencionController.js
const db = require("../config/db"); 

// Obtener todas las atenciones o filtrar (ej. por cita_id_origen o id_paciente)
exports.getAllAtenciones = async (req, res) => {
    const { cita_id_origen, id_paciente, limit, offset } = req.query;
    let query = 'SELECT * FROM atenciones WHERE 1=1';
    const params = [];

    if (id_paciente) {
        query += ' AND id_paciente = ?';
        params.push(id_paciente);
    }
    if (cita_id_origen) {
        query += ' AND cita_id_origen = ?';
        params.push(cita_id_origen);
    }
    
    query += ' ORDER BY fecha_atencion DESC'; // Ordenar por fecha descendente

    if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit, 10));
        if (offset) {
            query += ' OFFSET ?';
            params.push(parseInt(offset, 10));
        }
    }

    try {
        const [rows] = await db.promise().query(query, params);
        // Parsear JSON si es string
        const atencionesProcesadas = rows.map(atencion => {
            if (atencion.datos_clinicos_adicionales_json && typeof atencion.datos_clinicos_adicionales_json === 'string') {
                try {
                    atencion.datos_clinicos_adicionales_json = JSON.parse(atencion.datos_clinicos_adicionales_json);
                } catch (e) {
                    console.warn(`Error parseando JSON para atencion ID ${atencion.id_atencion}`);
                    atencion.datos_clinicos_adicionales_json = null;
                }
            }
            return atencion;
        });

        if (rows.length === 0 && cita_id_origen) { // Para el caso específico de búsqueda por cita_id_origen
            return res.status(404).json([]); // Devolver array vacío para que el frontend maneje "no encontrado"
        }
        res.json(atencionesProcesadas);
    } catch (error) {
        console.error("Error fetching atenciones:", error);
        res.status(500).json({ error: "Error del servidor al obtener atenciones." });
    }
};

// Obtener una atención por ID
exports.getAtencionById = async (req, res) => {
    const { idAtencion } = req.params;
    try {
        const [rows] = await db.promise().query('SELECT * FROM atenciones WHERE id_atencion = ?', [idAtencion]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Atención no encontrada' });
        }
        const atencion = rows[0];
        // Parsear JSON si es string
        if (atencion.datos_clinicos_adicionales_json && typeof atencion.datos_clinicos_adicionales_json === 'string') {
            try {
                atencion.datos_clinicos_adicionales_json = JSON.parse(atencion.datos_clinicos_adicionales_json);
            } catch (e) {
                console.warn(`Error parseando JSON para atencion ID ${atencion.id_atencion}`);
                atencion.datos_clinicos_adicionales_json = null; // o un objeto vacío {} si es preferible
            }
        } else if (!atencion.datos_clinicos_adicionales_json) {
            atencion.datos_clinicos_adicionales_json = {}; // Asegurar que sea un objeto si es NULL
        }
        res.json(atencion);
    } catch (error) {
        console.error(`Error fetching atención ${idAtencion}:`, error);
        res.status(500).json({ error: 'Error del servidor al obtener la atención' });
    }
};

// Crear una nueva atención
exports.createAtencion = async (req, res) => {
    const {
        id_paciente,
        cita_id_origen, // Puede ser null
        fecha_atencion,
        tipo_atencion,
        edad_paciente_atencion,
        motivo_sintomas_principal,
        diagnostico_principal_cie10,
        diagnostico_texto_adicional,
        datos_clinicos_adicionales_json, // Frontend debe enviar esto como objeto
        observaciones_plan_tratamiento,
        // numero_reingresos_en_30_dias_posteriores se calculará después, no se envía en creación inicial
    } = req.body;

    if (!id_paciente || !fecha_atencion) {
        return res.status(400).json({ error: 'ID de paciente y fecha de atención son requeridos.' });
    }

    const datosJsonString = (typeof datos_clinicos_adicionales_json === 'object' && datos_clinicos_adicionales_json !== null)
                            ? JSON.stringify(datos_clinicos_adicionales_json)
                            : null;

    try {
        const [result] = await db.promise().query(
            `INSERT INTO atenciones (
                id_paciente, cita_id_origen, fecha_atencion, tipo_atencion, edad_paciente_atencion,
                motivo_sintomas_principal, diagnostico_principal_cie10, diagnostico_texto_adicional,
                datos_clinicos_adicionales_json, observaciones_plan_tratamiento, numero_reingresos_en_30_dias_posteriores
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`, // Inicializa numero_reingresos a 0
            [
                id_paciente, cita_id_origen || null, fecha_atencion, tipo_atencion, edad_paciente_atencion,
                motivo_sintomas_principal, diagnostico_principal_cie10, diagnostico_texto_adicional,
                datosJsonString, observaciones_plan_tratamiento
            ]
        );
        const newAtencionId = result.insertId;
        const [newAtencionRows] = await db.promise().query('SELECT * FROM atenciones WHERE id_atencion = ?', [newAtencionId]);
        
        // Parsear JSON antes de devolver
        const atencionCreada = newAtencionRows[0];
        if (atencionCreada.datos_clinicos_adicionales_json && typeof atencionCreada.datos_clinicos_adicionales_json === 'string') {
             atencionCreada.datos_clinicos_adicionales_json = JSON.parse(atencionCreada.datos_clinicos_adicionales_json);
        }

        res.status(201).json({ mensaje: 'Atención creada exitosamente', atencion: atencionCreada });
    } catch (error) {
        console.error("Error creando atención:", error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.message.includes('fk_atenc_cnt_paciente')) {
            return res.status(400).json({ error: `El paciente con ID ${id_paciente} no existe.` });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.message.includes('fk_atenc_cnt_cita_origen')) {
            return res.status(400).json({ error: `La cita con ID ${cita_id_origen} no existe.` });
        }
        res.status(500).json({ error: 'Error del servidor al crear la atención' });
    }
};

// Actualizar una atención existente
exports.updateAtencion = async (req, res) => {
    const { idAtencion } = req.params;
    const {
        tipo_atencion,
        motivo_sintomas_principal,
        diagnostico_principal_cie10,
        diagnostico_texto_adicional,
        datos_clinicos_adicionales_json, // Frontend debe enviar como objeto
        observaciones_plan_tratamiento,
        // Campos que NO se deben actualizar desde este endpoint general:
        // id_paciente, cita_id_origen, fecha_atencion, edad_paciente_atencion,
        // numero_reingresos_en_30_dias_posteriores (se actualiza por proceso batch)
    } = req.body;

    // Validación básica
    // if (!tipo_atencion) { // Ejemplo
    //     return res.status(400).json({ error: "Tipo de atención es requerido." });
    // }

    const datosJsonString = (typeof datos_clinicos_adicionales_json === 'object' && datos_clinicos_adicionales_json !== null)
                            ? JSON.stringify(datos_clinicos_adicionales_json)
                            : null;
    try {
        const [result] = await db.promise().query(
            `UPDATE atenciones SET 
                tipo_atencion = COALESCE(?, tipo_atencion), 
                motivo_sintomas_principal = COALESCE(?, motivo_sintomas_principal), 
                diagnostico_principal_cie10 = COALESCE(?, diagnostico_principal_cie10), 
                diagnostico_texto_adicional = COALESCE(?, diagnostico_texto_adicional), 
                datos_clinicos_adicionales_json = COALESCE(?, datos_clinicos_adicionales_json), 
                observaciones_plan_tratamiento = COALESCE(?, observaciones_plan_tratamiento),
                actualizado_en = CURRENT_TIMESTAMP
             WHERE id_atencion = ?`,
            [
                tipo_atencion,
                motivo_sintomas_principal,
                diagnostico_principal_cie10,
                diagnostico_texto_adicional,
                datosJsonString,
                observaciones_plan_tratamiento,
                idAtencion
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Atención no encontrada para actualizar' });
        }
        const [updatedRows] = await db.promise().query('SELECT * FROM atenciones WHERE id_atencion = ?', [idAtencion]);
        
        // Parsear JSON antes de devolver
        const atencionActualizada = updatedRows[0];
        if (atencionActualizada.datos_clinicos_adicionales_json && typeof atencionActualizada.datos_clinicos_adicionales_json === 'string') {
             atencionActualizada.datos_clinicos_adicionales_json = JSON.parse(atencionActualizada.datos_clinicos_adicionales_json);
        }

        res.json({ mensaje: 'Atención actualizada exitosamente', atencion: atencionActualizada });
    } catch (error) {
        console.error(`Error updating atención ${idAtencion}:`, error);
        res.status(500).json({ error: 'Error del servidor al actualizar la atención' });
    }
};

// Eliminar una atención (¡cuidado con esto! Usualmente no se eliminan datos clínicos)
exports.deleteAtencion = async (req, res) => {
    const { idAtencion } = req.params;
    try {
        // Considera si realmente quieres permitir la eliminación física.
        // Una alternativa es un borrado lógico (marcar como 'eliminada' o 'anulada').
        const [result] = await db.promise().query('DELETE FROM atenciones WHERE id_atencion = ?', [idAtencion]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Atención no encontrada para eliminar' });
        }
        res.json({ mensaje: 'Atención eliminada exitosamente' });
    } catch (error) {
        console.error(`Error deleting atención ${idAtencion}:`, error);
        res.status(500).json({ error: 'Error del servidor al eliminar la atención' });
    }
};  