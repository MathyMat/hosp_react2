// src/views/Citas/Citas.js
import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput,
  CFormLabel, CFormSelect, CRow, CAlert, CSpinner, 
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CAvatar,
  CListGroup, CListGroupItem, CCardImage, CCardTitle, CCardText, CBadge, CFormTextarea,
  CInputGroup, CCardFooter, CInputGroupText
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
    cilCalendarCheck, cilTrash, cilListRich, cilWarning, cilCheckCircle, 
    cilXCircle, cilInfo, cilPencil, cilSave, cilUser, 
    cilClock, cilNotes, cilMedicalCross, cilPrint, cilBriefcase,
    cilFilter, cilLoop, cilSearch// Icono para "Registrar Atención Clínica"
} from '@coreui/icons';

// Placeholder genérico
import placeholderDoctor from '../../assets/images/avatar-placeholder.png'; 

// Para PDF
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

import { API_BASE_URL } from '../../config/apiConfig';

const GestionCitas = () => {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  
  const [loading, setLoading] = useState(true); 
  const [formLoading, setFormLoading] = useState(false); // Para modal y acción de registrar atención
  const [error, setError] = useState('');

  // Estados para Filtros
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [filtroDoctorId, setFiltroDoctorId] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [terminoBusquedaTexto, setTerminoBusquedaTexto] = useState('');

  // Estados para el Modal de Agregar/Editar Cita (Aunque la edición completa se haría en otro lado o se simplifica aquí)
  const [showFormModal, setShowFormModal] = useState(false);
  const [citaEnFormulario, setCitaEnFormulario] = useState(null); // Para diferenciar entre Agregar y Editar (si se implementa edición de cita aquí)
  const [formulario, setFormulario] = useState({
    paciente_id: '', doctor_id: '', fecha: '', motivo: '',
    estado: 'pendiente', notas: '', especialidad_cita: ''
  });
  const [selectedDoctorEspecialidad, setSelectedDoctorEspecialidad] = useState('');

  // Estados para Modales de Notificación y Confirmación
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({ 
    title: '', message: '', color: 'info', icon: cilInfo 
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idParaEliminar, setIdParaEliminar] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Estados para edición en línea del Estado
  const [editingCitaId, setEditingCitaId] = useState(null);
  const [nuevoEstadoCita, setNuevoEstadoCita] = useState('');
  const [loadingEstadoUpdate, setLoadingEstadoUpdate] = useState(null); // Para el spinner del botón de guardar estado

  const navigate = useNavigate(); // Hook para navegación programática

  // --- INICIALIZACIÓN Y CARGA DE DATOS ---
  const resetFormulario = () => {
    setCitaEnFormulario(null);
    setFormulario({
      paciente_id: '', doctor_id: '', fecha: '', motivo: '',
      estado: 'pendiente', notas: '', especialidad_cita: ''
    });
    setSelectedDoctorEspecialidad('');
  };

  const mostrarNotificacion = (title, message, type = 'info') => {
    let icon = cilInfo; let color = type;
    if (type === 'success') icon = cilCheckCircle;
    else if (type === 'error') { icon = cilWarning; color = 'danger'; }
    else if (type === 'warning') icon = cilWarning;
    setNotificationModalConfig({ title, message, color, icon });
    setShowNotificationModal(true);
  };
  
  const cargarDatosParaSelects = async () => {
    try {
      // Pedir al backend que ordene si es posible, sino ordenar en frontend
      const [resPacientes, resDoctores] = await Promise.all([
        axios.get(`${API_BASE_URL}/pacientes?sort=apellido,nombre`), 
        axios.get(`${API_BASE_URL}/doctores?sort=apellidos,nombre`), 
      ]);
      setPacientes(Array.isArray(resPacientes.data) ? resPacientes.data : []);
      setDoctores(Array.isArray(resDoctores.data) ? resDoctores.data.map(d => ({...d, especialidad: d.especialidad || 'N/A'})) : []);
    } catch (err) {
      console.error("GestionCitas: Error cargando datos para selects:", err);
      setError(prev => `${prev ? prev + '\n' : ''}Error al cargar Pacientes y/o Doctores para los selectores.`);
    }
  };

  const cargarCitas = async () => {
    setLoading(true); 
    try {
      // Idealmente, el backend debería devolver las citas ordenadas por fecha descendente.
      const resCitas = await axios.get(`${API_BASE_URL}/citas?_sort=fecha&_order=desc`); // Ejemplo con JSON-Server
      const citasProcesadas = Array.isArray(resCitas.data) ? resCitas.data.map(cita => {
        if (!cita) return null; 
        return {
          ...cita,
          doctor_foto_base64: cita.doctor_foto_base64 || null,
          paciente_foto_base64: cita.paciente_foto_base64 || null,
          // Asegurar que especialidad_cita tenga un valor, usando la del doctor si no está en la cita misma
          especialidad_cita: cita.especialidad_cita || cita.doctor_especialidad_actual || 'N/A'
        };
      }).filter(Boolean) : [];
      // Si el backend no ordena, ordenar aquí
      setCitas(citasProcesadas.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)));
    } catch (err) {
      console.error("GestionCitas: Error cargando citas:", err);
      setError(prev => `${prev ? prev + '\n' : ''}Error al cargar la lista de citas.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const inicializarDatos = async () => {
        setLoading(true); setError('');
        await cargarDatosParaSelects(); 
        await cargarCitas();
        setLoading(false);
    }
    inicializarDatos();
  }, []); 

  // --- MANEJO DEL FORMULARIO DE AGREGAR/EDITAR CITA ---
  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));

    if (name === "doctor_id" && value) {
      const selectedDoc = doctores.find(d => d && d.id === parseInt(value));
      const especialidad = selectedDoc ? selectedDoc.especialidad : '';
      setSelectedDoctorEspecialidad(especialidad);
      // Es crucial que especialidad_cita se actualice aquí para el payload
      setFormulario(prev => ({ ...prev, especialidad_cita: especialidad }));
    } else if (name === "doctor_id" && !value) {
        setSelectedDoctorEspecialidad('');
        setFormulario(prev => ({ ...prev, especialidad_cita: '' }));
    }
  };

  const abrirModalFormulario = (cita = null) => {
    setError('');
    if (cita) { // Modo Editar (si se implementa edición completa de cita aquí)
        setCitaEnFormulario(cita);
        // Formatear fecha para datetime-local input
        const fechaParaInput = cita.fecha ? new Date(new Date(cita.fecha).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '';

        setFormulario({
            paciente_id: cita.paciente_id || '',
            doctor_id: cita.doctor_id || '',
            fecha: fechaParaInput,
            motivo: cita.motivo || '',
            estado: cita.estado || 'pendiente',
            notas: cita.notas || '',
            especialidad_cita: cita.especialidad_cita || ''
        });
        // Settear especialidad para display si se edita
        const docSeleccionado = doctores.find(d => d.id === cita.doctor_id);
        setSelectedDoctorEspecialidad(docSeleccionado ? docSeleccionado.especialidad : (cita.especialidad_cita || ''));
    } else { // Modo Agregar
        resetFormulario();
    }
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    resetFormulario();
  };

  const handleSubmitCita = async (e) => {
    e.preventDefault();
    if (!formulario.paciente_id || !formulario.doctor_id || !formulario.fecha || !formulario.motivo || !formulario.especialidad_cita) {
      mostrarNotificacion('Campos Incompletos', 'Paciente, Doctor, Especialidad, Fecha y Motivo son requeridos.', 'warning');
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        ...formulario,
        paciente_id: parseInt(formulario.paciente_id, 10),
        doctor_id: parseInt(formulario.doctor_id, 10),
        // `fecha` ya está en formato que el backend puede parsear si es datetime-local
      };

      let response;
      if (citaEnFormulario && citaEnFormulario.id) { // Modo Editar
        response = await axios.put(`${API_BASE_URL}/citas/${citaEnFormulario.id}`, payload);
        mostrarNotificacion('Cita Actualizada', response.data?.mensaje || 'Cita actualizada exitosamente.', 'success');
      } else { // Modo Agregar
        response = await axios.post(`${API_BASE_URL}/citas`, payload);
        mostrarNotificacion('Cita Agregada', response.data?.mensaje || 'Cita agregada exitosamente.', 'success');
      }
      
      handleCloseFormModal();
      cargarCitas(); // Recargar la lista de citas para reflejar los cambios

    } catch (err) {
      console.error("Error al guardar cita:", err);
      mostrarNotificacion(
        citaEnFormulario ? 'Error al Actualizar' : 'Error al Agregar', 
        err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo guardar la cita.', 
        'error'
      );
    } finally {
      setFormLoading(false);
    }
  };

  // --- MANEJO DE ELIMINACIÓN DE CITA ---
  const solicitarEliminarCita = (id) => { 
    const cita = citas.find(c => c && c.id === id);
    if(cita){ setIdParaEliminar(id); setShowDeleteModal(true); } 
    else { mostrarNotificacion("Error", `Cita con ID ${id} no encontrada.`, "error"); }
  };

  const confirmarYEliminarCita = async () => {
    if (!idParaEliminar) return;
    setLoadingDelete(true);
    try {
      await axios.delete(`${API_BASE_URL}/citas/${idParaEliminar}`);
      mostrarNotificacion('Cita Eliminada', 'Cita eliminada exitosamente.', 'success');
      setCitas(prevCitas => prevCitas.filter(cita => cita && cita.id !== idParaEliminar));
    } catch (err) {
      console.error("Error al eliminar cita:", err);
      mostrarNotificacion('Error al Eliminar', err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo eliminar la cita.', 'error');
    } finally {
      setLoadingDelete(false); setShowDeleteModal(false); setIdParaEliminar(null);
    }
  };

  // --- MANEJO DE EDICIÓN DE ESTADO DE CITA ---
  const handleEditarEstado = (cita) => { setEditingCitaId(cita.id); setNuevoEstadoCita(cita.estado); };
  const handleCancelarEditarEstado = () => { setEditingCitaId(null); setNuevoEstadoCita(''); };

  const handleGuardarEstadoCita = async (citaId) => {
    if (!nuevoEstadoCita) { mostrarNotificacion('Estado Vacío', 'Seleccione un nuevo estado para la cita.', 'warning'); return; }
    setLoadingEstadoUpdate(citaId);
    try {
      const response = await axios.put(`${API_BASE_URL}/citas/${citaId}/estado`, { estado: nuevoEstadoCita });
      mostrarNotificacion('Estado Actualizado', response.data?.mensaje || 'Estado de la cita actualizado exitosamente.', 'success');
      
      // Actualizar la cita en el estado local
      const citaActualizadaDesdeBackend = response.data.cita; // Asumiendo que el backend devuelve la cita completa
      if (citaActualizadaDesdeBackend && typeof citaActualizadaDesdeBackend.id !== 'undefined') {
          const procesada = {
             ...citaActualizadaDesdeBackend,
             doctor_foto_base64: citaActualizadaDesdeBackend.doctor_foto_base64 || null,
             paciente_foto_base64: citaActualizadaDesdeBackend.paciente_foto_base64 || null,
             especialidad_cita: citaActualizadaDesdeBackend.especialidad_cita || citaActualizadaDesdeBackend.doctor_especialidad_actual || 'N/A'
          };
        setCitas(prevCitas => prevCitas.map(c => (c && c.id === citaId) ? procesada : c));
      } else { // Fallback si el backend no devuelve la cita completa
         setCitas(prevCitas => prevCitas.map(c => (c && c.id === citaId) ? { ...c, estado: nuevoEstadoCita } : c));
      }
      setEditingCitaId(null);
    } catch (err) { 
      console.error("Error al actualizar estado de cita:", err);
      mostrarNotificacion('Error al Actualizar Estado', err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo actualizar el estado de la cita.', 'error');
    } 
    finally { setLoadingEstadoUpdate(null); }
  };

  // --- LÓGICA PARA `atenciones` (INTERACCIÓN CON EL NUEVO MÓDULO) ---
  const handleRegistrarAtencionClinica = async (cita) => {
    if (!cita || !cita.id) {
        mostrarNotificacion('Error', 'Datos de la cita no disponibles para registrar atención.', 'error');
        return;
    }

    setFormLoading(true); // Usar un loader general para esta acción
    try {
        let atencionExistenteId = null;
        // 1. Verificar si ya existe una atención para esta cita_id_origen
        try {
            const resCheck = await axios.get(`${API_BASE_URL}/atenciones?cita_id_origen=${cita.id}`);
            if (resCheck.data && resCheck.data.length > 0) {
                atencionExistenteId = resCheck.data[0].id_atencion; // Asumimos que solo debería haber una por cita origen
            }
        } catch (checkErr) {
            // Si el error es 404, significa que no existe la atención, lo cual está bien.
            // Cualquier otro error al verificar sí debe ser reportado.
            if (checkErr.response && checkErr.response.status !== 404) {
                console.error("Error verificando atención clínica existente:", checkErr);
                mostrarNotificacion('Error de Verificación', 'No se pudo verificar si ya existe una atención clínica para esta cita.', 'error');
                setFormLoading(false);
                return;
            }
        }

        if (atencionExistenteId) {
            // Ya existe, navegar a la vista de detalle de esa atención
            navigate(`/atenciones/${atencionExistenteId}/detalle`);
        } else {
            // No existe, crear una nueva atención con datos básicos
            const pacienteData = pacientes.find(p => p.id === cita.paciente_id);
            let edadDelPaciente = null;
            if (pacienteData && pacienteData.fecha_nacimiento) {
                const hoy = new Date();
                const nacimiento = new Date(pacienteData.fecha_nacimiento);
                edadDelPaciente = hoy.getFullYear() - nacimiento.getFullYear();
                const m = hoy.getMonth() - nacimiento.getMonth();
                if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
                    edadDelPaciente--;
                }
            }

            const nuevaAtencionPayload = {
                id_paciente: cita.paciente_id,
                cita_id_origen: cita.id,
                fecha_atencion: new Date(cita.fecha).toISOString(), // Usar la fecha de la cita, asegurar formato ISO
                tipo_atencion: 'Consulta Ambulatoria', // O deducir del motivo/especialidad si es posible
                edad_paciente_atencion: edadDelPaciente,
                motivo_sintomas_principal: cita.motivo || 'Ver detalles de cita origen.',
                diagnostico_texto_adicional: `Atención originada de cita ID ${cita.id}. Notas de cita: ${cita.notas || 'N/A'}`,
                datos_clinicos_adicionales_json: {}, // Se llenará en el módulo de detalle de atención
                observaciones_plan_tratamiento: '' // Se llenará en el módulo de detalle de atención
            };

            const response = await axios.post(`${API_BASE_URL}/atenciones`, nuevaAtencionPayload);
            const atencionCreada = response.data.atencion; // Asumiendo que el backend devuelve el objeto 'atencion'

            if (atencionCreada && atencionCreada.id_atencion) {
                mostrarNotificacion('Atención Registrada', `Se inició el registro de atención clínica (ID: ${atencionCreada.id_atencion}). Por favor, complete los detalles.`, 'success');
                
                // Opcional: Marcar la cita como 'completada' automáticamente
                if (cita.estado !== 'completada') {
                    try {
                        await axios.put(`${API_BASE_URL}/citas/${cita.id}/estado`, { estado: 'completada' });
                        // Actualizar la UI localmente para la cita
                        setCitas(prev => prev.map(c => c.id === cita.id ? {...c, estado: 'completada'} : c));
                    } catch (estadoErr) {
                        console.warn("No se pudo actualizar automáticamente el estado de la cita a 'completada'.", estadoErr);
                        // No es un error crítico para el flujo de atención, pero se puede notificar o loggear.
                    }
                }
                navigate(`/atenciones/${atencionCreada.id_atencion}/detalle`);
            } else {
                mostrarNotificacion('Error Inesperado', 'No se recibió una ID válida al registrar la atención clínica.', 'error');
            }
        }
    } catch (err) {
        console.error("Error en handleRegistrarAtencionClinica:", err);
        mostrarNotificacion('Error General', err.response?.data?.error || 'Ocurrió un error al procesar la atención clínica.', 'error');
    } finally {
        setFormLoading(false);
    }
  };

  // --- UTILIDADES Y DATOS PARA FILTROS/DISPLAY ---
  const estadosCitaOptions = useMemo(() => [
    { value: '', label: 'Todos los Estados' },
    { value: 'pendiente', label: 'Pendiente' }, { value: 'confirmada', label: 'Confirmada' },
    { value: 'cancelada', label: 'Cancelada' }, { value: 'completada', label: 'Completada' },
    { value: 'reprogramada', label: 'Reprogramada' }, // Ejemplo de otro estado
  ], []);

  const formatTableDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    try { 
      return new Date(dateTimeString).toLocaleString('es-ES', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      }); 
    } 
    catch (e) { 
      console.warn("Error formateando fecha:", dateTimeString, e);
      return 'Fecha inválida'; 
    }
  };

  const generarPDFCita = async (cita) => {
    // ... (Código para generar PDF, como lo tenías, no necesita cambios drásticos para esta lógica)
    // Asegúrate que los campos que usa el PDF (cita.paciente_dni, etc.) vengan del backend
    // o se obtengan correctamente.
    if (!cita) {
        mostrarNotificacion("Error", "Datos de cita no disponibles para PDF.", "error");
        return;
    }
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a5' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;

    doc.setFillColor(45, 57, 86); 
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
    doc.text("Comprobante de Cita Médica", margin, 13, { baseline: 'middle' });
    doc.setFontSize(9); doc.text("MediAssist", pageWidth - margin, 13, { align: 'right', baseline: 'middle' });

    let currentY = 30;

    const qrData = `CitaID: ${cita.id}\nPaciente: ${cita.paciente_nombre || ''} ${cita.paciente_apellido || ''}\nFecha: ${formatTableDateTime(cita.fecha)}`;
    try {
        const qrCodeImage = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'M', margin: 1, width: 120 });
        const qrSizePDF = 22; 
        doc.addImage(qrCodeImage, 'PNG', pageWidth - margin - qrSizePDF, currentY, qrSizePDF, qrSizePDF);
        currentY += qrSizePDF + 3;
    } catch (err) {
        console.error("Error generando QR para PDF:", err);
        currentY += 5; // Espacio si no hay QR
    }
    
    autoTable(doc, {
      startY: currentY,
      head: [['Campo', 'Información']],
      body: [
        ['ID Cita:', cita.id || 'N/A'],
        ['Paciente:', `${cita.paciente_nombre || ''} ${cita.paciente_apellido || ''} (DNI: ${cita.paciente_dni || 'N/A'})`],
        ['Doctor:', `${cita.doctor_nombre || ''} ${cita.doctor_apellidos || ''}`],
        ['Especialidad:', cita.especialidad_cita || 'N/A'],
        ['Fecha y Hora:', formatTableDateTime(cita.fecha)],
        ['Motivo:', cita.motivo || 'N/A'],
        ['Estado:', cita.estado ? (cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)) : 'N/A'],
        ['Notas Adicionales:', cita.notas || '-'],
      ],
      theme: 'grid', 
      headStyles: { fillColor: [79, 93, 115], fontSize: 9, textColor: 255, fontStyle: 'bold' }, 
      bodyStyles: { fontSize: 8.5, cellPadding: 1.5 },
      alternateRowStyles: { fillColor: [245, 249, 250] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 33 }, 1: { cellWidth: 'auto' } },
      margin: { left: margin, right: margin }
    });
    currentY = doc.lastAutoTable.finalY + 8; 

    doc.setFontSize(8); doc.setTextColor(100);
    doc.text("Indicaciones Importantes:", margin, currentY); currentY += 3.5;
    doc.text("- Presentarse 15 minutos antes de la hora indicada con DNI.", margin + 2, currentY); currentY += 3.5;
    doc.text("- Si no puede asistir, por favor cancele o reprograme su cita con anticipación.", margin + 2, currentY);
    
    doc.save(`Comprobante_Cita_${cita.id}_${(cita.paciente_apellido || 'Paciente').replace(/\s+/g, '_')}.pdf`);
  };

  const listaEspecialidadesUnicas = useMemo(() => {
    if (!Array.isArray(doctores)) return [{ label: 'Todas las Especialidades', value: '' }]; 
    const especialidades = new Set(doctores.map(doc => doc?.especialidad).filter(Boolean));
    return [{ label: 'Todas las Especialidades', value: '' }, ...Array.from(especialidades).sort().map(esp => ({ label: esp, value: esp }))];
  }, [doctores]);

  const doctoresFiltradosPorEspecialidad = useMemo(() => {
    if (!Array.isArray(doctores)) return []; 
    if (!filtroEspecialidad) return doctores; // Si no hay filtro de especialidad, mostrar todos los doctores
    return doctores.filter(doc => doc?.especialidad === filtroEspecialidad);
  }, [doctores, filtroEspecialidad]);

  const resetearFiltros = () => { setFiltroEspecialidad(''); setFiltroDoctorId(''); setFiltroEstado(''); setTerminoBusquedaTexto(''); };

  const citasFiltradas = useMemo(() => {
    if (!Array.isArray(citas)) { return []; } 
    return citas.filter(cita => {
      if (!cita || typeof cita.id === 'undefined') return false;
      const busquedaTextoLower = terminoBusquedaTexto.toLowerCase();
      
      const coincideBusquedaTexto = terminoBusquedaTexto ?
        (cita.paciente_nombre?.toLowerCase().includes(busquedaTextoLower) ||
         cita.paciente_apellido?.toLowerCase().includes(busquedaTextoLower) ||
         cita.paciente_dni?.toLowerCase().includes(busquedaTextoLower) ||
         cita.motivo?.toLowerCase().includes(busquedaTextoLower) ||
         cita.doctor_nombre?.toLowerCase().includes(busquedaTextoLower) ||
         cita.doctor_apellidos?.toLowerCase().includes(busquedaTextoLower)
         )
        : true;
      
      const coincideEstado = filtroEstado ? cita.estado === filtroEstado : true;
      const especialidadDeLaCita = cita.especialidad_cita || cita.doctor_especialidad_actual; // Usar la especialidad guardada en la cita
      const coincideEspecialidad = filtroEspecialidad ? especialidadDeLaCita === filtroEspecialidad : true;
      const coincideDoctor = filtroDoctorId ? cita.doctor_id === parseInt(filtroDoctorId) : true;
      
      return coincideBusquedaTexto && coincideEstado && coincideEspecialidad && coincideDoctor;
    });
  }, [citas, terminoBusquedaTexto, filtroEstado, filtroEspecialidad, filtroDoctorId]);

  const totalCitas = Array.isArray(citas) ? citas.length : 0;
  const totalCitasFiltradas = Array.isArray(citasFiltradas) ? citasFiltradas.length : 0;

  // --- RENDERIZADO DEL COMPONENTE ---
  if (loading && !totalCitas && error) { 
    // Mostrar error solo si no hay citas cargadas y hay un error persistente
    return ( 
        <div className="p-4"> 
            <CAlert color="danger" className="text-center">
                <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error Crítico al Cargar Datos</h4>
                <p>{error.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
                <CButton color="primary" onClick={() => { const init = async () => { setLoading(true); setError(''); await cargarDatosParaSelects(); await cargarCitas(); setLoading(false);}; init(); }} disabled={loading}>
                    {loading ? <CSpinner size="sm" /> : "Reintentar Carga"}
                </CButton>
            </CAlert> 
        </div> 
    );
  }

  return (
    <div className="citas-view p-lg-4 p-md-3 p-2 vista-container">
      <CRow className="mb-3 align-items-center">
        <CCol xs={12} className="text-end mb-3">
          <CButton color="primary" onClick={() => abrirModalFormulario()} className="px-4 py-2 shadow-sm">
            <CIcon icon={cilCalendarCheck} className="me-2" /> Programar Nueva Cita
          </CButton>
        </CCol>
      </CRow>

      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="bg-light"><h5 className="mb-0 d-flex align-items-center"><CIcon icon={cilFilter} className="me-2 text-primary" /> Filtros de Búsqueda</h5></CCardHeader>
        <CCardBody>
            <CRow className="g-3 align-items-end">
                <CCol sm={6} md={4} lg={3}>
                    <CFormLabel htmlFor="filtroBusquedaTexto">Buscar por Paciente, Doctor, Motivo...</CFormLabel>
                    <CInputGroup>
                        <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                        <CFormInput type="search" id="filtroBusquedaTexto" placeholder="Escriba aquí..." value={terminoBusquedaTexto} onChange={(e) => setTerminoBusquedaTexto(e.target.value)}/>
                    </CInputGroup>
                </CCol>
                <CCol sm={6} md={4} lg={3}>
                    <CFormLabel htmlFor="filtroEspecialidad">Especialidad</CFormLabel>
                    <CFormSelect id="filtroEspecialidad" value={filtroEspecialidad} onChange={(e) => {setFiltroEspecialidad(e.target.value); setFiltroDoctorId('');}}>
                        {Array.isArray(listaEspecialidadesUnicas) && listaEspecialidadesUnicas.map(esp => (<option key={esp.value} value={esp.value}>{esp.label}</option>))}
                    </CFormSelect>
                </CCol>
                <CCol sm={6} md={4} lg={3}>
                    <CFormLabel htmlFor="filtroDoctorId">Doctor</CFormLabel>
                    <CFormSelect id="filtroDoctorId" value={filtroDoctorId} onChange={(e) => setFiltroDoctorId(e.target.value)} disabled={!Array.isArray(doctoresFiltradosPorEspecialidad) || doctoresFiltradosPorEspecialidad.length === 0 || !filtroEspecialidad}>
                        <option value="">{filtroEspecialidad ? "Todos los Doctores (de esta especialidad)" : "Seleccione especialidad primero"}</option>
                        {filtroEspecialidad && Array.isArray(doctoresFiltradosPorEspecialidad) && doctoresFiltradosPorEspecialidad.map(doc => (<option key={doc.id} value={doc.id}>{doc.nombre} {doc.apellidos}</option>))}
                    </CFormSelect>
                </CCol>
                <CCol sm={6} md={4} lg={2}>
                    <CFormLabel htmlFor="filtroEstado">Estado de Cita</CFormLabel>
                    <CFormSelect id="filtroEstado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                        {Array.isArray(estadosCitaOptions) && estadosCitaOptions.map(est => (<option key={est.value} value={est.value}>{est.label}</option>))}
                    </CFormSelect>
                </CCol>
                <CCol xs={12} md={2} lg={1} className="d-flex align-items-end">
                    <CButton color="secondary" variant="outline" onClick={resetearFiltros} className="w-100 mt-3 mt-md-0" title="Limpiar Filtros">
                        <CIcon icon={cilLoop} />
                    </CButton>
                </CCol>
            </CRow>
        </CCardBody>
      </CCard>

      <CCard className="shadow-sm"> 
        <CCardHeader className="bg-primary text-white"> 
          <h5 className="mb-0 d-flex align-items-center">
            <CIcon icon={cilListRich} className="me-2" /> 
            Listado de Citas ({totalCitasFiltradas} {terminoBusquedaTexto || filtroEstado || filtroEspecialidad || filtroDoctorId ? `de ${totalCitas} en total` : 'en total'})
          </h5>
        </CCardHeader>
        <CCardBody>
           {loading && ( <div className="text-center p-5"><CSpinner color="primary" style={{width:'3rem', height:'3rem'}}/><p className="mt-3">Cargando citas...</p></div> )}
           {!loading && totalCitas > 0 && totalCitasFiltradas === 0 && !error && ( <CAlert color="warning" className="text-center py-4"><CIcon icon={cilWarning} size="xl" className="mb-2"/><p className="h5">No se encontraron citas.</p><p>Intente con otros filtros o términos de búsqueda.</p></CAlert> )}
           {!loading && totalCitas === 0 && !error && ( <CAlert color="info" className="text-center py-4"><CIcon icon={cilInfo} size="xl" className="mb-2"/><p className="h5">No hay citas programadas.</p><p>Puede programar una nueva cita usando el botón de arriba.</p></CAlert> )}
           {!loading && error && ( <CAlert color="danger" className="text-center py-4" dismissible onClose={() => setError('')}><CIcon icon={cilWarning} size="xl" className="mb-2"/><p className="h5">Error al Cargar Citas</p><p>{error.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p></CAlert> )}

           {!loading && totalCitasFiltradas > 0 && (
            <CRow xs={{ cols: 1 }} sm={{ cols: 1 }} md={{ cols: 2 }} lg={{cols: 3}} xl={{cols: 3}} className="g-4 mt-2"> {/* Ajuste de columnas para mejor visualización */}
              {citasFiltradas.map(c => {
                if (!c || typeof c.id === 'undefined') return null;
                const nombrePaciente = `${c.paciente_nombre || ''} ${c.paciente_apellido || ''}`.trim() || (c.paciente_id ? `ID Pac: ${c.paciente_id}` : 'Paciente N/A');
                const nombreDoctor = `${c.doctor_nombre || ''} ${c.doctor_apellidos || ''}`.trim() || (c.doctor_id ? `ID Doc: ${c.doctor_id}` : 'Doctor N/A');
                return (
                <CCol key={c.id}>
                  <CCard className="h-100 shadow-sm cita-card">
                    <CCardHeader className="d-flex justify-content-between align-items-center p-2 bg-light border-bottom">
                        <div className="fw-semibold small text-muted">Cita ID: {c.id}</div>
                        <CBadge 
                            color={ c.estado === 'pendiente' ? 'warning' : c.estado === 'confirmada' ? 'info' : c.estado === 'completada' ? 'success' : c.estado === 'cancelada' ? 'danger' : 'secondary' }
                            shape="rounded-pill" className="px-2 py-1 ms-auto text-black" // Asegurar contraste
                          >
                            {c.estado ? (c.estado.charAt(0).toUpperCase() + c.estado.slice(1)) : 'N/A'}
                          </CBadge>
                    </CCardHeader>
                    <CCardBody className="p-3 d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                            <CAvatar 
                                src={c.doctor_foto_base64 ? `data:image/jpeg;base64,${c.doctor_foto_base64}` : placeholderDoctor} 
                                size="xl" className="me-3 shadow-sm border"
                                onError={(e) => { e.target.onerror = null; e.target.src = placeholderDoctor; }}
                            />
                            <div>
                                <div className="fw-bold h6 mb-0 text-primary" title={nombreDoctor}>{nombreDoctor}</div>
                                <div className="small text-body-secondary"><CIcon icon={cilBriefcase} className="me-1" /> {c.especialidad_cita || 'Especialidad N/A'}</div>
                            </div>
                        </div>
                        <CCardText className="mb-1 small"><CIcon icon={cilUser} className="me-2 text-body-secondary"/><strong>Paciente:</strong> {nombrePaciente}</CCardText>
                        <CCardText className="mb-1 small"><CIcon icon={cilClock} className="me-2 text-body-secondary"/><strong>Fecha:</strong> {formatTableDateTime(c.fecha)}</CCardText>
                        <CCardText className="mb-2 small text-truncate" title={c.motivo}><CIcon icon={cilMedicalCross} className="me-2 text-body-secondary"/><strong>Motivo:</strong> {c.motivo}</CCardText>
                        {c.notas && <CCardText className="small fst-italic bg-light p-2 rounded mt-auto" style={{fontSize:'0.8em', maxHeight: '50px', overflowY: 'auto'}}><CIcon icon={cilNotes} className="me-2 text-body-secondary"/><strong>Notas:</strong> {c.notas}</CCardText>}
                    </CCardBody>
                    <CCardFooter className="d-flex justify-content-between align-items-center p-2 bg-light">
                        <div>
                        {editingCitaId === c.id ? (
                          <div className="d-flex align-items-center">
                            <CFormSelect size="sm" value={nuevoEstadoCita} onChange={(e) => setNuevoEstadoCita(e.target.value)} className="me-1" style={{width: '130px', fontSize: '0.8rem'}}>
                              {Array.isArray(estadosCitaOptions) && estadosCitaOptions.filter(opt => opt.value).map(e_opt => (<option key={e_opt.value} value={e_opt.value}>{e_opt.label}</option>))}
                            </CFormSelect>
                            <CButton color="success" variant="ghost" size="sm" onClick={() => handleGuardarEstadoCita(c.id)} disabled={loadingEstadoUpdate === c.id} title="Guardar Estado"> {loadingEstadoUpdate === c.id ? <CSpinner size="sm" /> : <CIcon icon={cilSave} />} </CButton>
                            <CButton color="secondary" variant="ghost" size="sm" onClick={handleCancelarEditarEstado} disabled={loadingEstadoUpdate === c.id} title="Cancelar Edición"><CIcon icon={cilXCircle} /></CButton>
                          </div>
                        ) : (
                          <CButton color="info" variant="ghost" size="sm" onClick={() => handleEditarEstado(c)} title="Cambiar Estado" disabled={loading || formLoading || loadingDelete}><CIcon icon={cilPencil} /></CButton>
                        )}
                        </div>
                        <div className="d-flex">
                            <CButton 
                                color="success" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRegistrarAtencionClinica(c)}
                                className="me-1"
                                title="Registrar/Ver Atención Clínica"
                                disabled={formLoading || loadingDelete || loading || c.estado === 'cancelada' || c.estado === 'pendiente'} // Solo para confirmadas o completadas
                            >
                             
                            </CButton>
                            <CButton color="secondary" variant="ghost" size="sm" onClick={() => generarPDFCita(c)} className="me-1" title="Imprimir Comprobante"><CIcon icon={cilPrint} /></CButton>
                            <CButton color="danger" variant="ghost" size="sm" onClick={() => solicitarEliminarCita(c.id)} disabled={loadingDelete || loading || formLoading} title="Eliminar Cita"><CIcon icon={cilTrash} /></CButton>
                        </div>
                    </CCardFooter>
                  </CCard>
                </CCol>
              )})}
            </CRow>
           )}
        </CCardBody>
      </CCard>
      
      {/* MODAL DE AGREGAR/EDITAR CITA */}
      {showFormModal && (
        <CModal alignment="center" size="lg" visible={showFormModal} onClose={handleCloseFormModal} backdrop="static">
          <CModalHeader closeButton>
            <CModalTitle><CIcon icon={citaEnFormulario ? cilPencil : cilCalendarCheck} className="me-2" />
                {citaEnFormulario ? `Editar Cita ID: ${citaEnFormulario.id}` : "Programar Nueva Cita"}
            </CModalTitle>
          </CModalHeader>
          <CForm onSubmit={handleSubmitCita}>
            <CModalBody>
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="modal_paciente_id">Paciente *</CFormLabel>
                  <CFormSelect id="modal_paciente_id" name="paciente_id" value={formulario.paciente_id} onChange={handleFormInputChange} required disabled={formLoading || !Array.isArray(pacientes) || pacientes.length === 0}>
                    <option value="">{pacientes.length === 0 ? "Cargando pacientes..." : "Seleccione Paciente..."}</option>
                    {Array.isArray(pacientes) && pacientes.map(p => (<option key={p.id} value={p.id}>{p.nombre} {p.apellido} (DNI: {p.dni})</option>))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="modal_doctor_id">Doctor *</CFormLabel>
                  <CFormSelect id="modal_doctor_id" name="doctor_id" value={formulario.doctor_id} onChange={handleFormInputChange} required disabled={formLoading || !Array.isArray(doctores) || doctores.length === 0}>
                    <option value="">{doctores.length === 0 ? "Cargando doctores..." : "Seleccione Doctor..."}</option>
                    {Array.isArray(doctores) && doctores.map(d => (<option key={d.id} value={d.id}>{d.nombre} {d.apellidos} ({d.especialidad || 'N/A'})</option>))}
                  </CFormSelect>
                </CCol>
                <CCol md={12}>
                    <CFormLabel htmlFor="modal_especialidad_display">Especialidad de la Cita (automático)</CFormLabel>
                    <CFormInput id="modal_especialidad_display" value={selectedDoctorEspecialidad} readOnly disabled placeholder="Se completará al seleccionar un doctor"/>
                    {/* Campo oculto para enviar especialidad_cita */}
                    <input type="hidden" name="especialidad_cita" value={formulario.especialidad_cita} /> 
                </CCol>
                <CCol md={6}>
                    <CFormLabel htmlFor="modal_fecha">Fecha y Hora *</CFormLabel>
                    <CFormInput id="modal_fecha" type="datetime-local" name="fecha" value={formulario.fecha} onChange={handleFormInputChange} required disabled={formLoading}
                        min={new Date().toISOString().slice(0, 16)} // Opcional: no permitir fechas pasadas
                    />
                </CCol>
                <CCol md={6}>
                    <CFormLabel htmlFor="modal_motivo">Motivo de la Cita *</CFormLabel>
                    <CFormInput id="modal_motivo" name="motivo" value={formulario.motivo} onChange={handleFormInputChange} placeholder="Ej: Control anual, Dolor de cabeza" required disabled={formLoading}/>
                </CCol>
                <CCol md={6}>
                    <CFormLabel htmlFor="modal_estado">Estado Inicial</CFormLabel>
                    <CFormSelect id="modal_estado" name="estado" value={formulario.estado} onChange={handleFormInputChange} disabled={formLoading || !!citaEnFormulario}> {/* Deshabilitar si se edita aquí, el estado se cambia fuera */}
                        {Array.isArray(estadosCitaOptions) && estadosCitaOptions.filter(opt => opt.value && opt.value !== 'completada' && opt.value !== 'cancelada').map(e => (<option key={e.value} value={e.value}>{e.label}</option>))}
                    </CFormSelect>
                </CCol>
                <CCol md={12}>
                    <CFormLabel htmlFor="modal_notas">Notas Adicionales (Internas)</CFormLabel>
                    <CFormTextarea id="modal_notas" name="notas" value={formulario.notas} onChange={handleFormInputChange} rows="3" placeholder="Información relevante para la gestión de la cita (Opcional)" disabled={formLoading}/>
                </CCol>
              </CRow>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" variant="outline" onClick={handleCloseFormModal} disabled={formLoading}>Cancelar</CButton>
              <CButton type="submit" color="primary" disabled={formLoading}>
                {formLoading ? <CSpinner size="sm" className="me-2"/> : <CIcon icon={cilSave} className="me-2"/>}
                {citaEnFormulario ? "Guardar Cambios en Cita" : "Guardar Cita"}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModal>
      )}

      {/* MODAL DE NOTIFICACIÓN */}
      <CModal alignment="center" visible={showNotificationModal} onClose={() => setShowNotificationModal(false)}>
        <CModalHeader onClose={() => setShowNotificationModal(false)} className={`bg-${notificationModalConfig.color} text-white`}>
          <CModalTitle><CIcon icon={notificationModalConfig.icon} className="me-2" />{notificationModalConfig.title}</CModalTitle>
        </CModalHeader>
        <CModalBody>{notificationModalConfig.message}</CModalBody>
        <CModalFooter>
          <CButton color={notificationModalConfig.color} onClick={() => setShowNotificationModal(false)}>Aceptar</CButton>
        </CModalFooter>
      </CModal>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <CModal alignment="center" visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader onClose={() => setShowDeleteModal(false)}>
          <CModalTitle><CIcon icon={cilWarning} className="me-2 text-danger" /> Confirmar Eliminación de Cita</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {(() => {
            if (!idParaEliminar || !Array.isArray(citas) || citas.length === 0) return `¿Está seguro de que desea eliminar la cita con ID ${idParaEliminar || 'desconocido'}?`;
            const citaEncontrada = citas.find(c => c && c.id === idParaEliminar);
            const pacienteNombreCompleto = citaEncontrada ? `${citaEncontrada.paciente_nombre || ''} ${citaEncontrada.paciente_apellido || ''}`.trim() : '';
            const mensaje = `¿Está seguro de que desea eliminar la cita con ID <strong>${idParaEliminar}</strong>${pacienteNombreCompleto ? ` para el paciente "${pacienteNombreCompleto}"` : ''}? Esta acción no se puede deshacer.`;
            return <span dangerouslySetInnerHTML={{ __html: mensaje }} />;
          })()}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loadingDelete}><CIcon icon={cilXCircle} className="me-1" />Cancelar</CButton>
          <CButton color="danger" onClick={confirmarYEliminarCita} disabled={loadingDelete}>
            {loadingDelete ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCheckCircle} className="me-1" />}Eliminar Cita
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

export default GestionCitas;