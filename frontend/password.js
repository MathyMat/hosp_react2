const bcrypt = require("bcryptjs");
const nuevaPassword = '123456';
const hashed = await bcrypt.hash(nuevaPassword, 10);

// Luego actualizas en la base de datos:
await db.query("UPDATE usuarios SET password = ? WHERE correo = ?", [hashed, 'paciente@hospital.com']);