import React, { useState, useRef } from "react";
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast'; // Para notificaciones

// Estilos (asegúrate de tenerlos en tu proyecto)
import 'primereact/resources/themes/lara-light-indigo/theme.css'; 
import 'primereact/resources/primereact.min.css';          
import 'primeicons/primeicons.css';                       
// PrimeFlex para layout fácil (opcional pero recomendado con PrimeReact)
// Si no lo tienes, puedes usar CSS normal o Tailwind (como en tu ejemplo original)
// import 'primeflex/primeflex.css'; // Descomenta si instalas y usas PrimeFlex

export default function GestionCitasHospital() {
    // Estado para la cita actual
    const [selectedDateTime, setSelectedDateTime] = useState(null);
    const [patientName, setPatientName] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [appointmentReason, setAppointmentReason] = useState('');

    // Estado para almacenar todas las citas
    const [appointments, setAppointments] = useState([]);

    // Referencia para el Toast (notificaciones)
    const toast = useRef(null);

    // Función para guardar la cita
    const handleSaveAppointment = () => {
        // Validación básica
        if (!selectedDateTime || !patientName) {
             toast.current.show({ 
                severity: 'warn', 
                summary: 'Campos requeridos', 
                detail: 'Por favor, seleccione fecha/hora y nombre del paciente.', 
                life: 3000 
            });
            return;
        }

        const newAppointment = {
            id: Date.now(), // ID simple basado en timestamp
            dateTime: selectedDateTime,
            patient: patientName,
            doctor: doctorName || 'No especificado', // Valor por defecto si está vacío
            reason: appointmentReason || 'Consulta general', // Valor por defecto
        };

        // Añadir la nueva cita a la lista
        setAppointments([...appointments, newAppointment]);

        // Limpiar el formulario
        setSelectedDateTime(null);
        setPatientName('');
        setDoctorName('');
        setAppointmentReason('');

        // Mostrar notificación de éxito
        toast.current.show({ 
            severity: 'success', 
            summary: 'Éxito', 
            detail: 'Cita guardada correctamente.', 
            life: 3000 
        });
    };

    // Función para formatear la fecha en la tabla
    const formatDateTime = (rowData) => {
        return rowData.dateTime.toLocaleString('es-ES', { // Ajusta el locale si es necesario
             year: 'numeric', 
             month: 'long', 
             day: 'numeric', 
             hour: '2-digit', 
             minute: '2-digit' 
        });
    }

    return (
        // Contenedor principal centrado (usando flexbox estándar)
        <div className="flex justify-content-center align-items-start min-h-screen p-4 bg-gray-100"> 
            <Toast ref={toast} /> 
            {/* Card principal */}
            <div className="card p-4 shadow-2 border-round w-full md:w-8 lg:w-6"> 
                <h2 className="text-center mb-4 font-bold text-2xl text-primary">Gestión de Citas Hospitalarias</h2>

                {/* Sección del Formulario */}
                <div className="mb-5 grid formgrid p-fluid"> {/* p-fluid hace que los inputs ocupen el ancho */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="patientName" className="font-semibold block mb-2">Nombre del Paciente</label>
                        <InputText 
                            id="patientName" 
                            value={patientName} 
                            onChange={(e) => setPatientName(e.target.value)} 
                            placeholder="Ingrese nombre completo" 
                        />
                    </div>
                    <div className="field col-12 md:col-6">
                         <label htmlFor="dateTime" className="font-semibold block mb-2">Fecha y Hora de la Cita</label>
                        <Calendar 
                            id="dateTime"
                            value={selectedDateTime} 
                            onChange={(e) => setSelectedDateTime(e.value)} 
                            showTime // Mostrar selector de hora
                            hourFormat="12" // o '24'
                            showIcon 
                            placeholder="Seleccione fecha y hora"
                            dateFormat="dd/mm/yy" // Formato de fecha
                            className="w-full" // Ocupa todo el ancho del contenedor grid
                        />
                    </div>
                     <div className="field col-12 md:col-6">
                        <label htmlFor="doctorName" className="font-semibold block mb-2">Nombre del Médico (Opcional)</label>
                        <InputText 
                            id="doctorName" 
                            value={doctorName} 
                            onChange={(e) => setDoctorName(e.target.value)} 
                            placeholder="Nombre del doctor asignado"
                        />
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="reason" className="font-semibold block mb-2">Motivo de la Cita (Opcional)</label>
                        <InputText 
                            id="reason" 
                            value={appointmentReason} 
                            onChange={(e) => setAppointmentReason(e.target.value)} 
                            placeholder="Ej: Consulta, Revisión, Estudio"
                        />
                    </div>
                    <div className="col-12 text-center mt-3">
                        <Button 
                            label="Guardar Cita" 
                            icon="pi pi-save" 
                            onClick={handleSaveAppointment} 
                            className="p-button-success" // Estilo del botón
                            disabled={!selectedDateTime || !patientName} // Deshabilitar si faltan datos clave
                        />
                    </div>
                </div>

                {/* Sección de la Tabla de Citas */}
                <div className="mt-5">
                    <h3 className="text-center mb-3 font-semibold text-xl">Citas Programadas</h3>
                    <DataTable 
                        value={appointments} 
                        paginator 
                        rows={5} // Citas por página
                        rowsPerPageOptions={[5, 10, 20]} 
                        emptyMessage="No hay citas programadas."
                        responsiveLayout="scroll" // Mejor para móviles
                        className="p-datatable-sm" // Tabla un poco más compacta
                    >
                        <Column 
                            field="dateTime" 
                            header="Fecha y Hora" 
                            body={formatDateTime} // Usar función de formato
                            sortable // Permitir ordenar por fecha
                            style={{ width: '35%' }} 
                        />
                        <Column 
                            field="patient" 
                            header="Paciente" 
                            sortable 
                            style={{ width: '25%' }} 
                        />
                        <Column 
                            field="doctor" 
                            header="Médico" 
                            sortable 
                            style={{ width: '20%' }} 
                        />
                         <Column 
                            field="reason" 
                            header="Motivo" 
                            style={{ width: '20%' }} 
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}