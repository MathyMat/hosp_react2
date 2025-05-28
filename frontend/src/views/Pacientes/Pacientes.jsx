// src/views/Pacientes/Pacientes.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput,
  CFormLabel, CFormSelect, CRow, CAlert, CSpinner, CModal, CModalHeader,
  CModalTitle, CModalBody, CModalFooter, CAvatar, CListGroup, CListGroupItem, CImage,
  CInputGroup, CInputGroupText, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, CBadge
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
    cilUserPlus, cilTrash, cilPeople, cilWarning, cilCheckCircle, cilXCircle,
    cilInfo, cilPencil, cilSave, cilContact, cilNotes,
    cilPhone, cilLocationPin, cilSearch, cilClipboard,
    cilToggleOn, cilToggleOff, cilFilter, cilUserUnfollow, cilUserFollow // Íconos para habilitar/deshabilitar y filtro
} from '@coreui/icons';

import placeholderAvatar from '../../assets/images/avatar-placeholder.png';
import { API_BASE_URL } from '../../config/apiConfig';

const RegistroPacientes = () => {
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false); // Para el modal de agregar/editar paciente
  const [error, setError] = useState('');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activos'); // 'todos', 'activos', 'inactivos'

  // State for Add/Edit Paciente Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [pacienteEnFormulario, setPacienteEnFormulario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', dni: '', fecha_nacimiento: '', genero: '',
    telefono: '', direccion: '', notas: '', fotoPacienteFile: null, usuario_id: '' // Incluir usuario_id
  });
  const [previewUrl, setPreviewUrl] = useState(placeholderAvatar);
  const fileInputRef = useRef(null);

  // State for Notification Modal
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({
    title: '', message: '', color: 'info', icon: cilInfo
  });

  // State for Habilitar/Deshabilitar Confirmation Modal
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [pacienteParaCambiarEstado, setPacienteParaCambiarEstado] = useState(null); // { id, nombre, apellido, accion: 'deshabilitar' | 'habilitar' }
  const [loadingCambioEstado, setLoadingCambioEstado] = useState(false);

  const opcionesGenero = [
    { value: '', label: 'Seleccione género...' },
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Femenino', label: 'Femenino' },
    { value: 'Otro', label: 'Otro' },
  ];

  const resetModalForm = () => {
    setFormData({
      nombre: '', apellido: '', dni: '', fecha_nacimiento: '', genero: '',
      telefono: '', direccion: '', notas: '', fotoPacienteFile: null, usuario_id: ''
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
        fotoBase64: p.fotoBase64 !== undefined ? p.fotoBase64 : null,
        activo: p.activo === 1 || p.activo === true // Asegurar que sea booleano
      })).sort((a,b) => (`${a.apellido} ${a.nombre}`).localeCompare(`${b.apellido} ${b.nombre}`)) : [];
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
        if(fileInputRef.current) fileInputRef.current.value = null;
        setFormData(prev => ({ ...prev, fotoPacienteFile: null }));
        setPreviewUrl(pacienteEnFormulario?.fotoBase64 ? `data:image/jpeg;base64,${pacienteEnFormulario.fotoBase64}` : placeholderAvatar);
        return;
      }
      setFormData(prev => ({ ...prev, fotoPacienteFile: file }));
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({ ...prev, fotoPacienteFile: null }));
      setPreviewUrl(pacienteEnFormulario?.fotoBase64 ? `data:image/jpeg;base64,${pacienteEnFormulario.fotoBase64}` : placeholderAvatar);
    }
  };

  const abrirModalFormulario = (paciente = null) => {
    setError('');
    if (paciente) {
      setPacienteEnFormulario(paciente);
      setFormData({
        nombre: paciente.nombre || '',
        apellido: paciente.apellido || '',
        dni: paciente.dni || '',
        fecha_nacimiento: paciente.fecha_nacimiento ? paciente.fecha_nacimiento.split('T')[0] : '',
        genero: paciente.genero || '',
        telefono: paciente.telefono || '',
        direccion: paciente.direccion || '',
        notas: paciente.notas || '',
        fotoPacienteFile: null,
        usuario_id: paciente.usuario_id || '' // Cargar usuario_id
      });
      setPreviewUrl(paciente.fotoBase64 ? `data:image/jpeg;base64,${paciente.fotoBase64}` : placeholderAvatar);
    } else {
      setPacienteEnFormulario(null);
      resetModalForm();
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
    if (!/^\d{7,15}$/.test(formData.dni.trim())) { // DNI de 7 a 15 dígitos
        mostrarNotificacion('DNI Inválido', 'El DNI debe contener entre 7 y 15 dígitos numéricos.', 'warning');
        return;
    }

    setFormLoading(true);
    const payloadFormData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'fotoPacienteFile' && formData[key] instanceof File) {
        payloadFormData.append('fotoPaciente', formData[key]);
      } else if (key === 'usuario_id') {
        payloadFormData.append(key, formData[key] === '' ? null : formData[key]);
      }
       else if (key !== 'fotoPacienteFile' && formData[key] !== null && formData[key] !== undefined) {
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
      if (response.data.paciente && typeof response.data.paciente.id !== 'undefined') {
        const pacienteRecibido = {
            ...response.data.paciente,
            fotoBase64: response.data.paciente.fotoBase64 !== undefined ? response.data.paciente.fotoBase64 : null,
            activo: response.data.paciente.activo === 1 || response.data.paciente.activo === true
        };
         if (isEditMode) {
            setPacientes(prev => prev.map(p => p.id === pacienteRecibido.id ? pacienteRecibido : p).sort((a,b) => (`${a.apellido} ${a.nombre}`).localeCompare(`${b.apellido} ${b.nombre}`)));
        } else {
            setPacientes(prev => [...prev, pacienteRecibido].sort((a,b) => (`${a.apellido} ${a.nombre}`).localeCompare(`${b.apellido} ${b.nombre}`)));
        }
      } else {
        console.warn("Respuesta del backend no contenía un paciente válido, recargando lista completa.");
        cargarPacientes(); // Fallback
      }
    } catch (err) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'registrar'} paciente:`, err);
      const errorMsg = err.response?.data?.error || err.response?.data?.mensaje || `No se pudo ${isEditMode ? 'actualizar' : 'registrar'} el paciente.`;
      mostrarNotificacion('Error', errorMsg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const solicitarCambioEstado = (paciente, accion) => {
    setPacienteParaCambiarEstado({
      id: paciente.id,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      accion: accion // 'deshabilitar' o 'habilitar'
    });
    setShowConfirmEstadoModal(true);
  };

  const confirmarYCambiarEstadoPaciente = async () => {
    if (!pacienteParaCambiarEstado || !pacienteParaCambiarEstado.id) return;

    setLoadingCambioEstado(true);
    const { id, accion } = pacienteParaCambiarEstado;
    const endpoint = `${API_BASE_URL}/pacientes/${id}/${accion}`;

    try {
      const response = await axios.patch(endpoint); // Usar PATCH para cambio de estado
      mostrarNotificacion('Estado Cambiado', response.data?.mensaje || `Paciente ${accion === 'deshabilitar' ? 'deshabilitado' : 'habilitado'} correctamente.`, 'success');
      
      setPacientes(prevPacientes =>
        prevPacientes.map(p =>
          p.id === id ? { ...p, activo: accion === 'habilitar' } : p
        )
      );
    } catch (err) {
      console.error(`Error al ${accion} paciente:`, err);
      mostrarNotificacion(`Error al ${accion}`, err.response?.data?.error || `No se pudo ${accion} el paciente.`, 'error');
    } finally {
      setLoadingCambioEstado(false);
      setShowConfirmEstadoModal(false);
      setPacienteParaCambiarEstado(null);
    }
  };

  const pacientesFiltrados = pacientes.filter(paciente => {
    if (!paciente) return false;

    let cumpleFiltroEstado = true;
    if (filtroEstado === 'activos') {
      cumpleFiltroEstado = paciente.activo === true;
    } else if (filtroEstado === 'inactivos') {
      cumpleFiltroEstado = paciente.activo === false;
    }

    if (!cumpleFiltroEstado) return false;

    if (terminoBusqueda.trim() === '') return true;

    const busquedaLower = terminoBusqueda.toLowerCase();
    const nombreCompleto = `${paciente.nombre || ''} ${paciente.apellido || ''}`.toLowerCase();
    const dni = String(paciente.dni || '').toLowerCase();
    return nombreCompleto.includes(busquedaLower) || dni.includes(busquedaLower);
  });

  if (loading && !pacientes.length && error) {
    return ( <div className="p-4"> <CAlert color="danger" className="text-center"> <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error Crítico</h4> <p>{error}</p> <CButton color="primary" onClick={cargarPacientes} disabled={loading}> {loading ? <CSpinner size="sm" /> : "Reintentar"} </CButton> </CAlert> </div> );
  }

  return (
    <div className="pacientes-view p-4">
      <CRow className="mb-3 align-items-center gx-2"> {/* gx-2 para un poco de espacio entre columnas */}
        <CCol xs={12} sm={6} md={5} className="mb-2 mb-sm-0">
          <CInputGroup>
            <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
            <CFormInput type="search" placeholder="Buscar por nombre, apellido o DNI..." value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} />
          </CInputGroup>
        </CCol>
        <CCol xs={12} sm={6} md={3} className="mb-2 mb-sm-0">
            <CDropdown className="w-100">
                <CDropdownToggle color="secondary" variant="outline" className="w-100">
                    <CIcon icon={cilFilter} className="me-2"/>
                    Mostrar: {filtroEstado === 'activos' ? 'Activos' : filtroEstado === 'inactivos' ? 'Inactivos' : 'Todos'}
                </CDropdownToggle>
                <CDropdownMenu className="w-100">
                    <CDropdownItem onClick={() => setFiltroEstado('todos')} active={filtroEstado === 'todos'}>Todos los Pacientes</CDropdownItem>
                    <CDropdownItem onClick={() => setFiltroEstado('activos')} active={filtroEstado === 'activos'}>Solo Activos</CDropdownItem>
                    <CDropdownItem onClick={() => setFiltroEstado('inactivos')} active={filtroEstado === 'inactivos'}>Solo Inactivos</CDropdownItem>
                </CDropdownMenu>
            </CDropdown>
        </CCol>
        <CCol xs={12} md={4} className="text-md-end mt-2 mt-md-0">
            <CButton color="primary" onClick={() => abrirModalFormulario()} className="w-100 w-md-auto">
                <CIcon icon={cilUserPlus} className="me-2" /> Agregar Paciente
            </CButton>
        </CCol>
      </CRow>

      <CCard className="shadow-sm">
        <CCardHeader className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center"> <CIcon icon={cilPeople} className="me-2" /> Listado de Pacientes ({pacientesFiltrados.length})</h5>
        </CCardHeader>
        <CCardBody>
          {loading && ( <div className="text-center p-5"><CSpinner color="primary" style={{width:'3rem', height:'3rem'}}/><p className="mt-3">Cargando pacientes...</p></div> )}
          {!loading && pacientes.length > 0 && pacientesFiltrados.length === 0 && !error && ( <CAlert color="warning" className="text-center py-4"><CIcon icon={cilWarning} size="xl" className="mb-2"/><p className="h5">No se encontraron pacientes con los filtros actuales.</p></CAlert> )}
          {!loading && pacientes.length === 0 && !error && ( <CAlert color="info" className="text-center py-4"><CIcon icon={cilInfo} size="xl" className="mb-2"/><p className="h5">No hay pacientes registrados.</p></CAlert> )}
          {!loading && error && ( <CAlert color="danger" className="text-center py-4" dismissible onClose={() => setError('')}><CIcon icon={cilWarning} size="xl" className="mb-2"/><p className="h5">Error al Cargar Pacientes</p><p>{error}</p><CButton color="danger" variant="outline" onClick={cargarPacientes} className="mt-2" disabled={loading}>{loading ? <CSpinner size="sm"/>:"Reintentar"}</CButton></CAlert>)}

          {!loading && pacientesFiltrados.length > 0 && (
            <CListGroup flush className="mt-2">
              {pacientesFiltrados.map((p) => (
                  <CListGroupItem key={p.id} className={`px-0 py-3 patient-list-item ${!p.activo ? 'bg-light opacity-75' : ''}`} style={!p.activo ? {backgroundColor: 'var(--cui-gray-200)'} : {}}>
                    <CRow className="g-0 w-100 align-items-center">
                      <CCol xs="auto" className="text-center" style={{width: '80px', paddingRight: '10px'}}>
                        <CAvatar src={p.fotoBase64 ? `data:image/jpeg;base64,${p.fotoBase64}` : placeholderAvatar} size="xl" style={!p.activo ? { filter: 'grayscale(80%)', opacity: 0.7 } : {}} onError={(e) => { e.target.onerror = null; e.target.src = placeholderAvatar; }} />
                      </CCol>
                      <CCol>
                        <div className={`fw-bold fs-5 mb-1 ${!p.activo ? 'text-decoration-line-through text-muted' : ''}`}>{p.nombre} {p.apellido}
                          {!p.activo && <CBadge color="danger" shape="rounded-pill" className="ms-2">Inactivo</CBadge>}
                        </div>
                        <div className={`small ${!p.activo ? 'text-muted' : 'text-body-secondary'} mb-1`}> <CIcon icon={cilContact} className="me-1"/> DNI: {p.dni || 'N/A'} <span className="mx-2">|</span> Género: {p.genero || 'N/A'} </div>
                        <div className={`small ${!p.activo ? 'text-muted' : 'text-body-secondary'}`}> <CIcon icon={cilPhone} className="me-1"/> Tel: {p.telefono || 'N/A'} <span className="mx-2">|</span> <CIcon icon={cilLocationPin} className="me-1"/> Dir: {p.direccion || 'N/A'} </div>
                        {p.notas && ( <div className={`small ${!p.activo ? 'text-muted' : 'text-body-secondary'} mt-1 fst-italic text-truncate`} title={p.notas} style={{maxWidth: 'calc(100% - 150px)'}}> <CIcon icon={cilNotes} className="me-1"/> Notas: {p.notas} </div> )}
                      </CCol>
                      <CCol xs="auto" className="d-flex flex-column flex-sm-row align-items-center justify-content-end ps-2 ms-auto" style={{ gap: '0.5rem' }}>
                        <CButton color="info" variant="outline" size="sm" onClick={() => abrirModalFormulario(p)} title="Editar Paciente" disabled={!p.activo || loadingCambioEstado || loading}> <CIcon icon={cilPencil} /> </CButton>
                        <CButton color="secondary" variant="outline" size="sm" onClick={() => navigate(`/historial/paciente/${p.id}`)} title="Ver Historial Clínico" disabled={loadingCambioEstado || loading}> <CIcon icon={cilClipboard} /> </CButton>
                        {p.activo ? (
                          <CButton color="warning" variant="outline" size="sm" onClick={() => solicitarCambioEstado(p, 'deshabilitar')} title="Deshabilitar Paciente" disabled={loadingCambioEstado || loading}> <CIcon icon={cilUserUnfollow} /> </CButton>
                        ) : (
                          <CButton color="success" variant="outline" size="sm" onClick={() => solicitarCambioEstado(p, 'habilitar')} title="Habilitar Paciente" disabled={loadingCambioEstado || loading}> <CIcon icon={cilUserFollow} /> </CButton>
                        )}
                      </CCol>
                    </CRow>
                  </CListGroupItem>
                ))}
            </CListGroup>
          )}
        </CCardBody>
      </CCard>

      <CModal alignment="center" visible={showNotificationModal} onClose={() => setShowNotificationModal(false)}>
        <CModalHeader onClose={() => setShowNotificationModal(false)} className={`bg-${notificationModalConfig.color} text-white`}> <CModalTitle><CIcon icon={notificationModalConfig.icon} className="me-2" />{notificationModalConfig.title}</CModalTitle> </CModalHeader>
        <CModalBody>{notificationModalConfig.message}</CModalBody>
        <CModalFooter> <CButton color={notificationModalConfig.color} onClick={() => setShowNotificationModal(false)}>Aceptar</CButton> </CModalFooter>
      </CModal>

      <CModal alignment="center" visible={showConfirmEstadoModal} onClose={() => setShowConfirmEstadoModal(false)}>
        <CModalHeader onClose={() => setShowConfirmEstadoModal(false)}>
          <CModalTitle>
            <CIcon icon={pacienteParaCambiarEstado?.accion === 'deshabilitar' ? cilUserUnfollow : cilUserFollow} className={`me-2 ${pacienteParaCambiarEstado?.accion === 'deshabilitar' ? 'text-danger' : 'text-success'}`} />
            Confirmar {pacienteParaCambiarEstado?.accion === 'deshabilitar' ? 'Deshabilitación' : 'Habilitación'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          ¿Está seguro de que desea {pacienteParaCambiarEstado?.accion} al paciente "{pacienteParaCambiarEstado?.nombre} {pacienteParaCambiarEstado?.apellido}"?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowConfirmEstadoModal(false)} disabled={loadingCambioEstado}> <CIcon icon={cilXCircle} className="me-1" />Cancelar</CButton>
          <CButton 
            color={pacienteParaCambiarEstado?.accion === 'deshabilitar' ? "danger" : "success"} 
            onClick={confirmarYCambiarEstadoPaciente} 
            disabled={loadingCambioEstado}
          >
            {loadingCambioEstado ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCheckCircle} className="me-1" />}
            {pacienteParaCambiarEstado?.accion === 'deshabilitar' ? 'Deshabilitar' : 'Habilitar'}
          </CButton>
        </CModalFooter>
      </CModal>

      {showFormModal && (
        <CModal alignment="center" size="lg" visible={showFormModal} onClose={handleCloseFormModal} backdrop="static">
          <CModalHeader closeButton> <CModalTitle> <CIcon icon={pacienteEnFormulario ? cilPencil : cilUserPlus} className="me-2" /> {pacienteEnFormulario ? `Editar Paciente: ${formData.nombre || ''} ${formData.apellido || ''}`.trim() : "Registrar Nuevo Paciente"} </CModalTitle> </CModalHeader>
          <CForm onSubmit={handleSubmitPaciente}>
            <CModalBody>
              <CRow className="g-3">
                <CCol md={6}><CFormLabel htmlFor="form_nombre">Nombres *</CFormLabel><CFormInput id="form_nombre" name="nombre" value={formData.nombre} onChange={handleFormInputChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="form_apellido">Apellidos *</CFormLabel><CFormInput id="form_apellido" name="apellido" value={formData.apellido} onChange={handleFormInputChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="form_dni">DNI (7-15 dígitos) *</CFormLabel><CFormInput id="form_dni" name="dni" value={formData.dni} onChange={handleFormInputChange} required maxLength={15} pattern="\d{7,15}" title="DNI debe tener entre 7 y 15 dígitos."/></CCol>
                <CCol md={6}><CFormLabel htmlFor="form_fecha_nacimiento">Fecha de Nacimiento *</CFormLabel><CFormInput id="form_fecha_nacimiento" type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleFormInputChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="form_genero">Género *</CFormLabel><CFormSelect id="form_genero" name="genero" value={formData.genero} onChange={handleFormInputChange} required > {opcionesGenero.map(op => <option key={op.value} value={op.value} disabled={op.value === ''}>{op.label}</option>)} </CFormSelect></CCol>
                <CCol md={6}><CFormLabel htmlFor="form_telefono">Teléfono</CFormLabel><CFormInput id="form_telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleFormInputChange} /></CCol>
                <CCol md={12}><CFormLabel htmlFor="form_direccion">Dirección</CFormLabel><CFormInput id="form_direccion" name="direccion" value={formData.direccion} onChange={handleFormInputChange} /></CCol>
                <CCol md={12}><CFormLabel htmlFor="form_usuario_id">ID Usuario (Opcional)</CFormLabel><CFormInput id="form_usuario_id" name="usuario_id" type="number" value={formData.usuario_id} onChange={handleFormInputChange} min="1"/></CCol>
                <CCol md={12}><CFormLabel htmlFor="form_notas">Notas Adicionales</CFormLabel><CFormInput id="form_notas" component="textarea" name="notas" value={formData.notas} onChange={handleFormInputChange} rows="2" /></CCol>
                <CCol md={12}><CFormLabel htmlFor="form_fotoPacienteFile">Foto del Paciente (Max 5MB)</CFormLabel><CFormInput type="file" id="form_fotoPacienteFile" name="fotoPacienteFile" accept="image/*" onChange={handleFileChangeModal} ref={fileInputRef} /></CCol>
                <CCol xs={12} className="text-center mt-3"> {previewUrl && <CImage src={previewUrl} alt="Previsualización" thumbnail width={150} className="mb-2" onError={(e) => { e.target.onerror = null; e.target.src = placeholderAvatar; }}/>} </CCol>
              </CRow>
            </CModalBody>
            <CModalFooter> <CButton color="secondary" variant="outline" onClick={handleCloseFormModal} disabled={formLoading}>Cancelar</CButton> <CButton type="submit" color="primary" disabled={formLoading}> {formLoading ? <CSpinner size="sm" className="me-2"/> : <CIcon icon={cilSave} className="me-2"/>} {pacienteEnFormulario ? "Guardar Cambios" : "Registrar Paciente"} </CButton> </CModalFooter>
          </CForm>
        </CModal>
      )}
    </div>
  );
};

export default RegistroPacientes;