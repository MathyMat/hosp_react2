// backend/controllers/dashboardController.js
const db = require('../config/db'); // Assuming you have a db.js for database connection

const getDashboardStats = async (req, res) => {
    try {
        // --- Total Doctors ---
        const [doctorRows] = await db.query("SELECT COUNT(*) as totalDoctors FROM doctores");
        const totalDoctors = doctorRows[0].totalDoctors;

        // --- Total Patients ---
        const [patientRows] = await db.query("SELECT COUNT(*) as totalPatients FROM pacientes");
        const totalPatients = patientRows[0].totalPatients;

        // --- Total Appointments (Example: today's appointments) ---
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const [appointmentRows] = await db.query(
            "SELECT COUNT(*) as totalAppointmentsToday FROM citas WHERE DATE(fecha) = ?",
            [today]
        );
        const totalAppointmentsToday = appointmentRows[0].totalAppointmentsToday;

        // --- Room Availability ---
        const [availableRoomRows] = await db.query(
            "SELECT COUNT(*) as availableRooms FROM habitaciones_disponibles WHERE estado = 'Disponible'"
        );
        const availableRooms = availableRoomRows[0].availableRooms;

        const [occupiedRoomRows] = await db.query(
            "SELECT COUNT(*) as occupiedRooms FROM habitaciones_disponibles WHERE estado = 'Ocupada'"
        );
        const occupiedRooms = occupiedRoomRows[0].occupiedRooms;
        
        // --- Get total general and private rooms for progress bar calculation ---
        const [generalRoomCountRows] = await db.query(
            "SELECT COUNT(*) as count FROM habitaciones_disponibles WHERE tipo = 'General'"
        );
        const totalGeneralRoomsDB = generalRoomCountRows[0]?.count || 0;

        const [privateRoomCountRows] = await db.query(
            "SELECT COUNT(*) as count FROM habitaciones_disponibles WHERE tipo = 'Privada'"
        );
        const totalPrivateRoomsDB = privateRoomCountRows[0]?.count || 0;


        // --- Recent Appointments (Example: 5 most recent for today or upcoming) ---
        const [recentAppointments] = await db.query(`
            SELECT 
                c.id, 
                p.nombre as paciente_nombre, 
                p.apellido as paciente_apellido, 
                p.foto as paciente_foto,
                d.nombre as doctor_nombre, 
                d.apellidos as doctor_apellidos,
                d.especialidad as doctor_especialidad,
                c.fecha as cita_fecha,
                c.motivo as cita_motivo
            FROM citas c
            JOIN pacientes p ON c.paciente_id = p.id
            JOIN doctores d ON c.doctor_id = d.id
            WHERE c.fecha >= CURDATE() 
            ORDER BY c.fecha ASC 
            LIMIT 5
        `);

        const formattedRecentAppointments = recentAppointments.map(apt => ({
            ...apt,
            paciente_foto_base64: apt.paciente_foto ? Buffer.from(apt.paciente_foto).toString('base64') : null,
        }));
        console.log("Formatted Recent Appointments (first one):", formattedRecentAppointments.length > 0 ? formattedRecentAppointments[0] : "No recent appointments");


        // --- Top 3 Doctor Specialties (based on number of doctors) ---
        const [topSpecialtiesRows] = await db.query(`
            SELECT especialidad, COUNT(*) as count 
            FROM doctores 
            WHERE especialidad IS NOT NULL AND especialidad != ''
            GROUP BY especialidad 
            ORDER BY count DESC 
            LIMIT 3
        `);
        
        // --- Patient Overview (Simplified: Total patients per month for the last 6 months) ---
        const [patientMonthlyRows] = await db.query(`
            SELECT DATE_FORMAT(p.fecha_registro_sistema, '%Y-%m') as month, COUNT(*) as count
            FROM pacientes p
            WHERE p.fecha_registro_sistema >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) 
            GROUP BY month
            ORDER BY month ASC
        `); // Note: Assumes a 'fecha_registro_sistema' column in 'pacientes'. If not, use another date like 'fecha_nacimiento' but the meaning changes.


        // --- Doctor Schedule (Simplified: Just counts for now) ---
        const [availableDoctorsList] = await db.query(`
            SELECT id, nombre, apellidos, especialidad, foto 
            FROM doctores 
            ORDER BY RAND()
            LIMIT 3
        `); 
        
        const formattedAvailableDoctors = availableDoctorsList.map(doc => ({
            name: `${doc.nombre} ${doc.apellidos}`,
            specialty: doc.especialidad,
            avatar_base64: doc.foto ? Buffer.from(doc.foto).toString('base64') : null
        }));

        // --- Calendar Activities ---
        const [appointmentCalendarRows] = await db.query(`
            SELECT 
                DATE_FORMAT(fecha, '%Y-%m-%d') as date, 
                TIME_FORMAT(fecha, '%H:%i') as time,
                motivo,
                estado 
            FROM citas 
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) AND fecha <= DATE_ADD(CURDATE(), INTERVAL 2 MONTH) 
            ORDER BY fecha ASC
        `);

        const calendarActivities = {};
        appointmentCalendarRows.forEach(cita => {
            if (!calendarActivities[cita.date]) {
                calendarActivities[cita.date] = [];
            }
            let color = 'secondary'; 
            if (cita.estado === 'pendiente') color = 'warning';
            else if (cita.estado === 'confirmada') color = 'info';
            else if (cita.estado === 'completada') color = 'success';
            else if (cita.estado === 'cancelada') color = 'danger';

            calendarActivities[cita.date].push({
                time: new Date(`1970-01-01T${cita.time}:00Z`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC'}),
                title: cita.motivo || 'Cita Programada',
                color: color 
            });
        });


        res.json({
            totalDoctors: { value: totalDoctors, chartData: [30, 40, 35, 50, 49, 60, 70] },
            bookAppointment: { value: totalAppointmentsToday, daily: totalAppointmentsToday, chartData: [65, 59, 80, 81, 56, 55, 40]},
            roomAvailability: { 
                value: availableRooms + occupiedRooms,
                available: availableRooms,
                occupied: occupiedRooms,
                general_total: totalGeneralRoomsDB,
                private_total: totalPrivateRoomsDB,
                // For occupied general/private, you'd need to join habitaciones with habitaciones_disponibles
                // and count occupied rooms by type. This is a simplification:
                general_occupied: Math.min(Math.floor(occupiedRooms * (totalGeneralRoomsDB / (totalGeneralRoomsDB + totalPrivateRoomsDB || 1))), totalGeneralRoomsDB),
                private_occupied: Math.min(Math.ceil(occupiedRooms * (totalPrivateRoomsDB / (totalGeneralRoomsDB + totalPrivateRoomsDB || 1))), totalPrivateRoomsDB),
            },
            overallVisitor: { value: totalPatients, daily: Math.floor(totalPatients / 30), chartData: [45, 70, 60, 80, 50, 75, 65] }, 
            
            patientOverview: {
                labels: patientMonthlyRows.map(r => {
                    const [year, monthNum] = r.month.split('-');
                    return new Date(year, monthNum - 1, 1).toLocaleString('es-ES', { month: 'short' });
                }), 
                datasets: [
                    { label: 'Pacientes Registrados', data: patientMonthlyRows.map(r => r.count), backgroundColor: '#3399ff', barPercentage: 0.6 },
                ],
            },
            topClinics: { 
                labels: topSpecialtiesRows.map(s => s.especialidad),
                data: topSpecialtiesRows.map(s => s.count),
                total: topSpecialtiesRows.reduce((sum, s) => sum + s.count, 0),
                colors: ['#3399ff', '#85c2ff', '#ff99cc', '#f8c32d', '#4bc0c0'] // Added more colors
            },
            doctorsSchedule: {
                available: { count: formattedAvailableDoctors.length, list: formattedAvailableDoctors }, 
                unavailable: { count: 0, list: [] }, 
                leave: { count: 0, list: [] } 
            },
            appointments: formattedRecentAppointments.map(apt => ({
                id: apt.id,
                name: `${apt.paciente_nombre} ${apt.paciente_apellido}`,
                paciente_foto_base64: apt.paciente_foto_base64,
                doctor_specialty: apt.doctor_especialidad,
                doctor_name: `${apt.doctor_nombre} ${apt.doctor_apellidos}`,
                time: new Date(apt.cita_fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'}),
                date: new Date(apt.cita_fecha).toLocaleDateString('es-ES', {day: '2-digit', month: 'numeric', year: 'numeric'})
            })),
            calendarActivities: calendarActivities
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener estadísticas del dashboard.' });
    }
};

module.exports = {
    getDashboardStats
};