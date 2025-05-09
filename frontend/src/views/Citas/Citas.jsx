// src/views/Citas/Citas.js
import React, { useEffect, useState, useMemo, useRef } from 'react'; 
import axios from 'axios';
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
    cilFilter, cilLoop, cilSearch
} from '@coreui/icons';

// Placeholder genérico
import placeholderDoctor from '../../assets/images/avatar-placeholder.png'; // Ajusta esta ruta

// Para PDF
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Importar como módulo
import QRCode from 'qrcode';

import { API_BASE_URL } from '../../config/apiConfig';

const GestionCitas = () => {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  
  const [loading, setLoading] = useState(true); 
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para Filtros
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [filtroDoctorId, setFiltroDoctorId] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [terminoBusquedaTexto, setTerminoBusquedaTexto] = useState('');

  // Estados para el Modal de Agregar Cita
  const [showFormModal, setShowFormModal] = useState(false);
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
  const [loadingEstadoUpdate, setLoadingEstadoUpdate] = useState(null);

  const resetFormulario = () => {
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
    console.log("GestionCitas: Cargando datos para selects...");
    try {
      const [resPacientes, resDoctores] = await Promise.all([
        axios.get(`${API_BASE_URL}/pacientes`),
        axios.get(`${API_BASE_URL}/doctores`), 
      ]);
      setPacientes(Array.isArray(resPacientes.data) ? resPacientes.data : []);
      setDoctores(Array.isArray(resDoctores.data) ? resDoctores.data.map(d => ({...d, especialidad: d.especialidad || 'N/A'})) : []);
      console.log("GestionCitas: Pacientes y Doctores cargados para selects.");
    } catch (err) {
      console.error("GestionCitas: Error cargando datos para selects:", err);
      setError(prev => `${prev ? prev + '\n' : ''}Error al cargar Pacientes/Doctores.`);
      setPacientes([]); setDoctores([]);
    }
  };

  const cargarCitas = async () => {
    console.log("GestionCitas: Cargando lista de citas...");
    setLoading(true); 
    try {
      const resCitas = await axios.get(`${API_BASE_URL}/citas`);
      const citasProcesadas = Array.isArray(resCitas.data) ? resCitas.data.map(cita => {
        if (!cita) return null; 
        const doctorFotoBase64 = cita.doctor_foto_base64 || null;
        const pacienteFotoBase64 = cita.paciente_foto_base64 || null;
        return {
          ...cita,
          doctor_foto_base64: doctorFotoBase64,
          paciente_foto_base64: pacienteFotoBase64,
          especialidad_cita: cita.especialidad_cita || cita.doctor_especialidad_actual || 'N/A'
        };
      }).filter(Boolean) : [];
      setCitas(citasProcesadas);
      console.log("GestionCitas: Citas cargadas:", citasProcesadas.length);
    } catch (err) {
      console.error("GestionCitas: Error cargando citas:", err);
      let errorMessage = 'Error al cargar la lista de citas.';
      if (err.response) errorMessage += ` (Status: ${err.response.status} - ${err.response.data?.error || ''})`;
      else if (err.request) errorMessage += ' No se recibió respuesta del servidor.';
      else errorMessage += ` ${err.message}`;
      setError(prevError => prevError ? `${prevError}\n${errorMessage}` : errorMessage);
      setCitas([]);
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

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));

    if (name === "doctor_id") {
      const selectedDoc = doctores.find(d => d && d.id === parseInt(value));
      const especialidad = selectedDoc ? selectedDoc.especialidad : '';
      setSelectedDoctorEspecialidad(especialidad);
      setFormulario(prev => ({ ...prev, especialidad_cita: especialidad, doctor_id: value }));
    }
  };

  const agregarCita = async (e) => {
    e.preventDefault();
    if (!formulario.paciente_id || !formulario.doctor_id || !formulario.fecha || !formulario.motivo || !formulario.especialidad_cita) {
      mostrarNotificacion('Campos Incompletos', 'Complete Paciente, Doctor, Especialidad, Fecha y Motivo.', 'warning');
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        ...formulario,
        paciente_id: parseInt(formulario.paciente_id, 10),
        doctor_id: parseInt(formulario.doctor_id, 10),
      };
      const response = await axios.post(`${API_BASE_URL}/citas`, payload);
      mostrarNotificacion('Cita Agregada', response.data?.mensaje || 'Cita agregada.', 'success');
      resetFormulario();
      setShowFormModal(false);
      if (response.data.cita && typeof response.data.cita.id !== 'undefined') {
        const nuevaCita = response.data.cita;
        const doctorFotoBase64 = nuevaCita.doctor_foto_base64 || null;
        const pacienteFotoBase64 = nuevaCita.paciente_foto_base64 || null;
        const nuevaCitaProcesada = { ...nuevaCita, doctor_foto_base64, paciente_foto_base64 };
        setCitas(prevCitas => [nuevaCitaProcesada, ...prevCitas].sort((a,b) => new Date(b.fecha) - new Date(a.fecha)));
      } else {
        cargarCitas();
      }
    } catch (err) {
      console.error("GestionCitas: Error detallado al agregar cita:", err);
      mostrarNotificacion('Error al Agregar', err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo agregar la cita.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const solicitarEliminarCita = (id) => { 
    const cita = citas.find(c => c && c.id === id);
    if(cita){ setIdParaEliminar(id); setShowDeleteModal(true); } 
    else { mostrarNotificacion("Error", `Cita con ID ${id} no encontrada.`, "error"); }
  };

  const confirmarYEliminarCita = async () => {
    if (!idParaEliminar) return;
    setLoadingDelete(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/citas/${idParaEliminar}`);
      mostrarNotificacion('Cita Eliminada', response.data?.mensaje || 'Cita eliminada.', 'success');
      setCitas(prevCitas => prevCitas.filter(cita => cita && cita.id !== idParaEliminar));
    } catch (err) {
      console.error("GestionCitas: Error al eliminar cita:", err);
      mostrarNotificacion('Error al Eliminar', err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo eliminar.', 'error');
    } finally {
      setLoadingDelete(false); setShowDeleteModal(false); setIdParaEliminar(null);
    }
  };

  const handleEditarEstado = (cita) => { setEditingCitaId(cita.id); setNuevoEstadoCita(cita.estado); };
  const handleCancelarEditarEstado = () => { setEditingCitaId(null); setNuevoEstadoCita(''); };

  const handleGuardarEstadoCita = async (citaId) => {
    if (!nuevoEstadoCita) { mostrarNotificacion('Estado Vacío', 'Seleccione un nuevo estado.', 'warning'); return; }
    setLoadingEstadoUpdate(citaId);
    try {
      const response = await axios.put(`${API_BASE_URL}/citas/${citaId}/estado`, { estado: nuevoEstadoCita });
      mostrarNotificacion('Estado Actualizado', response.data?.mensaje || 'Estado actualizado.', 'success');
      
      const citaActualizadaDesdeBackend = response.data.cita;
      if (citaActualizadaDesdeBackend && typeof citaActualizadaDesdeBackend.id !== 'undefined') {
          const doctorFotoBase64 = citaActualizadaDesdeBackend.doctor_foto_base64 || null;
          const pacienteFotoBase64 = citaActualizadaDesdeBackend.paciente_foto_base64 || null;
          const citaParaEstado = { ...citaActualizadaDesdeBackend, doctor_foto_base64, paciente_foto_base64 };
        setCitas(prevCitas => prevCitas.map(c => (c && c.id === citaId) ? { ...citaParaEstado, estado: nuevoEstadoCita } : c));
      } else {
         setCitas(prevCitas => prevCitas.map(c => (c && c.id === citaId) ? { ...c, estado: nuevoEstadoCita } : c));
      }
      setEditingCitaId(null);
    } catch (err) { 
      console.error("GestionCitas: Error al actualizar estado:", err);
      mostrarNotificacion('Error al Actualizar', err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo actualizar estado.', 'error');
    } 
    finally { setLoadingEstadoUpdate(null); }
  };

  const estadosCitaOptions = useMemo(() => [
    { value: '', label: 'Todos los Estados' },
    { value: 'pendiente', label: 'Pendiente' }, { value: 'confirmada', label: 'Confirmada' },
    { value: 'cancelada', label: 'Cancelada' }, { value: 'completada', label: 'Completada' },
  ], []);

  const formatTableDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    try { return new Date(dateTimeString).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } 
    catch (e) { return 'Fecha inválida'; }
  };

  const loadImageAsBase64ForPDF = async (urlOrBase64Data) => {
     if (urlOrBase64Data && urlOrBase64Data.startsWith('data:image')) return urlOrBase64Data;
     let effectiveUrl = urlOrBase64Data || placeholderDoctor; // Usar el placeholder genérico si no hay url/data
     let isPlaceholder = !urlOrBase64Data;
     
     return new Promise((resolve, reject) => {
       console.log(`loadImage: Intentando cargar desde ${isPlaceholder ? 'placeholder importado' : effectiveUrl.substring(0,30)}`);
       const img = new Image();
       img.crossOrigin = "Anonymous"; 
       img.onload = () => {
         const canvas = document.createElement('canvas');
         canvas.width = img.naturalWidth || img.width; canvas.height = img.naturalHeight || img.height;
         const ctx = canvas.getContext('2d');
         if (!ctx) { reject(new Error("No se pudo obtener contexto 2D.")); return; }
         ctx.drawImage(img, 0, 0);
         try { const dataURL = canvas.toDataURL('image/png'); resolve(dataURL); } 
         catch (e) { console.error("Error canvas.toDataURL:", e); reject(e); }
       };
       img.onerror = (e) => { 
         console.error(`No se pudo cargar imagen para PDF: ${effectiveUrl}`, e);
         if (isPlaceholder) { reject(new Error("No se pudo cargar placeholder.")); } 
         else { loadImageAsBase64ForPDF(null).then(resolve).catch(reject); } // Fallback a placeholder
       };
       img.src = effectiveUrl;
     });
   };

   // --- GENERAR PDF DE CITA (SIN FOTOS) ---
   const generarPDFCita = async (cita) => {
    if (!cita) {
        mostrarNotificacion("Error", "Datos de cita no disponibles.", "error");
        return;
    }
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a5' }); // A5 vertical
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    const contentWidth = pageWidth - 2 * margin;

    // --- Header ---
    doc.setFillColor(45, 57, 86); 
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
    doc.text("Comprobante de Cita Médica", margin, 13, { baseline: 'middle' });
    doc.setFontSize(9); doc.text("MediAssist", pageWidth - margin, 13, { align: 'right', baseline: 'middle' });

    let currentY = 30;

    // --- QR Code (Opcional) ---
    const qrData = `CitaID: ${cita.id}\nPaciente DNI: ${cita.paciente_dni || 'N/A'}\nFecha: ${formatTableDateTime(cita.fecha)}`;
    let qrCodeImage = null;
    try { qrCodeImage = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'M', margin: 1, width: 150 }); } 
    catch (err) { console.error("Error generando QR:", err); }
    const qrSizePDF = 25; 
    if (qrCodeImage) { 
        doc.addImage(qrCodeImage, 'PNG', pageWidth - margin - qrSizePDF, currentY, qrSizePDF, qrSizePDF); 
        currentY += qrSizePDF + 5; // Solo aumentar Y si hay QR para no dejar hueco
    } else {
        currentY += 5; // Espacio pequeño si no hay QR
    }


    // --- Detalles de la Cita (usando autoTable) ---
    doc.setFontSize(10); doc.setTextColor(40); 
    
    autoTable(doc, {
      startY: currentY,
      head: [['Campo', 'Información']],
      body: [
        ['ID Cita:', cita.id || 'N/A'],
        ['Paciente:', `${cita.paciente_nombre || ''} ${cita.paciente_apellido || ''}`],
        ['DNI Paciente:', cita.paciente_dni || 'N/A'],
        ['Doctor:', `${cita.doctor_nombre || ''} ${cita.doctor_apellidos || ''}`],
        ['Especialidad:', cita.especialidad_cita || 'N/A'],
        ['Fecha y Hora:', formatTableDateTime(cita.fecha)],
        ['Motivo:', cita.motivo || 'N/A'],
        ['Estado:', cita.estado ? (cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)) : 'N/A'],
        ['Notas:', cita.notas || '-'],
      ],
      theme: 'grid', 
      headStyles: { fillColor: [79, 93, 115], fontSize: 9.5, textColor: 255, fontStyle: 'bold' }, 
      bodyStyles: { fontSize: 9, cellPadding: 1.8 },
      alternateRowStyles: { fillColor: [245, 249, 250] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 1: { cellWidth: 'auto' } },
      tableWidth: contentWidth, // Usar todo el ancho disponible ahora que no hay foto al lado
      margin: { left: margin, right: margin }
    });
    currentY = doc.lastAutoTable.finalY + 10; 

    // --- Indicaciones ---
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text("Indicaciones Importantes:", margin, currentY); currentY += 4;
    doc.text("- Presentarse 15 minutos antes de la hora indicada.", margin + 2, currentY); currentY += 4;
    doc.text("- Traer DNI y este comprobante (impreso o digital).", margin + 2, currentY); currentY += 4;
    doc.text("- Si no puede asistir, cancele su cita con anticipación.", margin + 2, currentY);
    
    // Guardar
    doc.save(`Comprobante_Cita_${cita.id}_${(cita.paciente_apellido || 'Paciente').replace(/\s+/g, '_')}.pdf`);
  };

  // Cálculos para filtros
  const listaEspecialidadesUnicas = useMemo(() => {
    if (!Array.isArray(doctores)) return [{ label: 'Todas las Especialidades', value: '' }]; 
    const especialidades = new Set(doctores.map(doc => doc?.especialidad).filter(Boolean));
    return [{ label: 'Todas las Especialidades', value: '' }, ...Array.from(especialidades).sort().map(esp => ({ label: esp, value: esp }))];
  }, [doctores]);

  const doctoresFiltradosPorEspecialidad = useMemo(() => {
    if (!Array.isArray(doctores)) return []; 
    if (!filtroEspecialidad) return doctores; 
    return doctores.filter(doc => doc?.especialidad === filtroEspecialidad);
  }, [doctores, filtroEspecialidad]);

  const resetearFiltros = () => { setFiltroEspecialidad(''); setFiltroDoctorId(''); setFiltroEstado(''); setTerminoBusquedaTexto(''); };

  const citasFiltradas = useMemo(() => {
    if (!Array.isArray(citas)) { return []; } 
    return citas.filter(cita => {
      if (!cita || typeof cita.id === 'undefined') return false;
      const busquedaTextoLower = terminoBusquedaTexto.toLowerCase();
      const coincideBusquedaTexto = terminoBusquedaTexto ?
        (`${cita.paciente_nombre || ''} ${cita.paciente_apellido || ''}`.toLowerCase().includes(busquedaTextoLower) ||
         cita.motivo?.toLowerCase().includes(busquedaTextoLower))
        : true;
      const coincideEstado = filtroEstado ? cita.estado === filtroEstado : true;
      const especialidadDeLaCita = cita.especialidad_cita || cita.doctor_especialidad_actual;
      const coincideEspecialidad = filtroEspecialidad ? especialidadDeLaCita === filtroEspecialidad : true;
      const coincideDoctor = filtroDoctorId ? cita.doctor_id === parseInt(filtroDoctorId) : true;
      return coincideBusquedaTexto && coincideEstado && coincideEspecialidad && coincideDoctor;
    });
  }, [citas, terminoBusquedaTexto, filtroEstado, filtroEspecialidad, filtroDoctorId]);

  // Definir contadores después de la definición de citasFiltradas
  const totalCitas = Array.isArray(citas) ? citas.length : 0;
  const totalCitasFiltradas = Array.isArray(citasFiltradas) ? citasFiltradas.length : 0;

  if (loading && error && totalCitas === 0 && !pacientes.length && !doctores.length) { 
    return ( 
        <div className="p-4"> 
            <CAlert color="danger" className="text-center">
                <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error Crítico</h4>
                <p>{error}</p>
                <CButton color="primary" onClick={() => { const init = async () => { setLoading(true); setError(''); await cargarDatosParaSelects(); await cargarCitas(); setLoading(false);}; init(); }} disabled={loading}>
                    {loading ? <CSpinner size="sm" /> : "Reintentar"}
                </CButton>
            </CAlert> 
        </div> 
    );
  }

  return (
    <div className="citas-view p-4 vista-container">
      <CRow className="mb-3 align-items-center">
        <CCol xs={12} className="text-end mb-3">
          <CButton color="primary" onClick={() => { resetFormulario(); setShowFormModal(true); }}>
            <CIcon icon={cilCalendarCheck} className="me-2" /> Programar Nueva Cita
          </CButton>
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader><h5 className="mb-0 d-flex align-items-center"><CIcon icon={cilFilter} className="me-2" /> Filtros</h5></CCardHeader>
        <CCardBody>
            <CRow className="g-3 align-items-end">
                <CCol sm={6} md={4} lg={3}><CFormLabel htmlFor="filtroBusquedaTexto">Buscar</CFormLabel><CInputGroup><CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText><CFormInput type="search" id="filtroBusquedaTexto" placeholder="Paciente, motivo..." value={terminoBusquedaTexto} onChange={(e) => setTerminoBusquedaTexto(e.target.value)}/></CInputGroup></CCol>
                <CCol sm={6} md={4} lg={3}><CFormLabel htmlFor="filtroEspecialidad">Especialidad</CFormLabel><CFormSelect id="filtroEspecialidad" value={filtroEspecialidad} onChange={(e) => {setFiltroEspecialidad(e.target.value); setFiltroDoctorId('');}}>
                    {Array.isArray(listaEspecialidadesUnicas) && listaEspecialidadesUnicas.map(esp => (<option key={esp.value} value={esp.value}>{esp.label}</option>))}
                </CFormSelect></CCol>
                <CCol sm={6} md={4} lg={3}><CFormLabel htmlFor="filtroDoctorId">Doctor</CFormLabel><CFormSelect id="filtroDoctorId" value={filtroDoctorId} onChange={(e) => setFiltroDoctorId(e.target.value)} disabled={!Array.isArray(doctoresFiltradosPorEspecialidad) || doctoresFiltradosPorEspecialidad.length === 0}>
                    <option value="">{filtroEspecialidad ? "Todos (Especialidad)" : "Todos los Doctores"}</option>
                    {Array.isArray(doctoresFiltradosPorEspecialidad) && doctoresFiltradosPorEspecialidad.map(doc => (<option key={doc.id} value={doc.id}>{doc.nombre} {doc.apellidos}</option>))}
                </CFormSelect></CCol>
                <CCol sm={6} md={4} lg={2}><CFormLabel htmlFor="filtroEstado">Estado</CFormLabel><CFormSelect id="filtroEstado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                    {Array.isArray(estadosCitaOptions) && estadosCitaOptions.map(est => (<option key={est.value} value={est.value}>{est.label}</option>))}
                </CFormSelect></CCol>
                <CCol xs={12} md={2} lg={1} className="d-flex align-items-end"><CButton color="secondary" variant="outline" onClick={resetearFiltros} className="w-100 mt-3 mt-md-0" title="Resetear Filtros"><CIcon icon={cilLoop} /></CButton></CCol>
            </CRow>
        </CCardBody>
      </CCard>

      <CCard> 
        <CCardHeader className="bg-primary text-white"> 
          <h5 className="mb-0 d-flex align-items-center">
            <CIcon icon={cilListRich} className="me-2" /> Listado de Citas Programadas ({totalCitasFiltradas} {terminoBusquedaTexto || filtroEstado || filtroEspecialidad || filtroDoctorId ? `de ${totalCitas}` : ''})
          </h5>
        </CCardHeader>
        <CCardBody>
           {loading && ( <div className="text-center p-5"><CSpinner color="primary" /><p className="mt-2">Cargando citas...</p></div> )}
           {!loading && totalCitas > 0 && totalCitasFiltradas === 0 && !error && ( <CAlert color="warning" className="text-center py-3">No se encontraron citas con los filtros aplicados.</CAlert> )}
           {!loading && totalCitas === 0 && !error && ( <CAlert color="info" className="text-center py-3">No hay citas programadas actualmente.</CAlert> )}
           {!loading && error && ( <CAlert color="warning" className="text-center" dismissible onClose={() => setError('')}>{error}</CAlert> )}

           {!loading && totalCitasFiltradas > 0 && (
            <CRow xs={{ cols: 1 }} md={{ cols: 2 }} lg={{cols: 3}} xl={{cols: 4}} className="g-4 mt-2">
              {citasFiltradas.map(c => {
                if (!c || typeof c.id === 'undefined') return null;
                const nombrePaciente = `${c.paciente_nombre || ''} ${c.paciente_apellido || ''}`.trim() || (c.paciente_id ? `ID Pac: ${c.paciente_id}` : 'Paciente N/A');
                const nombreDoctor = `${c.doctor_nombre || ''} ${c.doctor_apellidos || ''}`.trim() || (c.doctor_id ? `ID Doc: ${c.doctor_id}` : 'Doctor N/A');
                return (
                <CCol key={c.id}>
                  <CCard className="h-100 shadow-sm cita-card">
                    <CCardHeader className="d-flex justify-content-between align-items-center p-2 bg-body-tertiary border-bottom">
                        <div className="fw-semibold small text-muted">Cita ID: {c.id}</div>
                        <CBadge 
                            color={ c.estado === 'pendiente' ? 'warning' : c.estado === 'confirmada' ? 'info' : c.estado === 'completada' ? 'success' : c.estado === 'cancelada' ? 'danger' : 'secondary' }
                            shape="rounded-pill" className="px-2 py-1 ms-auto"
                          >
                            {c.estado ? (c.estado.charAt(0).toUpperCase() + c.estado.slice(1)) : 'N/A'}
                          </CBadge>
                    </CCardHeader>
                    <CCardBody className="p-3">
                        <div className="d-flex align-items-center mb-3">
                            <CAvatar 
                                src={c.doctor_foto_base64 ? `data:image/jpeg;base64,${c.doctor_foto_base64}` : placeholderDoctor} 
                                size="xl" className="me-3 shadow-sm"
                                onError={(e) => { e.target.onerror = null; e.target.src = placeholderDoctor; }}
                            />
                            <div>
                                <div className="fw-bold h6 mb-0" title={nombreDoctor}>{nombreDoctor}</div>
                                <div className="small text-body-secondary"><CIcon icon={cilBriefcase} className="me-1" /> {c.especialidad_cita || 'Especialidad N/A'}</div>
                            </div>
                        </div>
                        <CCardText className="mb-1 small"><CIcon icon={cilUser} className="me-2 text-body-secondary"/><strong>Paciente:</strong> {nombrePaciente}</CCardText>
                        <CCardText className="mb-1 small"><CIcon icon={cilClock} className="me-2 text-body-secondary"/><strong>Fecha:</strong> {formatTableDateTime(c.fecha)}</CCardText>
                        <CCardText className="mb-2 small"><CIcon icon={cilMedicalCross} className="me-2 text-body-secondary"/><strong>Motivo:</strong> {c.motivo}</CCardText>
                        {c.notas && <CCardText className="small fst-italic bg-body-tertiary p-2 rounded" style={{fontSize:'0.8em', maxHeight: '60px', overflowY: 'auto'}}><CIcon icon={cilNotes} className="me-2 text-body-secondary"/><strong>Notas:</strong> {c.notas}</CCardText>}
                    </CCardBody>
                    <CCardFooter className="d-flex justify-content-between align-items-center p-2">
                        <div>
                        {editingCitaId === c.id ? (
                          <div className="d-flex align-items-center">
                            <CFormSelect size="sm" value={nuevoEstadoCita} onChange={(e) => setNuevoEstadoCita(e.target.value)} className="me-1" style={{width: '130px', fontSize: '0.8rem'}}>
                              {Array.isArray(estadosCitaOptions) && estadosCitaOptions.filter(opt => opt.value).map(e_opt => (<option key={e_opt.value} value={e_opt.value}>{e_opt.label}</option>))}
                            </CFormSelect>
                            <CButton color="success" variant="ghost" size="sm" onClick={() => handleGuardarEstadoCita(c.id)} disabled={loadingEstadoUpdate === c.id} title="Guardar"> {loadingEstadoUpdate === c.id ? <CSpinner size="sm" /> : <CIcon icon={cilSave} />} </CButton>
                            <CButton color="secondary" variant="ghost" size="sm" onClick={handleCancelarEditarEstado} disabled={loadingEstadoUpdate === c.id} title="Cancelar"><CIcon icon={cilXCircle} /></CButton>
                          </div>
                        ) : (
                          <CButton color="info" variant="ghost" size="sm" onClick={() => handleEditarEstado(c)} title="Editar Estado" disabled={loading || formLoading || loadingDelete}><CIcon icon={cilPencil} /></CButton>
                        )}
                        </div>
                        <div className="d-flex">
                            <CButton color="secondary" variant="ghost" size="sm" onClick={() => generarPDFCita(c)} className="me-1" title="Descargar Comprobante"><CIcon icon={cilPrint} /></CButton>
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
      
      {/* MODAL DE AGREGAR CITA */}
      {showFormModal && (
        <CModal alignment="center" size="lg" visible={showFormModal} onClose={() => {setShowFormModal(false); resetFormulario();}} backdrop="static">
          <CModalHeader closeButton>
            <CModalTitle><CIcon icon={cilCalendarCheck} className="me-2" />Programar Nueva Cita</CModalTitle>
          </CModalHeader>
          <CForm onSubmit={agregarCita}>
            <CModalBody>
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel htmlFor="modal_paciente_id">Paciente *</CFormLabel>
                  <CFormSelect id="modal_paciente_id" name="paciente_id" value={formulario.paciente_id} onChange={handleFormInputChange} required disabled={formLoading || !Array.isArray(pacientes) || pacientes.length === 0}>
                    <option value="">{pacientes.length === 0 ? "Cargando..." : "Seleccione Paciente..."}</option>
                    {Array.isArray(pacientes) && pacientes.map(p => (<option key={p.id} value={p.id}>{p.nombre} {p.apellido} (DNI: {p.dni})</option>))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="modal_doctor_id">Doctor *</CFormLabel>
                  <CFormSelect id="modal_doctor_id" name="doctor_id" value={formulario.doctor_id} onChange={handleFormInputChange} required disabled={formLoading || !Array.isArray(doctores) || doctores.length === 0}>
                    <option value="">{doctores.length === 0 ? "Cargando..." : "Seleccione Doctor..."}</option>
                    {Array.isArray(doctores) && doctores.map(d => (<option key={d.id} value={d.id} data-especialidad={d.especialidad}>{d.nombre} {d.apellidos}</option>))}
                  </CFormSelect>
                </CCol>
                <CCol md={12}>
                    <CFormLabel htmlFor="modal_especialidad_display">Especialidad (automático)</CFormLabel>
                    <CFormInput id="modal_especialidad_display" name="especialidad_display" value={selectedDoctorEspecialidad} readOnly disabled placeholder="Se llenará al seleccionar doctor"/>
                    <input type="hidden" name="especialidad_cita" value={formulario.especialidad_cita} />
                </CCol>
                <CCol md={6}><CFormLabel htmlFor="modal_fecha">Fecha y Hora *</CFormLabel><CFormInput id="modal_fecha" type="datetime-local" name="fecha" value={formulario.fecha} onChange={handleFormInputChange} required disabled={formLoading}/></CCol>
                <CCol md={6}><CFormLabel htmlFor="modal_motivo">Motivo *</CFormLabel><CFormInput id="modal_motivo" name="motivo" value={formulario.motivo} onChange={handleFormInputChange} placeholder="Ej: Consulta general" required disabled={formLoading}/></CCol>
                <CCol md={6}><CFormLabel htmlFor="modal_estado">Estado</CFormLabel><CFormSelect id="modal_estado" name="estado" value={formulario.estado} onChange={handleFormInputChange} disabled={formLoading}>
                    {/* Permitir seleccionar estado inicial, pero no 'Todos los Estados' */}
                    {Array.isArray(estadosCitaOptions) && estadosCitaOptions.filter(opt => opt.value !== '').map(e => (<option key={e.value} value={e.value}>{e.label}</option>))}
                </CFormSelect></CCol>
                <CCol md={12}><CFormLabel htmlFor="modal_notas">Notas Adicionales</CFormLabel><CFormTextarea id="modal_notas" name="notas" value={formulario.notas} onChange={handleFormInputChange} rows="3" placeholder="Información relevante (Opcional)" disabled={formLoading}/></CCol>
              </CRow>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" variant="outline" onClick={() => {setShowFormModal(false); resetFormulario();}} disabled={formLoading}>Cancelar</CButton>
              <CButton type="submit" color="primary" disabled={formLoading}>
                {formLoading ? <CSpinner size="sm" className="me-2"/> : <CIcon icon={cilSave} className="me-2"/>}
                Guardar Cita
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
          <CModalTitle><CIcon icon={cilWarning} className="me-2 text-danger" /> Confirmar Eliminación</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {(() => {
            if (!idParaEliminar || !Array.isArray(citas) || citas.length === 0) return `¿Está seguro de que desea eliminar la cita con ID ${idParaEliminar || 'desconocido'}?`;
            const citaEncontrada = citas.find(c => c && c.id === idParaEliminar);
            const nombrePaciente = citaEncontrada ? `${citaEncontrada.paciente_nombre || ''} ${citaEncontrada.paciente_apellido || ''}`.trim() : '';
            return `¿Está seguro de que desea eliminar la cita con ID <strong>${idParaEliminar}</strong>${nombrePaciente ? ` para ${nombrePaciente}` : ''}? Esta acción no se puede deshacer.`;
          })()}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loadingDelete}><CIcon icon={cilXCircle} className="me-1" />Cancelar</CButton>
          <CButton color="danger" onClick={confirmarYEliminarCita} disabled={loadingDelete}>
            {loadingDelete ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCheckCircle} className="me-1" />}Eliminar
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

export default GestionCitas;