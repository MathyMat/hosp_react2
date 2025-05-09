// src/views/Doctores/GestionDoctores.jsx (o Personal.jsx)
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput,
  CFormLabel, CRow, CAlert, CSpinner, CModal, CModalHeader, CModalTitle,
  CModalBody, CModalFooter, CCardImage, CCardTitle, CCardText, CFormSelect,
  CImage
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
    cilUserPlus, cilTrash, cilPeople, cilWarning, cilCheckCircle, cilXCircle, 
    cilInfo, cilPencil, cilSave, cilBriefcase, cilPhone, cilEnvelopeClosed,
    cilBirthdayCake, cilContact, 
    cilDescription // Usado para el carnet
} from '@coreui/icons';

// Placeholder local
import placeholderAvatar from '../../assets/images/avatar-placeholder.png'; // Ajusta esta ruta

// Para PDF
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

import { API_BASE_URL } from '../../config/apiConfig';

const GestionDoctores = () => {
  const [doctores, setDoctores] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: '', apellidos: '', especialidad: '', dni: '', telefono: '',
    correo: '', genero: '', fecha_nacimiento: '', fotoDoctor: null, usuario_id: ''
  });
  const [previewForm, setPreviewForm] = useState(placeholderAvatar);
  
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false); // Used for Add/Edit modal AND PDF generation
  const [error, setError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idParaEliminar, setIdParaEliminar] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({ 
    title: '', message: '', color: 'info', icon: cilInfo 
  });

  const [showFormModal, setShowFormModal] = useState(false);
  const [doctorAEditar, setDoctorAEditar] = useState(null);
  const [previewEdit, setPreviewEdit] = useState(placeholderAvatar);
  
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const generoOptions = [
    { label: 'Seleccione Género...', value: '' }, { label: 'Masculino', value: 'M' },
    { label: 'Femenino', value: 'F' }, { label: 'Otro', value: 'O' },
  ];
  
  const horariosCarnet = ["Turno Mañana (08:00 - 14:00)", "Turno Tarde (14:00 - 20:00)", "Turno Noche (20:00 - 08:00)"];

  // State for placeholder image base64, used in PDF generation
  const [placeholderAvatarBase64, setPlaceholderAvatarBase64] = useState(null);

  const mostrarNotificacion = (title, message, type = 'info') => {
    let icon = cilInfo; let color = type;
    if (type === 'success') icon = cilCheckCircle;
    else if (type === 'error') { icon = cilWarning; color = 'danger'; }
    else if (type === 'warning') icon = cilWarning;
    setNotificationModalConfig({ title, message, color, icon });
    setShowNotificationModal(true);
  };
  
  const cargarDoctores = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/doctores`);
      const doctoresConDatos = res.data.map((doc, index) => ({
          ...doc,
          fotoBase64: doc.fotoBase64 !== undefined ? doc.fotoBase64 : null,
          horarioAsignado: doc.horario || horariosCarnet[index % horariosCarnet.length] 
      }));
      setDoctores(Array.isArray(doctoresConDatos) ? doctoresConDatos.sort((a,b) => (a.apellidos+a.nombre).localeCompare(b.apellidos+b.nombre)) : []);
    } catch (err) { 
      console.error("Error al cargar doctores:", err);
      setError('Error al cargar la lista de doctores. Verifique la conexión o intente más tarde.');
      setDoctores([]);
    } 
    finally { setLoading(false); }
  };

  const resetFormulario = () => {
    setFormulario({
        nombre: '', apellidos: '', especialidad: '', dni: '', telefono: '',
        correo: '', genero: '', fecha_nacimiento: '', fotoDoctor: null, usuario_id: ''
    });
    setPreviewForm(placeholderAvatar);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };
  
  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    const isEditMode = !!doctorAEditar;
    const currentData = isEditMode ? doctorAEditar : formulario;
    const formSetter = isEditMode ? setDoctorAEditar : setFormulario;
    const previewSetter = isEditMode ? setPreviewEdit : setPreviewForm;
    const fileInputToReset = isEditMode ? editFileInputRef : fileInputRef;

    if (name === "fotoDoctor") {
      if (files && files[0]) {
        const file = files[0];
        if (file.size > 5 * 1024 * 1024) { 
            mostrarNotificacion("Archivo Grande", "La imagen no debe exceder 5MB.", "warning");
            if (fileInputToReset.current) fileInputToReset.current.value = null;
            formSetter(prev => ({ ...prev, fotoDoctor: null }));
            previewSetter(isEditMode && currentData.fotoBase64 ? `data:image/jpeg;base64,${currentData.fotoBase64}` : placeholderAvatar);
            return;
        }
        formSetter(prev => ({ ...prev, fotoDoctor: file }));
        previewSetter(URL.createObjectURL(file));
      } else {
        formSetter(prev => ({ ...prev, fotoDoctor: null }));
        previewSetter(isEditMode && currentData.fotoBase64 ? `data:image/jpeg;base64,${currentData.fotoBase64}` : placeholderAvatar);
      }
    } else {
      formSetter(prev => ({ ...prev, [name]: value }));
    }
  };

  const abrirModalFormulario = (doctor = null) => {
    setError(''); 
    if (doctor) {
        const fechaNac = doctor.fecha_nacimiento ? doctor.fecha_nacimiento.split('T')[0] : '';
        setDoctorAEditar({ 
            ...doctor, 
            fecha_nacimiento: fechaNac, 
            fotoDoctor: null,
            usuario_id: doctor.usuario_id || '', 
            especialidad: doctor.especialidad || '',
            nombre: doctor.nombre || '',
            apellidos: doctor.apellidos || '',
            dni: doctor.dni || '',
            telefono: doctor.telefono || '',
            correo: doctor.correo || '',
            genero: doctor.genero || '',
        });
        setPreviewEdit(doctor.fotoBase64 ? `data:image/jpeg;base64,${doctor.fotoBase64}` : placeholderAvatar);
        if (editFileInputRef.current) editFileInputRef.current.value = null;
    } else {
        resetFormulario(); 
        setDoctorAEditar(null); 
        if (fileInputRef.current) fileInputRef.current.value = null;
    }
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setDoctorAEditar(null);
    resetFormulario();
    setPreviewEdit(placeholderAvatar);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = null;
    }
  }

  const handleSubmitDoctor = async (e) => {
    e.preventDefault();
    const isEditMode = !!doctorAEditar;
    const currentData = isEditMode ? doctorAEditar : formulario;
    
    const endpoint = isEditMode 
        ? `${API_BASE_URL}/doctores/${doctorAEditar.id}` 
        : `${API_BASE_URL}/doctores`;
    const method = isEditMode ? 'put' : 'post';

    if (!currentData.nombre?.trim() || !currentData.apellidos?.trim() || !currentData.dni?.trim() || 
        !currentData.especialidad?.trim() || !currentData.fecha_nacimiento || !currentData.genero || 
        !currentData.correo?.trim() || !currentData.telefono?.trim()) {
      mostrarNotificacion('Campos Incompletos', 'Por favor, complete todos los campos marcados con (*).', 'warning');
      return;
    }
    
    setFormLoading(true);
    const formData = new FormData();
    Object.keys(currentData).forEach(key => {
        if (key !== 'fotoBase64' && key !== 'fotoDoctor' && currentData[key] !== null && currentData[key] !== undefined) {
            formData.append(key, currentData[key]);
        }
    });

    if (currentData.fotoDoctor instanceof File) {
        formData.append('fotoDoctor', currentData.fotoDoctor);
    }

    try {
      const response = await axios[method](endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mostrarNotificacion('Éxito', response.data?.mensaje || `Doctor ${isEditMode ? 'actualizado' : 'agregado'} exitosamente.`, 'success');
      handleCloseFormModal();
      
      if (response.data.doctor && typeof response.data.doctor.id !== 'undefined') {
        const doctorProcesado = { 
            ...response.data.doctor, 
            fotoBase64: response.data.doctor.fotoBase64 !== undefined ? response.data.doctor.fotoBase64 : null,
            horarioAsignado: response.data.doctor.horario || horariosCarnet[doctores.length % horariosCarnet.length]
        };
        if (isEditMode) {
            setDoctores(prev => prev.map(d => d.id === doctorProcesado.id ? doctorProcesado : d).sort((a,b) => (a.apellidos+a.nombre).localeCompare(b.apellidos+b.nombre)));
        } else {
            setDoctores(prev => [...prev, doctorProcesado].sort((a,b) => (a.apellidos+a.nombre).localeCompare(b.apellidos+b.nombre)));
        }
      } else {
        cargarDoctores();
      }
    } catch (err) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'agregar'} doctor:`, err);
      mostrarNotificacion('Error', err.response?.data?.mensaje || err.response?.data?.error || `Ocurrió un error al ${isEditMode ? 'actualizar' : 'agregar'} el doctor.`, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const solicitarEliminarDoctor = (id) => {
    const doctor = doctores.find(d => d && d.id === id);
    if (doctor) {
        setIdParaEliminar(id);
        setShowDeleteModal(true);
    } else {
        mostrarNotificacion("Error", `Doctor con ID ${id} no encontrado.`, "error");
    }
  };
  
  const confirmarYEliminarDoctor = async () => {
    if (!idParaEliminar) return;
    setLoadingDelete(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/doctores/${idParaEliminar}`);
      mostrarNotificacion('Éxito', response.data?.mensaje || 'Doctor eliminado exitosamente.', 'success');
      setDoctores(prev => prev.filter(d => d && d.id !== idParaEliminar));
    } catch (err) {
      console.error("Error al eliminar doctor:", err);
      mostrarNotificacion('Error', err.response?.data?.mensaje || err.response?.data?.error || 'Error al eliminar el doctor.', 'error');
    } finally {
      setLoadingDelete(false);
      setShowDeleteModal(false);
      setIdParaEliminar(null);
    }
  };
  
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            const isoDate = new Date(`${dateString}T00:00:00`);
             if (!isNaN(isoDate.getTime())) {
                return isoDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
             }
        }
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      console.warn("Error formatting date:", dateString, e);
      return 'Fecha inválida';
    }
  };
  
  const loadImageAsBase64ForPDF = async (url) => {
    try {
      if (url.startsWith('data:image')) {
        return url; // Already a base64 data URL
      }
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch image for PDF: ${url}, status: ${response.status}`);
        return null; 
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (error) => {
          console.error("FileReader error for PDF image:", error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading image as base64 for PDF:", url, error);
      return null;
    }
  };

  const generarCarnetPDF = async (doctor) => {
    if (!placeholderAvatarBase64) {
        mostrarNotificacion("Preparando...", "El generador de carnets se está inicializando. Intente de nuevo en un momento.", "info");
        console.warn("Placeholder avatar base64 not ready for PDF generation.");
        return;
    }

    setFormLoading(true); // Use formLoading to indicate PDF generation is in progress
    try {
      const pdf = new jsPDF({
        orientation: 'landscape', // Tarjeta de identificación usualmente es horizontal
        unit: 'mm',
        format: [85.6, 53.98] // Tamaño de tarjeta de crédito (ancho, alto)
      });

      // --- Parámetros de Diseño ---
      const margin = 4; // Reducido para más espacio
      const cardWidth = 85.6;
      const cardHeight = 53.98;
      const photoWidth = 22; // Ajustar según necesidad
      const photoHeight = 28; // Mantener proporción o ajustar
      const qrCodeSize = 20; // Tamaño del QR

      // --- Fondo y Borde (Opcional) ---
      pdf.setFillColor(235, 245, 255); // Azul muy claro
      pdf.rect(0, 0, cardWidth, cardHeight, 'F');
      pdf.setDrawColor(0, 86, 179); // Azul oscuro para el borde
      pdf.setLineWidth(0.3);
      pdf.rect(0.5, 0.5, cardWidth - 1, cardHeight - 1, 'S'); // Borde interior

      // --- Título Institución ---
      pdf.setFontSize(7);
      pdf.setTextColor(0, 86, 179); // Azul oscuro
      pdf.setFont('helvetica', 'bold');
      pdf.text("HOSPITAL", cardWidth / 2, margin + 1, { align: 'center' });
      
      pdf.setFontSize(6);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont('helvetica', 'normal');
      pdf.text("CARNET DE IDENTIFICACIÓN MÉDICO", cardWidth / 2, margin + 4, { align: 'center' });
      
      // --- Foto del Doctor ---
      const photoX = margin;
      const photoY = margin + 7;
      
      let doctorPhotoData = doctor.fotoBase64 ? `data:image/jpeg;base64,${doctor.fotoBase64}` : placeholderAvatarBase64;
      if (!doctorPhotoData) { // Fallback si foto del doctor y placeholder fallan (improbable con el useEffect)
          console.warn("Doctor photo missing, using placeholder for PDF.");
          doctorPhotoData = placeholderAvatarBase64; // Asegura que placeholder se usa si doc.fotoBase64 es null/undefined
      }

      if (doctorPhotoData) {
        try {
            const imgProps = pdf.getImageProperties(doctorPhotoData);
            const aspectRatio = imgProps.width / imgProps.height;
            let drawWidth = photoWidth;
            let drawHeight = photoHeight;


            // Center image in the allocated box
            const actualDrawX = photoX + (photoWidth - drawWidth) / 2;
            const actualDrawY = photoY + (photoHeight - drawHeight) / 2;

            pdf.addImage(doctorPhotoData, imgProps.fileType || 'JPEG', actualDrawX, actualDrawY, drawWidth, drawHeight);
        } catch (imgError) {
            console.error("Error adding doctor image to PDF:", imgError);
            pdf.setFillColor(220,220,220);
            pdf.rect(photoX, photoY, photoWidth, photoHeight, 'F');
            pdf.setTextColor(100,100,100); pdf.setFontSize(5);
            pdf.text("Foto Error", photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center', baseline: 'middle' });
        }
      } else { // Caso extremo: ni foto del doctor ni placeholder cargado
        pdf.setFillColor(200,200,200);
        pdf.rect(photoX, photoY, photoWidth, photoHeight, 'F');
        pdf.setTextColor(100,100,100); pdf.setFontSize(5);
        pdf.text("No Foto", photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center', baseline: 'middle' });
      }
      pdf.setDrawColor(100, 100, 100); // Borde para la foto
      pdf.rect(photoX, photoY, photoWidth, photoHeight, 'S');

      // --- Información del Doctor ---
      const textStartX = photoX + photoWidth + margin / 1.5;
      let currentY = photoY + 1; // Empezar un poco más abajo de la foto
      const textMaxWidth = cardWidth - textStartX - qrCodeSize - margin - 2; // Máximo ancho para texto

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7); // Tamaño de nombre
      pdf.setTextColor(10, 10, 10); 

      const fullName = `${doctor.nombre || ''} ${doctor.apellidos || ''}`.trim();
      const wrappedName = pdf.splitTextToSize(fullName, textMaxWidth);
      pdf.text(wrappedName, textStartX, currentY);
      currentY += (wrappedName.length * 2.5) + 1; // Ajustar espaciado (2.5 es factor de altura de línea)

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6); // Tamaño para detalles
      pdf.setTextColor(50, 50, 50);

      const especialidadText = `Espec: ${doctor.especialidad || 'N/A'}`;
      pdf.text(pdf.splitTextToSize(especialidadText, textMaxWidth), textStartX, currentY);
      currentY += (pdf.splitTextToSize(especialidadText, textMaxWidth).length * 2.2) + 0.5;

      pdf.text(`DNI: ${doctor.dni || 'N/A'}`, textStartX, currentY);
      currentY += 3;
      pdf.text(`ID: ${doctor.id || 'N/A'}`, textStartX, currentY); // Usar ID como matrícula
      currentY += 3;

      const horarioText = `Horario: ${doctor.horarioAsignado || 'No asignado'}`;
      const wrappedHorario = pdf.splitTextToSize(horarioText, textMaxWidth); // Max width for horario before QR
      pdf.text(wrappedHorario, textStartX, currentY);
      // currentY += (wrappedHorario.length * 2.2); // No se necesita si es el último elemento aquí

      // --- QR Code ---
      const qrX = cardWidth - qrCodeSize - margin;
      // Align QR code top with the start of the text, or slightly lower.
      const qrY = photoY; // Alineado con la parte superior de la foto
      
      const qrDataContent = JSON.stringify({
        id: doctor.id,
        nombre: fullName,
        dni: doctor.dni,
        especialidad: doctor.especialidad,
        institucion: "HOSPITAL" // Example
      });
      
      try {
        const qrCodeImage = await QRCode.toDataURL(qrDataContent, { 
            errorCorrectionLevel: 'M', 
            margin: 1, // Margen dentro del QR
            width: qrCodeSize * 3.78 // Convertir mm a pixels (aprox @96 DPI)
        });
        pdf.addImage(qrCodeImage, 'PNG', qrX, qrY, qrCodeSize, qrCodeSize);
      } catch (qrError) {
        console.error("Error generating QR Code for PDF:", qrError);
        pdf.setFillColor(220,220,220);
        pdf.rect(qrX, qrY, qrCodeSize, qrCodeSize, 'F');
        pdf.setTextColor(100,100,100); pdf.setFontSize(5);
        pdf.text("QR Error", qrX + qrCodeSize / 2, qrY + qrCodeSize / 2, { align: 'center', baseline: 'middle' });
      }

      // --- Pie de página (Fecha de Emisión) ---
      pdf.setFontSize(4.5);
      pdf.setTextColor(120, 120, 120);
      const issueDate = `Emitido: ${new Date().toLocaleDateString('es-ES')}`;
      pdf.text(issueDate, margin, cardHeight - margin / 2); // Más pegado al borde inferior
      pdf.text(`Válido hasta: 09/10/2025`, cardWidth - margin, cardHeight - margin / 2, { align: 'right' });


      pdf.save(`Carnet-${(doctor.apellidos || 'Doctor').replace(/\s+/g, '_')}-${(doctor.nombre || '').replace(/\s+/g, '_')}-${doctor.id}.pdf`);
      mostrarNotificacion('Éxito', 'Carnet PDF generado y descargado.', 'success');

    } catch (error) {
      console.error("Error al generar carnet PDF:", error);
      mostrarNotificacion('Error', 'No se pudo generar el carnet PDF. Verifique la consola para más detalles.', 'error');
    } finally {
      setFormLoading(false); // Release loading state
    }
  };

  useEffect(() => { 
    cargarDoctores(); 
  }, []);

  // useEffect to load placeholder image as base64 for PDF use
  useEffect(() => {
    const loadPlaceholder = async () => {
      try {
        const base64 = await loadImageAsBase64ForPDF(placeholderAvatar);
        if (base64) {
          setPlaceholderAvatarBase64(base64);
        } else {
          console.warn("Could not load placeholder avatar for PDF. Carnet generation might fail for doctors without photos.");
          // You could set a default tiny transparent pixel base64 or similar as ultimate fallback
          // setPlaceholderAvatarBase64('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
        }
      } catch (e) {
        console.error("Error in useEffect loading placeholder for PDF:", e);
      }
    };
    loadPlaceholder();
  }, []);


  if (loading && !doctores.length && error) { 
      return (
        <div className="p-4">
            <CAlert color="danger" className="text-center">
                <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error Crítico</h4>
                <p>{error}</p>
                <CButton color="primary" onClick={cargarDoctores} disabled={loading}>
                    {loading ? <CSpinner size="sm" /> : "Reintentar"}
                </CButton>
            </CAlert>
        </div>
    );
  }

  return (
    <div className="gestion-doctores-view p-4">
      <CRow className="mb-3">
        <CCol className="text-end">
            <CButton color="primary" onClick={() => abrirModalFormulario()} className="px-4 py-2 shadow-sm">
                <CIcon icon={cilUserPlus} className="me-2" />
                Agregar Doctor
            </CButton>
        </CCol>
      </CRow>

      <CCard className="shadow-sm">
        <CCardHeader className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <CIcon icon={cilPeople} className="me-2" /> Listado de Personal Médico
          </h5>
        </CCardHeader>
        <CCardBody>
          {loading && ( <div className="text-center p-5"><CSpinner color="primary" style={{width: '3rem', height: '3rem'}}/><p className="mt-3">Cargando doctores...</p></div> )}
          {!loading && !doctores.length && !error && ( <CAlert color="info" className="text-center py-4"><CIcon icon={cilInfo} size="xl" className="mb-2"/><p className="h5">No hay doctores registrados.</p><p>Agregue personal médico usando el botón "Agregar Doctor".</p></CAlert> )}
          {!loading && error && doctores.length === 0 && ( <CAlert color="danger" className="text-center py-4" dismissible onClose={() => setError('')}><CIcon icon={cilWarning} size="xl" className="mb-2"/><p className="h5">Error al Cargar Doctores</p><p>{error}</p><CButton color="danger" variant="outline" onClick={cargarDoctores} className="mt-2" disabled={loading}>{loading ? <CSpinner size="sm"/>:"Reintentar"}</CButton></CAlert>)}

          {!loading && doctores.length > 0 && (
            <CRow xs={{ cols: 1 }} sm={{ cols: 2 }} md={{ cols: 3 }} lg={{ cols: 4 }} className="g-4 mt-2">
              {doctores.map((doc) => {
                if (!doc || typeof doc.id === 'undefined') {
                    console.warn("Doctor inválido o sin ID, saltando renderizado:", doc);
                    return null; 
                }
                const nombreCompleto = `${doc.nombre || ''} ${doc.apellidos || ''}`.trim();
                return (
                <CCol key={doc.id}>
                  <CCard className="h-100 shadow-sm doctor-card">
                    <CCardImage 
                      orientation="top" 
                      src={doc.fotoBase64 ? `data:image/jpeg;base64,${doc.fotoBase64}` : placeholderAvatar}
                      alt={nombreCompleto || "Doctor"}
                      style={{ height: '200px', objectFit: 'cover', borderBottom: '1px solid var(--cui-border-color-translucent)' }} 
                      onError={(e) => { e.target.onerror = null; e.target.src = placeholderAvatar; }}
                    />
                    <CCardBody className="d-flex flex-column p-3">
                      <CCardTitle className="h5 mb-1 text-truncate" title={nombreCompleto}>{nombreCompleto || "Nombre no disponible"}</CCardTitle>
                      <CCardText className="small text-primary fw-semibold mb-2">
                        <CIcon icon={cilBriefcase} className="me-1" /> {doc.especialidad || 'Especialidad no definida'}
                      </CCardText>
                      
                      <div className="small text-body-secondary mb-1"><CIcon icon={cilContact} className="me-2" />DNI: {doc.dni || 'N/A'}</div>
                      <div className="small text-body-secondary mb-1"><CIcon icon={cilPhone} className="me-2" />Tel: {doc.telefono || 'N/A'}</div>
                      <div className="small text-body-secondary mb-2 text-truncate" title={doc.correo}><CIcon icon={cilEnvelopeClosed} className="me-2" />{doc.correo || 'N/A'}</div>
                      <div className="small text-body-secondary mb-3">
                        <CIcon icon={cilBirthdayCake} className="me-2" />
                        Nac: {formatDisplayDate(doc.fecha_nacimiento)}
                      </div>

                      <div className="d-flex justify-content-end mt-auto pt-2 border-top">
                        <CButton 
                            color="warning" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => generarCarnetPDF(doc)} 
                            className="me-1" 
                            title="Generar Carnet" 
                            disabled={formLoading || loadingDelete || !placeholderAvatarBase64} // Disable if placeholder not loaded
                        >
                            {formLoading && !showFormModal && !showDeleteModal ? <CSpinner size="sm" /> : <CIcon icon={cilDescription} />}
                        </CButton>
                        <CButton color="info" variant="outline" size="sm" onClick={() => abrirModalFormulario(doc)} className="me-1" title="Editar Doctor" disabled={formLoading || loadingDelete}><CIcon icon={cilPencil} /></CButton>
                        <CButton color="danger" variant="outline" size="sm" onClick={() => solicitarEliminarDoctor(doc.id)} disabled={formLoading || loadingDelete} title="Eliminar Doctor"><CIcon icon={cilTrash} /></CButton>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              )})}
            </CRow>
          )}
        </CCardBody>
      </CCard>
      
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
            if (!idParaEliminar || !doctores || doctores.length === 0) return `¿Está seguro de que desea eliminar el doctor con ID ${idParaEliminar || 'desconocido'}?`;
            const doctorEncontrado = doctores.find(doc => doc && doc.id === idParaEliminar);
            const nombreDoctor = doctorEncontrado ? `${doctorEncontrado.nombre} ${doctorEncontrado.apellidos}`.trim() : `ID ${idParaEliminar}`;
            return `¿Está seguro de que desea eliminar al doctor "${nombreDoctor}"? Esta acción no se puede deshacer.`;
          })()}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loadingDelete}><CIcon icon={cilXCircle} className="me-1" />Cancelar</CButton>
          <CButton color="danger" onClick={confirmarYEliminarDoctor} disabled={loadingDelete}>
            {loadingDelete ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCheckCircle} className="me-1" />}Eliminar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* MODAL DE AGREGAR/EDITAR DOCTOR */}
      {showFormModal && (
        <CModal alignment="center" size="lg" visible={showFormModal} onClose={handleCloseFormModal} backdrop="static">
          <CModalHeader>
            <CModalTitle>
                <CIcon icon={doctorAEditar ? cilPencil : cilUserPlus} className="me-2" /> 
                {doctorAEditar ? `Editar Doctor: ${doctorAEditar.nombre || ''} ${doctorAEditar.apellidos || ''}`.trim() : "Agregar Nuevo Doctor"}
            </CModalTitle>
          </CModalHeader>
          <CForm onSubmit={handleSubmitDoctor}>
            <CModalBody>
              <CRow className="g-3">
                <CCol md={6}><CFormLabel htmlFor="nombre">Nombres *</CFormLabel><CFormInput id="nombre" name="nombre" value={doctorAEditar ? (doctorAEditar.nombre || '') : formulario.nombre} onChange={handleFormChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="apellidos">Apellidos *</CFormLabel><CFormInput id="apellidos" name="apellidos" value={doctorAEditar ? (doctorAEditar.apellidos || '') : formulario.apellidos} onChange={handleFormChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="especialidad">Especialidad *</CFormLabel><CFormInput id="especialidad" name="especialidad" value={doctorAEditar ? (doctorAEditar.especialidad || '') : formulario.especialidad} onChange={handleFormChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="dni">DNI *</CFormLabel><CFormInput id="dni" name="dni" value={doctorAEditar ? (doctorAEditar.dni || '') : formulario.dni} onChange={handleFormChange} required maxLength="15"/></CCol>
                <CCol md={6}><CFormLabel htmlFor="telefono">Teléfono *</CFormLabel><CFormInput id="telefono" name="telefono" type="tel" value={doctorAEditar ? (doctorAEditar.telefono || '') : formulario.telefono} onChange={handleFormChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="correo">Correo Electrónico *</CFormLabel><CFormInput id="correo" name="correo" type="email" value={doctorAEditar ? (doctorAEditar.correo || '') : formulario.correo} onChange={handleFormChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="fecha_nacimiento">Fecha de Nacimiento *</CFormLabel><CFormInput id="fecha_nacimiento" name="fecha_nacimiento" type="date" value={doctorAEditar ? (doctorAEditar.fecha_nacimiento || '') : formulario.fecha_nacimiento} onChange={handleFormChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="genero">Género *</CFormLabel><CFormSelect id="genero" name="genero" value={doctorAEditar ? (doctorAEditar.genero || '') : formulario.genero} onChange={handleFormChange} required >
                    {generoOptions.map(op => <option key={op.value} value={op.value} disabled={op.value === ''}>{op.label}</option>)}
                </CFormSelect></CCol>
                 <CCol md={6}><CFormLabel htmlFor="usuario_id">ID de Usuario (Opcional)</CFormLabel><CFormInput id="usuario_id" name="usuario_id" type="text" value={doctorAEditar ? (doctorAEditar.usuario_id || '') : formulario.usuario_id} onChange={handleFormChange} placeholder="Vincular a usuario del sistema"/></CCol>
                <CCol md={6}><CFormLabel htmlFor="fotoDoctor">Foto del Doctor (Max 5MB)</CFormLabel><CFormInput type="file" id="fotoDoctor" name="fotoDoctor" accept="image/*" onChange={handleFormChange} ref={doctorAEditar ? editFileInputRef : fileInputRef} /></CCol>
                <CCol xs={12} className="text-center">
                  <CImage 
                    src={doctorAEditar ? previewEdit : previewForm} 
                    alt="Previsualización Doctor" 
                    thumbnail 
                    width={150} 
                    className="mt-2 mb-2" 
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderAvatar; }}
                  />
                </CCol>
              </CRow>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" variant="outline" onClick={handleCloseFormModal} disabled={formLoading}>Cancelar</CButton>
              <CButton type="submit" color="primary" disabled={formLoading}>
                {formLoading && (showFormModal || (doctorAEditar && showFormModal)) ? <CSpinner size="sm" className="me-2"/> : <CIcon icon={cilSave} className="me-2"/>}
                {doctorAEditar ? "Guardar Cambios" : "Agregar Doctor"}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModal>
      )}
    </div>
  );
};

export default GestionDoctores;