const db = require('../config/db');

exports.crearItemFactura = async (req, res) => {
    try {
        const {
            numero_factura,
            paciente_id,
            descripcion,
            cantidad,
            precio_unitario,
            precio_total
        } = req.body;

        // Verificar que el paciente existe
        const [paciente] = await db.query('SELECT * FROM pacientes WHERE id = ?', [paciente_id]);
        if (!paciente.length) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        const [resultado] = await db.query(
            `INSERT INTO facturas_servicios 
             (numero_factura, paciente_id, descripcion, cantidad, precio_unitario, precio_total, fecha_emision)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [numero_factura, paciente_id, descripcion, cantidad, precio_unitario, precio_total]
        );

        // Obtener el ítem recién creado con datos del paciente
        const [itemCreado] = await db.query(
            `SELECT fs.*, p.nombre, p.apellido, p.dni, p.direccion
             FROM facturas_servicios fs
             JOIN pacientes p ON fs.paciente_id = p.id
             WHERE fs.id = ?`,
            [resultado.insertId]
        );

        // Formatear respuesta
        const item = itemCreado[0];
        const respuesta = {
            id: item.id,
            numero_factura: item.numero_factura,
            paciente_id: item.paciente_id,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            precio_total: item.precio_total,
            fecha_emision: item.fecha_emision,
            paciente_nombre: `${item.nombre} ${item.apellido}`,
            dni: item.dni,
            direccion: item.direccion
        };

        res.status(201).json({ 
            mensaje: 'Ítem de factura registrado correctamente', 
            item: respuesta
        });
    } catch (error) {
        console.error('Error al registrar ítem de factura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.obtenerItemsPorFactura = async (req, res) => {
    try {
        const { numero_factura } = req.params;

        const [items] = await db.query(
            `SELECT fs.*, p.nombre, p.apellido, p.dni, p.direccion
             FROM facturas_servicios fs
             JOIN pacientes p ON fs.paciente_id = p.id
             WHERE fs.numero_factura = ?
             ORDER BY fs.fecha_emision DESC`,
            [numero_factura]
        );

        // Formatear respuesta
        const itemsFormateados = items.map(item => ({
            id: item.id,
            numero_factura: item.numero_factura,
            paciente_id: item.paciente_id,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            precio_total: item.precio_total,
            fecha_emision: item.fecha_emision,
            paciente_nombre: `${item.nombre} ${item.apellido}`,
            dni: item.dni,
            direccion: item.direccion
        }));

        res.json(itemsFormateados);
    } catch (error) {
        console.error('Error al obtener ítems de factura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};