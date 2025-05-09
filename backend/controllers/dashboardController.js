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

        // Convert BLOB to Base64 for recent appointments
        const formattedRecentAppointments = recentAppointments.map(apt => ({
            ...apt,
            paciente_foto_base64: apt.paciente_foto ? Buffer.from(apt.paciente_foto).toString('base64') : null,
        }));


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
        // This query is more complex and might need adjustment based on your exact DB structure and desired output
        // For a real app, you might fetch raw data and process it in Node.js or use more advanced SQL
        const [patientMonthlyRows] = await db.query(`
            SELECT DATE_FORMAT(fecha_nacimiento, '%Y-%m') as month, COUNT(*) as count
            FROM pacientes
            WHERE fecha_nacimiento >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `); // This is a placeholder; a real patient registration date would be better.


        // --- Doctor Schedule (Simplified: Just counts for now) ---
        // For a real schedule, you'd need a 'doctor_availability' table or similar logic
        const [availableDoctorsList] = await db.query(`
            SELECT id, nombre, apellidos, especialidad, foto 
            FROM doctores 
            ORDER BY RAND()
            LIMIT 2 
        `); // Example: Randomly pick 2 'available' doctors
        
        const formattedAvailableDoctors = availableDoctorsList.map(doc => ({
            name: `${doc.nombre} ${doc.apellidos}`,
            specialty: doc.especialidad,
            avatar_base64: doc.foto ? Buffer.from(doc.foto).toString('base64') : null
        }));


        res.json({
            totalDoctors: { value: totalDoctors, chartData: [30, 40, 35, 50, 49, 60, 70] }, // Chart data still mock
            bookAppointment: { value: totalAppointmentsToday, daily: totalAppointmentsToday, chartData: [65, 59, 80, 81, 56, 55, 40]}, // Simplified
            roomAvailability: { 
                value: availableRooms + occupiedRooms, // Total rooms managed
                available: availableRooms,
                occupied: occupiedRooms,
                // For progress bars, you might need total General vs Private
                // This requires knowing total General and Private rooms from 'habitaciones_disponibles'
                // Example:
                general_total: 5, // Assuming 5 general rooms are in 'habitaciones_disponibles'
                private_total: 5, // Assuming 5 private rooms
            },
            overallVisitor: { value: totalPatients, daily: Math.floor(totalPatients / 30), chartData: [45, 70, 60, 80, 50, 75, 65] }, // Simplified
            
            patientOverview: { // Simplified, real data processing needed for stacked bar
                labels: patientMonthlyRows.map(r => r.month), // e.g., ['2024-01', '2024-02']
                datasets: [
                    { label: 'Pacientes Registrados (Mes)', data: patientMonthlyRows.map(r => r.count), backgroundColor: '#3399ff' },
                    // Add other datasets (hospitalized, ambulatory) if you have that data
                ],
            },
            topClinics: { // Based on doctor specialties
                labels: topSpecialtiesRows.map(s => s.especialidad),
                data: topSpecialtiesRows.map(s => s.count),
                total: topSpecialtiesRows.reduce((sum, s) => sum + s.count, 0),
                colors: ['#3399ff', '#85c2ff', '#ff99cc'] // Keep mock colors or generate
            },
            doctorsSchedule: {
                available: { count: totalDoctors, list: formattedAvailableDoctors }, // Simplified
                unavailable: { count: 0, list: [] }, // Needs more logic
                leave: { count: 0, list: [] } // Needs more logic
            },
            appointments: formattedRecentAppointments.map(apt => ({
                id: apt.id,
                name: `${apt.paciente_nombre} ${apt.paciente_apellido}`,
                avatar_base64: apt.paciente_foto_base64,
                specialty: apt.doctor_especialidad, // The doctor for the appointment
                time: new Date(apt.cita_fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'}),
                date: new Date(apt.cita_fecha).toLocaleDateString('es-ES')
            })),
            // CalendarActivities would require fetching appointments for the month
            calendarActivities: {} // Placeholder - very complex to implement fully here
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener estadísticas del dashboard.' });
    }
};

module.exports = {
    getDashboardStats
};