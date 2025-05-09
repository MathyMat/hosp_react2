// src/views/Doctores/GestionDoctores.jsx (o Personal.jsx)
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput,
  CFormLabel, CRow, CAlert, CSpinner, CModal, CModalHeader, CModalTitle,
  CModalBody, CModalFooter, CCardImage, CCardTitle, CCardText, CFormSelect,
  CImage // CBadge was not used in the final doctors list, CImage is used for preview
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

// Para PDF (asumiendo estas are stubs o will be implemented)
// import { jsPDF } from 'jspdf';
// import QRCode from 'qrcode';

import { API_BASE_URL } from '../../config/apiConfig';

const GestionDoctores = () => {
  const [doctores, setDoctores] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: '', apellidos: '', especialidad: '', dni: '', telefono: '',
    correo: '', genero: '', fecha_nacimiento: '', fotoDoctor: null, usuario_id: ''
  });
  const [previewForm, setPreviewForm] = useState(placeholderAvatar);
  
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false); // Used for the Add/Edit modal submission
  const [error, setError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idParaEliminar, setIdParaEliminar] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({ 
    title: '', message: '', color: 'info', icon: cilInfo 
  });

  // State for the Add/Edit Doctor Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [doctorAEditar, setDoctorAEditar] = useState(null); // If not null, it's edit mode
  const [previewEdit, setPreviewEdit] = useState(placeholderAvatar); // Preview for edit mode
  // loadingEdit is not strictly needed if formLoading is used for the unified modal
  
  const fileInputRef = useRef(null); // For 'Add Doctor' form's file input
  const editFileInputRef = useRef(null); // For 'Edit Doctor' form's file input

  const generoOptions = [
    { label: 'Seleccione Género...', value: '' }, { label: 'Masculino', value: 'M' },
    { label: 'Femenino', value: 'F' }, { label: 'Otro', value: 'O' },
  ];
  
  // Mocked data for carnet, to be replaced with real data if available
  const horariosCarnet = ["Turno Mañana (08:00 - 14:00)", "Turno Tarde (14:00 - 20:00)", "Turno Noche (20:00 - 08:00)"];

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
          // Assign a horario, potentially from doc.horario or fallback to mock
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
  
  // Unified handler for form changes (Add or Edit mode)
  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    
    // Determine which state and preview to update based on mode
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
            // Revert preview to original photo if editing, or placeholder if adding
            previewSetter(isEditMode && currentData.fotoBase64 ? `data:image/jpeg;base64,${currentData.fotoBase64}` : placeholderAvatar);
            return;
        }
        formSetter(prev => ({ ...prev, fotoDoctor: file }));
        previewSetter(URL.createObjectURL(file));
      } else { // No file selected or selection cleared
        formSetter(prev => ({ ...prev, fotoDoctor: null }));
        previewSetter(isEditMode && currentData.fotoBase64 ? `data:image/jpeg;base64,${currentData.fotoBase64}` : placeholderAvatar);
      }
    } else {
      formSetter(prev => ({ ...prev, [name]: value }));
    }
  };

  const abrirModalFormulario = (doctor = null) => {
    setError(''); 
    if (doctor) { // Edit mode
        const fechaNac = doctor.fecha_nacimiento ? doctor.fecha_nacimiento.split('T')[0] : ''; // Format for <input type="date">
        setDoctorAEditar({ 
            ...doctor, 
            fecha_nacimiento: fechaNac, 
            fotoDoctor: null, // This will hold the new file, if any
            // Ensure all fields that might be null/undefined are defaulted to empty strings for controlled inputs
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
        if (editFileInputRef.current) editFileInputRef.current.value = null; // Clear file input
    } else { // Add mode
        resetFormulario(); 
        setDoctorAEditar(null); 
        // setPreviewForm is handled by resetFormulario
        if (fileInputRef.current) fileInputRef.current.value = null; // Clear file input
    }
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setDoctorAEditar(null);
    resetFormulario(); // Resets 'formulario' state, 'previewForm', and 'fileInputRef'
    setPreviewEdit(placeholderAvatar); // Reset edit preview
    if (editFileInputRef.current) { // Also clear the edit form's file input
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

    // Basic Validation
    if (!currentData.nombre?.trim() || !currentData.apellidos?.trim() || !currentData.dni?.trim() || 
        !currentData.especialidad?.trim() || !currentData.fecha_nacimiento || !currentData.genero || 
        !currentData.correo?.trim() || !currentData.telefono?.trim()) {
      mostrarNotificacion('Campos Incompletos', 'Por favor, complete todos los campos marcados con (*).', 'warning');
      return;
    }
    
    setFormLoading(true); // Use formLoading for both add and edit
    const formData = new FormData();
    // Append all keys from currentData except fotoBase64 (which is for display)
    // and fotoDoctor (which is handled separately if it's a File)
    Object.keys(currentData).forEach(key => {
        if (key !== 'fotoBase64' && key !== 'fotoDoctor' && currentData[key] !== null && currentData[key] !== undefined) {
            formData.append(key, currentData[key]);
        }
    });

    // Append the file if it exists (fotoDoctor holds the File object)
    if (currentData.fotoDoctor instanceof File) {
        formData.append('fotoDoctor', currentData.fotoDoctor);
    }

    try {
      const response = await axios[method](endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mostrarNotificacion('Éxito', response.data?.mensaje || `Doctor ${isEditMode ? 'actualizado' : 'agregado'} exitosamente.`, 'success');
      
      handleCloseFormModal(); // Close modal and reset states
      
      // Update local state or reload
      if (response.data.doctor && typeof response.data.doctor.id !== 'undefined') {
        const doctorProcesado = { 
            ...response.data.doctor, 
            fotoBase64: response.data.doctor.fotoBase64 !== undefined ? response.data.doctor.fotoBase64 : null,
            horarioAsignado: response.data.doctor.horario || horariosCarnet[doctores.length % horariosCarnet.length] // Example: Re-assign or use new
        };
        if (isEditMode) {
            setDoctores(prev => prev.map(d => d.id === doctorProcesado.id ? doctorProcesado : d).sort((a,b) => (a.apellidos+a.nombre).localeCompare(b.apellidos+b.nombre)));
        } else {
            // Add new doctor and re-sort
            setDoctores(prev => [...prev, doctorProcesado].sort((a,b) => (a.apellidos+a.nombre).localeCompare(b.apellidos+b.nombre)));
        }
      } else {
        console.warn("Respuesta del backend no contenía un doctor válido, recargando lista completa.");
        cargarDoctores(); // Fallback to full reload
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
      // Assuming dateString might be 'YYYY-MM-DDTHH:mm:ss.sssZ' or just 'YYYY-MM-DD'
      const date = new Date(dateString);
      // Check if date is valid after parsing
      if (isNaN(date.getTime())) {
        // Try parsing YYYY-MM-DD by appending a time component for better cross-browser Date constructor behavior
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
  
  // Placeholder for PDF generation logic
  const loadImageAsBase64ForPDF = async (url) => { /* ... (implement) ... */ return Promise.resolve(null); };
  const generarCarnetPDF = async (doctor) => { 
      mostrarNotificacion("En Desarrollo", "La generación de carnets PDF aún está en desarrollo.", "info");
      console.log("Generar Carnet PDF para:", doctor);
      // Example:
      // const { jsPDF } = await import('jspdf');
      // const QRCode = await import('qrcode');
      // const pdf = new jsPDF(); ... add content ... pdf.save();
  };


  useEffect(() => { cargarDoctores(); }, []);

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
                            disabled={formLoading || loadingDelete} // Using formLoading for modal submission state
                        >
                            <CIcon icon={cilDescription} />
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
            // For HTML in CModalBody, you'd typically use dangerouslySetInnerHTML or structure with components
            // Here, simple string concatenation for the name.
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
          <CModalHeader> {/* onClose on CModal handles the default header close button */}
            <CModalTitle>
                <CIcon icon={doctorAEditar ? cilPencil : cilUserPlus} className="me-2" /> 
                {doctorAEditar ? `Editar Doctor: ${doctorAEditar.nombre || ''} ${doctorAEditar.apellidos || ''}`.trim() : "Agregar Nuevo Doctor"}
            </CModalTitle>
          </CModalHeader>
          <CForm onSubmit={handleSubmitDoctor}>
            <CModalBody>
              <CRow className="g-3">
                {/* Using doctorAEditar to determine field values and IDs for labels if needed */}
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
                {formLoading ? <CSpinner size="sm" className="me-2"/> : <CIcon icon={cilSave} className="me-2"/>}
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