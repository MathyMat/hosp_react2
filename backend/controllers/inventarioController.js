// backend/controllers/inventarioController.js
const db = require('../config/db');

// Obtener todo el inventario
exports.obtenerInventario = async (req, res) => {
  console.log("BACKEND: inventarioController.obtenerInventario - Solicitud RECIBIDA.");
  try {
    const [filas] = await db.query("SELECT id, nombre, cantidad, descripcion, categoria, foto FROM inventario ORDER BY id DESC");
    
    const inventarioConFotos = filas.map(item => {
      if (item.foto) {
        return { ...item, fotoBase64: Buffer.from(item.foto).toString('base64') };
      }
      return { ...item, fotoBase64: null };
    });

    res.json(inventarioConFotos);
  } catch (err) {
    console.error("BACKEND: inventarioController.obtenerInventario - Error:", err);
    res.status(500).json({ mensaje: "Error al obtener inventario", error: err.message });
  }
};

// Crear nuevo insumo
exports.crearInsumo = async (req, res) => {
  const { nombre, cantidad, descripcion, categoria } = req.body; // Añadido categoria
  let fotoBuffer = null;

  if (req.file && req.file.buffer) {
    fotoBuffer = req.file.buffer;
  }
  console.log("BACKEND: inventarioController.crearInsumo - Body:", req.body, "Foto:", fotoBuffer ? "Sí" : "No");

  if (!nombre || cantidad === undefined || cantidad === null || !descripcion || !categoria) { // Añadida validación de categoria
    return res.status(400).json({ mensaje: "Nombre, cantidad, descripción y categoría son requeridos." });
  }
  if (isNaN(Number(cantidad)) || Number(cantidad) < 0) {
    return res.status(400).json({ mensaje: "La cantidad debe ser un número no negativo." });
  }
  if (req.fileValidationError) {
    return res.status(400).json({ mensaje: req.fileValidationError });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO inventario (nombre, cantidad, descripcion, categoria, foto) VALUES (?, ?, ?, ?, ?)', 
      [nombre, Number(cantidad), descripcion, categoria, fotoBuffer]
    );
    console.log(`BACKEND: inventarioController.crearInsumo - Insumo creado con ID: ${result.insertId}`);
    
    let newFotoBase64 = null;
    if (fotoBuffer) {
        newFotoBase64 = fotoBuffer.toString('base64');
    }

    res.status(201).json({ 
        mensaje: 'Insumo agregado exitosamente', 
        insumo: {
            id: result.insertId, nombre, cantidad: Number(cantidad), descripcion, categoria,
            fotoBase64: newFotoBase64
        }
    });
  } catch (err) {
    console.error("BACKEND: inventarioController.crearInsumo - Error:", err);
    res.status(500).json({ mensaje: "Error al agregar insumo", error: err.message });
  }
};

// Actualizar insumo
exports.actualizarInsumo = async (req, res) => {
  const { id } = req.params;
  const { nombre, cantidad, descripcion, categoria } = req.body; // Añadido categoria
  let fotoBuffer = null;

  if (req.file && req.file.buffer) {
    fotoBuffer = req.file.buffer;
  }
  console.log(`BACKEND: inventarioController.actualizarInsumo - ID: ${id}, Body:`, req.body, "Foto:", fotoBuffer ? "Sí" : "No");

  if (!nombre || cantidad === undefined || cantidad === null || !descripcion || !categoria) { // Añadida validación de categoria
    return res.status(400).json({ mensaje: "Nombre, cantidad, descripción y categoría son requeridos." });
  }
   if (isNaN(Number(cantidad)) || Number(cantidad) < 0) {
    return res.status(400).json({ mensaje: "La cantidad debe ser un número no negativo." });
  }
  if (req.fileValidationError) {
    return res.status(400).json({ mensaje: req.fileValidationError });
  }

  try {
    let query = 'UPDATE inventario SET nombre=?, cantidad=?, descripcion=?, categoria=?';
    const queryParams = [nombre, Number(cantidad), descripcion, categoria];

    if (fotoBuffer) {
      query += ', foto=?';
      queryParams.push(fotoBuffer);
    }
    query += ' WHERE id=?';
    queryParams.push(id);

    const [result] = await db.query(query, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Insumo no encontrado o datos idénticos." });
    }
    console.log(`BACKEND: inventarioController.actualizarInsumo - Insumo ID: ${id} actualizado.`);
    
    let newFotoBase64 = null;
    if (fotoBuffer) {
        newFotoBase64 = fotoBuffer.toString('base64');
    } else {
        const [currentInsumo] = await db.query("SELECT foto FROM inventario WHERE id = ?", [id]);
        if (currentInsumo.length > 0 && currentInsumo[0].foto) {
            newFotoBase64 = Buffer.from(currentInsumo[0].foto).toString('base64');
        }
    }

    res.json({ 
        mensaje: 'Insumo actualizado exitosamente',
        insumo: {
            id: parseInt(id), nombre, cantidad: Number(cantidad), descripcion, categoria,
            fotoBase64: newFotoBase64
        }
    });
  } catch (err) {
    console.error("BACKEND: inventarioController.actualizarInsumo - Error:", err);
    res.status(500).json({ mensaje: "Error al actualizar insumo", error: err.message });
  }
};

// Eliminar insumo
exports.eliminarInsumo = async (req, res) => {
  const { id } = req.params;
  console.log(`BACKEND: inventarioController.eliminarInsumo - ID: ${id}`);
  try {
    const [result] = await db.query('DELETE FROM inventario WHERE id=?', [id]);
    if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Insumo no encontrado." });
    }
    console.log(`BACKEND: inventarioController.eliminarInsumo - Insumo ID: ${id} eliminado.`);
    res.json({ mensaje: 'Insumo eliminado exitosamente' });
  } catch (err) {
    console.error("BACKEND: inventarioController.eliminarInsumo - Error:", err);
    res.status(500).json({ mensaje: "Error al eliminar insumo", error: err.message });
  }
};