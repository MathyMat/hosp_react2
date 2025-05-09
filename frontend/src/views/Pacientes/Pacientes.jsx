// src/views/Pacientes/Pacientes.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput,
  CFormLabel, CFormSelect, CRow, CAlert, CSpinner, CModal, CModalHeader,
  CModalTitle, CModalBody, CModalFooter, CAvatar, CListGroup, CListGroupItem, CImage,
  CInputGroup, CInputGroupText 
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
    cilUserPlus, cilTrash, cilPeople, cilWarning, cilCheckCircle, cilXCircle, 
    cilInfo, cilPencil, cilSave, cilBirthdayCake, cilContact, cilNotes, 
    cilPhone, cilLocationPin, cilThumbUp, // cilCamera was not used
    cilSearch 
} from '@coreui/icons';

import placeholderAvatar from '../../assets/images/avatar-placeholder.png'; 

import { API_BASE_URL } from '../../config/apiConfig';

const RegistroPacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false); // For modal form submission
  const [error, setError] = useState('');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  // State for Add/Edit Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [pacienteEnFormulario, setPacienteEnFormulario] = useState(null); // Null for Add, object for Edit
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', dni: '', fecha_nacimiento: '', genero: '',
    telefono: '', direccion: '', notas: '', fotoPacienteFile: null
  });
  const [previewUrl, setPreviewUrl] = useState(placeholderAvatar);
  const fileInputRef = useRef(null); // For the modal's file input

  // State for Notification Modal
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({ 
    title: '', message: '', color: 'info', icon: cilInfo 
  });

  // State for Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idParaEliminar, setIdParaEliminar] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const opcionesGenero = [
    { value: '', label: 'Seleccione género...' },
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Femenino', label: 'Femenino' },
    { value: 'Otro', label: 'Otro' },
  ];

  const resetModalForm = () => { 
    setFormData({
      nombre: '', apellido: '', dni: '', fecha_nacimiento: '', genero: '',
      telefono: '', direccion: '', notas: '', fotoPacienteFile: null
    });
    setPreviewUrl(placeholderAvatar);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const mostrarNotificacion = (title, message, type = 'info') => {
    let icon = cilInfo; let color = type;
    if (type === 'success') icon = cilCheckCircle;
    else if (type === 'error') { icon = cilWarning; color = 'danger'; }
    else if (type === 'warning') icon = cilWarning;
    setNotificationModalConfig({ title, message, color, icon });
    setShowNotificationModal(true);
  };

  const cargarPacientes = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/pacientes`);
      const pacientesProcesados = Array.isArray(res.data) ? res.data.map(p => ({
        ...p,
        fotoBase64: p.fotoBase64 !== undefined ? p.fotoBase64 : null
      })).sort((a,b) => (a.apellido+a.nombre).localeCompare(b.apellido+b.nombre)) : [];
      setPacientes(pacientesProcesados);
    } catch (err) {
      console.error("Error al cargar pacientes:", err);
      setError('Error al cargar la lista de pacientes. Por favor, intente más tarde.');
      setPacientes([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarPacientes(); }, []);

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChangeModal = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        mostrarNotificacion("Archivo Grande", "La imagen no debe exceder los 5MB.", "warning");
        if(fileInputRef.current) fileInputRef.current.value = null; // Clear the file input
        // Revert to previous state for fotoPacienteFile and previewUrl
        setFormData(prev => ({ ...prev, fotoPacienteFile: null }));
        setPreviewUrl(pacienteEnFormulario?.fotoBase64 ? `data:image/jpeg;base64,${pacienteEnFormulario.fotoBase64}` : placeholderAvatar);
        return;
      }
      setFormData(prev => ({ ...prev, fotoPacienteFile: file }));
      setPreviewUrl(URL.createObjectURL(file));
    } else { // No file selected or selection cleared
      setFormData(prev => ({ ...prev, fotoPacienteFile: null }));
      setPreviewUrl(pacienteEnFormulario?.fotoBase64 ? `data:image/jpeg;base64,${pacienteEnFormulario.fotoBase64}` : placeholderAvatar);
    }
  };

  const abrirModalFormulario = (paciente = null) => {
    setError(''); 
    if (paciente) { // Edit mode
      setPacienteEnFormulario(paciente);
      setFormData({
        nombre: paciente.nombre || '', 
        apellido: paciente.apellido || '',
        dni: paciente.dni || '', 
        fecha_nacimiento: paciente.fecha_nacimiento ? paciente.fecha_nacimiento.split('T')[0] : '', // Format for <input type="date">
        genero: paciente.genero || '', 
        telefono: paciente.telefono || '',
        direccion: paciente.direccion || '', 
        notas: paciente.notas || '',
        fotoPacienteFile: null // Will hold the new file if selected
      });
      setPreviewUrl(paciente.fotoBase64 ? `data:image/jpeg;base64,${paciente.fotoBase64}` : placeholderAvatar);
    } else { // Add mode
      setPacienteEnFormulario(null);
      resetModalForm(); // Resets formData, previewUrl, and fileInputRef
    }
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setPacienteEnFormulario(null);
    resetModalForm();
  };

  const handleSubmitPaciente = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.dni.trim() || !formData.fecha_nacimiento || !formData.genero) {
      mostrarNotificacion('Campos Incompletos', 'Nombre, Apellido, DNI, Fecha de Nacimiento y Género son requeridos.', 'warning');
      return;
    }
    if (!/^\d{8,15}$/.test(formData.dni.trim())) { // Allow 8 to 15 digits for DNI
        mostrarNotificacion('DNI Inválido', 'El DNI debe contener entre 8 y 15 dígitos numéricos.', 'warning');
        return;
    }

    setFormLoading(true);
    const payloadFormData = new FormData();
    // Append all fields from formData
    // fotoPacienteFile is handled specifically to append as 'fotoPaciente' if it's a file
    Object.keys(formData).forEach(key => {
      if (key === 'fotoPacienteFile' && formData[key] instanceof File) {
        payloadFormData.append('fotoPaciente', formData[key]); // Backend expects 'fotoPaciente'
      } else if (key !== 'fotoPacienteFile' && formData[key] !== null && formData[key] !== undefined) {
        payloadFormData.append(key, formData[key]);
      }
    });
    
    const isEditMode = !!pacienteEnFormulario;
    const endpoint = isEditMode
        ? `${API_BASE_URL}/pacientes/${pacienteEnFormulario.id}` 
        : `${API_BASE_URL}/pacientes`;
    const method = isEditMode ? 'put' : 'post';

    try {
      const response = await axios[method](endpoint, payloadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mostrarNotificacion('Éxito', response.data?.mensaje || `Paciente ${isEditMode ? 'actualizado' : 'registrado'} exitosamente.`, 'success');
      
      handleCloseFormModal();
      
      // Update local state or reload
      if (response.data.paciente && typeof response.data.paciente.id !== 'undefined') {
        const pacienteRecibido = {
            ...response.data.paciente,
            fotoBase64: response.data.paciente.fotoBase64 !== undefined ? response.data.paciente.fotoBase64 : null
        };
         if (isEditMode) {
            setPacientes(prev => prev.map(p => p.id === pacienteRecibido.id ? pacienteRecibido : p).sort((a,b) => (a.apellido+a.nombre).localeCompare(b.apellido+b.nombre)));
        } else {
            setPacientes(prev => [...prev, pacienteRecibido].sort((a,b) => (a.apellido+a.nombre).localeCompare(b.apellido+b.nombre)));
        }
      } else {
        console.warn("Respuesta del backend no contenía un paciente válido, recargando lista completa.");
        cargarPacientes(); // Fallback
      }

    } catch (err) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'registrar'} paciente:`, err);
      mostrarNotificacion('Error', err.response?.data?.error || err.response?.data?.mensaje || `No se pudo ${isEditMode ? 'actualizar' : 'registrar'} el paciente.`, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const solicitarEliminarPaciente = (id) => {
    const paciente = pacientes.find(p => p && p.id === id);
    if (paciente) {
        setIdParaEliminar(id);
        setShowDeleteModal(true);
    } else {
        mostrarNotificacion("Error", `Paciente con ID ${id} no encontrado.`, "error");
    }
  };

  const confirmarYEliminarPaciente = async () => {
    if (!idParaEliminar) return;
    setLoadingDelete(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/pacientes/${idParaEliminar}`);
      mostrarNotificacion('Paciente Eliminado', response.data?.mensaje || 'Paciente eliminado exitosamente.', 'success');
      setPacientes(prev => prev.filter(p => p && p.id !== idParaEliminar)); // Already sorted, just filter
    } catch (err) { 
      console.error("Error al eliminar paciente:", err);
      mostrarNotificacion('Error al Eliminar', err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo eliminar el paciente.', 'error');
    } 
    finally { setLoadingDelete(false); setShowDeleteModal(false); setIdParaEliminar(null); }
  };
  
  const formatDisplayDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00') return 'N/A'; // Handle specific invalid date string
    try {
      // Dates from <input type="date"> are YYYY-MM-DD.
      // Append time and 'Z' to ensure it's parsed as UTC, then display in local 'es-ES'.
      const date = new Date(dateString + 'T00:00:00Z'); 
      if (isNaN(date.getTime())) {
        // Fallback for potentially different date formats if necessary, though type="date" is standard
        const parts = dateString.split('/'); // Example: DD/MM/YYYY
        if (parts.length === 3) {
            const formattedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
            if (!isNaN(formattedDate.getTime())) {
                return formattedDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
            }
        }
        return 'Fecha Inv.';
      }
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { 
      console.warn("Error formatting date:", dateString, e);
      return 'Error Fecha'; 
    }
  };

  const pacientesFiltrados = pacientes.filter(paciente => {
    if (!paciente) return false; 
    const busquedaLower = terminoBusqueda.toLowerCase();
    const nombreCompleto = `${paciente.nombre || ''} ${paciente.apellido || ''}`.toLowerCase();
    const dni = String(paciente.dni || '').toLowerCase();
    return nombreCompleto.includes(busquedaLower) || dni.includes(busquedaLower);
  });

  if (loading && !pacientes.length && error) { 
    return (
        <div className="p-4">
            <CAlert color="danger" className="text-center">
                <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error Crítico al Cargar Pacientes</h4>
                <p>{error}</p>
                <CButton color="primary" onClick={cargarPacientes} disabled={loading}>
                  {loading ? <CSpinner size="sm" /> : "Reintentar"}
                </CButton>
            </CAlert>
        </div>
    );
  }

  return (
    <div className="pacientes-view p-4">
      <CRow className="mb-3 align-items-center">
        <CCol xs={12} md={8} lg={9} className="mb-2 mb-md-0">
          <CInputGroup>
            <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
            <CFormInput 
              type="search" placeholder="Buscar paciente por nombre, apellido o DNI..."
              value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)}
              aria-label="Buscar paciente"
            />
          </CInputGroup>
        </CCol>
        <CCol xs={12} md={4} lg={3} className="text-md-end">
            <CButton color="primary" onClick={() => abrirModalFormulario()} className="w-100 w-md-auto px-4 py-2 shadow-sm">
                <CIcon icon={cilUserPlus} className="me-2" /> Agregar Paciente
            </CButton>
        </CCol>
      </CRow>

      <CCard className="shadow-sm">
        <CCardHeader className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <CIcon icon={cilPeople} className="me-2" />
            Listado de Pacientes ({pacientesFiltrados.length})
          </h5>
        </CCardHeader>
        <CCardBody>
          {loading && ( <div className="text-center p-5"><CSpinner color="primary" style={{width:'3rem', height:'3rem'}}/><p className="mt-3">Cargando pacientes...</p></div> )}
          {!loading && pacientes.length > 0 && pacientesFiltrados.length === 0 && !error && (
            <CAlert color="warning" className="text-center py-4"><CIcon icon={cilWarning} size="xl" className="mb-2"/><p className="h5">No se encontraron pacientes.</p><p>Intente con otro término de búsqueda o verifique los filtros.</p></CAlert>
          )}
          {!loading && pacientes.length === 0 && !error && ( <CAlert color="info" className="text-center py-4"><CIcon icon={cilInfo} size="xl" className="mb-2"/><p className="h5">No hay pacientes registrados.</p><p>Agregue pacientes usando el botón "Agregar Paciente".</p></CAlert> )}
          {!loading && error && pacientes.length === 0 && ( <CAlert color="danger" className="text-center py-4" dismissible onClose={() => setError('')}><CIcon icon={cilWarning} size="xl" className="mb-2"/><p className="h5">Error al Cargar Pacientes</p><p>{error}</p><CButton color="danger" variant="outline" onClick={cargarPacientes} className="mt-2" disabled={loading}>{loading ? <CSpinner size="sm"/>:"Reintentar"}</CButton></CAlert>)}

          {!loading && pacientesFiltrados.length > 0 && (
            <CListGroup flush className="mt-2">
              {pacientesFiltrados.map((p) => {
                if (!p || typeof p.id === 'undefined') {
                    console.warn("Item filtrado inválido o sin ID:", p);
                    return null;
                }
                return (
                  <CListGroupItem key={p.id} className="px-0 py-3 patient-list-item">
                    <CRow className="g-0 w-100 align-items-center">
                      <CCol xs="auto" className="text-center" style={{width: '80px', paddingRight: '10px'}}>
                        <CAvatar 
                            src={p.fotoBase64 ? `data:image/jpeg;base64,${p.fotoBase64}` : placeholderAvatar} 
                            size="xl" // Larger avatar
                            onError={(e) => { e.target.onerror = null; e.target.src = placeholderAvatar; }}
                        />
                      </CCol>
                      <CCol>
                        <div className="fw-bold fs-5 mb-1">{p.nombre} {p.apellido}</div>
                        <div className="small text-body-secondary mb-1">
                            <CIcon icon={cilContact} className="me-1"/> DNI: {p.dni || 'N/A'} 
                            <span className="mx-2">|</span>
                            <CIcon icon={cilBirthdayCake} className="me-1"/> Nac: {formatDisplayDate(p.fecha_nacimiento)}
                            <span className="mx-2">|</span>
                            <CIcon icon={cilThumbUp} className="me-1"/> Género: {p.genero || 'N/A'}
                        </div>
                         <div className="small text-body-secondary">
                            <CIcon icon={cilPhone} className="me-1"/> Tel: {p.telefono || 'N/A'}
                            <span className="mx-2">|</span>
                            <CIcon icon={cilLocationPin} className="me-1"/> Dir: {p.direccion || 'N/A'}
                        </div>
                        {p.notas && (
                            <div className="small text-body-secondary mt-1 fst-italic text-truncate" title={p.notas} style={{maxWidth: 'calc(100% - 100px)'}}>
                                <CIcon icon={cilNotes} className="me-1"/> Notas: {p.notas}
                            </div>
                        )}
                      </CCol>
                      <CCol xs="auto" className="d-flex flex-column flex-sm-row align-items-center justify-content-end ps-2 ms-auto"> {/* ms-auto to push buttons to the right */}
                        <CButton
                            color="info" variant="outline" size="sm"
                            onClick={() => abrirModalFormulario(p)}
                            className="me-sm-2 mb-1 mb-sm-0 action-button" title="Editar Paciente"
                            disabled={formLoading || loadingDelete || loading}
                        > <CIcon icon={cilPencil} /> </CButton>
                        <CButton 
                            color="danger" variant="outline" size="sm" 
                            onClick={() => solicitarEliminarPaciente(p.id)} 
                            disabled={loadingDelete || formLoading || loading}
                            title="Eliminar Paciente"
                            className="action-button"
                        > <CIcon icon={cilTrash} /> </CButton>
                      </CCol>
                    </CRow>
                  </CListGroupItem>
                )
              })}
            </CListGroup>
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
            if (!idParaEliminar || !pacientes || pacientes.length === 0) return `¿Está seguro de que desea eliminar el paciente con ID ${idParaEliminar || 'desconocido'}?`;
            const pacienteEncontrado = pacientes.find(p => p && p.id === idParaEliminar);
            const nombrePaciente = pacienteEncontrado ? `${pacienteEncontrado.nombre} ${pacienteEncontrado.apellido}`.trim() : `ID ${idParaEliminar}`;
            return `¿Está seguro de que desea eliminar al paciente "${nombrePaciente}"? Esta acción no se puede deshacer.`;
          })()}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loadingDelete}> <CIcon icon={cilXCircle} className="me-1" />Cancelar</CButton>
          <CButton color="danger" onClick={confirmarYEliminarPaciente} disabled={loadingDelete}>
            {loadingDelete ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCheckCircle} className="me-1" />}Eliminar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* MODAL DE AGREGAR/EDITAR PACIENTE */}
      {showFormModal && (
        <CModal alignment="center" size="lg" visible={showFormModal} onClose={handleCloseFormModal} backdrop="static">
          <CModalHeader closeButton> 
            <CModalTitle>
                <CIcon icon={pacienteEnFormulario ? cilPencil : cilUserPlus} className="me-2" /> 
                {pacienteEnFormulario ? `Editar Paciente: ${formData.nombre || ''} ${formData.apellido || ''}`.trim() : "Registrar Nuevo Paciente"}
            </CModalTitle>
          </CModalHeader>
          <CForm onSubmit={handleSubmitPaciente}>
            <CModalBody>
              <CRow className="g-3">
                <CCol md={6}><CFormLabel htmlFor="form_nombre">Nombres *</CFormLabel><CFormInput id="form_nombre" name="nombre" value={formData.nombre} onChange={handleFormInputChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="form_apellido">Apellidos *</CFormLabel><CFormInput id="form_apellido" name="apellido" value={formData.apellido} onChange={handleFormInputChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="form_dni">DNI (8-15 dígitos) *</CFormLabel><CFormInput id="form_dni" name="dni" value={formData.dni} onChange={handleFormInputChange} required maxLength={15} pattern="\d{8,15}" title="DNI debe tener entre 8 y 15 dígitos numéricos."/></CCol>
                <CCol md={6}><CFormLabel htmlFor="form_fecha_nacimiento">Fecha de Nacimiento *</CFormLabel><CFormInput id="form_fecha_nacimiento" type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleFormInputChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="form_genero">Género *</CFormLabel><CFormSelect id="form_genero" name="genero" value={formData.genero} onChange={handleFormInputChange} required >
                    {opcionesGenero.map(op => <option key={op.value} value={op.value} disabled={op.value === ''}>{op.label}</option>)}
                </CFormSelect></CCol>
                <CCol md={6}><CFormLabel htmlFor="form_telefono">Teléfono</CFormLabel><CFormInput id="form_telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleFormInputChange} /></CCol>
                <CCol md={12}><CFormLabel htmlFor="form_direccion">Dirección</CFormLabel><CFormInput id="form_direccion" name="direccion" value={formData.direccion} onChange={handleFormInputChange} /></CCol>
                <CCol md={12}><CFormLabel htmlFor="form_notas">Notas Adicionales</CFormLabel><CFormInput id="form_notas" component="textarea" name="notas" value={formData.notas} onChange={handleFormInputChange} rows="2" /></CCol>
                <CCol md={12}><CFormLabel htmlFor="form_fotoPacienteFile">Foto del Paciente (Max 5MB)</CFormLabel><CFormInput type="file" id="form_fotoPacienteFile" name="fotoPacienteFile" accept="image/*" onChange={handleFileChangeModal} ref={fileInputRef} /></CCol>
                <CCol xs={12} className="text-center mt-3"> {/* Increased margin-top for better spacing */}
                  {previewUrl && <CImage src={previewUrl} alt="Previsualización Paciente" thumbnail width={150} className="mb-2" onError={(e) => { e.target.onerror = null; e.target.src = placeholderAvatar; }}/>}
                </CCol>
              </CRow>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" variant="outline" onClick={handleCloseFormModal} disabled={formLoading}>Cancelar</CButton>
              <CButton type="submit" color="primary" disabled={formLoading}>
                {formLoading ? <CSpinner size="sm" className="me-2"/> : <CIcon icon={cilSave} className="me-2"/>}
                {pacienteEnFormulario ? "Guardar Cambios" : "Registrar Paciente"}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModal>
      )}
    </div>
  );
};

export default RegistroPacientes;