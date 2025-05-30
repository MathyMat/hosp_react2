// src/views/HistorialClinico/HistorialClinicoPaciente.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CAlert, CSpinner,
  CAvatar, CButton, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CForm, CFormInput, CFormLabel, CFormSelect, CListGroup, CListGroupItem
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilUser, cilMedicalCross, cilCalendar, cilNotes, cilArrowLeft, cilHospital,
  cilHealing, cilClock, cilPeople, cilWarning, cilInfo, cilPencil, cilSave,
  cilBuilding, cilXCircle, cilCheckCircle, cilPlus
} from '@coreui/icons';

import placeholderAvatar from '../../assets/images/avatar-placeholder.png';
import { API_BASE_URL } from '../../config/apiConfig';

const HistorialClinicoPaciente = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  const [pacienteInfo, setPacienteInfo] = useState(null);
  const [historialPrincipal, setHistorialPrincipal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const initialFormDataModal = {
    enfermedad: '', medicamentos_actuales: '', observaciones: '',
    // edad ya no se edita aquí, se toma del paciente o del historial existente
    genero: '',
    tiempo_ultima_atencion_dias: '',
    // visitas_ultimos_30_dias: '', // Eliminado
    visitas_ultimos_6_meses: '',
    hospitalizaciones_ultimo_anio: ''
  };
  const [formDataModal, setFormDataModal] = useState(initialFormDataModal);
  const [edadParaModal, setEdadParaModal] = useState(''); // Estado separado para mostrar la edad (no editable)
  const [loadingModal, setLoadingModal] = useState(false);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({
    title: '', message: '', color: 'info', icon: cilInfo
  });
  
  const opcionesGeneroHistorial = [
    { value: '', label: 'Seleccione...' },
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Femenino', label: 'Femenino' },
    { value: 'Otro', label: 'Otro' },
  ];

  const mostrarNotificacion = (title, message, type = 'info') => {
    let icon = cilInfo; let color = type;
    if (type === 'success') icon = cilCheckCircle;
    else if (type === 'error') { icon = cilWarning; color = 'danger'; }
    else if (type === 'warning') icon = cilWarning;
    setNotificationModalConfig({ title, message, color, icon });
    setShowNotificationModal(true);
  };

  const calcularEdadActual = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) { edad--; }
    return edad >= 0 ? edad : 'N/A';
  };

  const formatDisplayDateTime = (isoString, onlyDate = false) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Fecha Inválida';
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      if (!onlyDate) { options.hour = '2-digit'; options.minute = '2-digit';}
      return date.toLocaleString('es-ES', options);
    } catch (e) { console.error("Error al formatear fecha-hora:", e); return 'Error Fecha'; }
  };

  const cargarDatosPrincipales = async () => {
    if (!pacienteId) { setError("ID de paciente no proporcionado."); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/historial-clinico/paciente/${pacienteId}`);
      setPacienteInfo(response.data.paciente);
      const historialDelPaciente = response.data.historial || [];
      if (historialDelPaciente.length > 0) {
        const historialOrdenado = historialDelPaciente.sort((a, b) => new Date(b.fecha_registro_historial) - new Date(a.fecha_registro_historial));
        setHistorialPrincipal(historialOrdenado[0]);
      } else {
        setHistorialPrincipal(null);
      }
    } catch (err) {
      console.error("Error al cargar datos del paciente y su historial:", err);
      setError(err.response?.data?.error || 'Error al cargar los datos.');
      setPacienteInfo(null); setHistorialPrincipal(null);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    cargarDatosPrincipales();
  }, [pacienteId]);

  const abrirModalHistorialGeneral = () => {
    let edadActualRegistro;
    if (historialPrincipal) { // Modo Edición
      edadActualRegistro = historialPrincipal.edad !== null ? historialPrincipal.edad.toString() : '';
      setFormDataModal({
        enfermedad: historialPrincipal.enfermedad || '',
        medicamentos_actuales: historialPrincipal.medicamentos_actuales || '',
        observaciones: historialPrincipal.observaciones || '',
        genero: historialPrincipal.genero || '',
        tiempo_ultima_atencion_dias: historialPrincipal.tiempo_ultima_atencion_dias !== null ? historialPrincipal.tiempo_ultima_atencion_dias.toString() : '',
        // visitas_ultimos_30_dias: '', // Eliminado
        visitas_ultimos_6_meses: historialPrincipal.visitas_ultimos_6_meses !== null ? historialPrincipal.visitas_ultimos_6_meses.toString() : '',
        hospitalizaciones_ultimo_anio: historialPrincipal.hospitalizaciones_ultimo_anio !== null ? historialPrincipal.hospitalizaciones_ultimo_anio.toString() : '',
      });
    } else { // Modo Creación
      const edadNum = pacienteInfo?.edad !== undefined ? pacienteInfo.edad : (pacienteInfo?.fecha_nacimiento ? calcularEdadActual(pacienteInfo.fecha_nacimiento) : null);
      edadActualRegistro = edadNum !== null ? edadNum.toString() : '';
      const generoActual = pacienteInfo?.genero || '';
      setFormDataModal({
        ...initialFormDataModal,
        genero: generoActual,
        tiempo_ultima_atencion_dias: '0',
        visitas_ultimos_6_meses: '0',
        hospitalizaciones_ultimo_anio: '0',
      });
    }
    setEdadParaModal(edadActualRegistro); // Guardar la edad que se mostrará
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormDataModal(initialFormDataModal);
    setEdadParaModal('');
  };

  const handleFormModalChange = (e) => {
    const { name, value } = e.target;
    setFormDataModal(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitModalHistorial = async (e) => {
    e.preventDefault();
    if (!formDataModal.enfermedad.trim() || !formDataModal.medicamentos_actuales.trim() || !formDataModal.observaciones.trim()) {
      mostrarNotificacion('Campos Incompletos', 'Enfermedad, Medicamentos y Observaciones son requeridos.', 'warning');
      return;
    }

    setLoadingModal(true);
    try {
      const payload = { 
        ...formDataModal,
        edad: edadParaModal !== '' && !isNaN(parseInt(edadParaModal)) ? parseInt(edadParaModal, 10) : null // Usar la edad guardada
      };
      // Eliminar visitas_ultimos_30_dias del payload si aún estuviera por alguna razón
      delete payload.visitas_ultimos_30_dias;

      // Parsear los campos numéricos restantes
      ['tiempo_ultima_atencion_dias', 'visitas_ultimos_6_meses', 'hospitalizaciones_ultimo_anio'].forEach(key => {
        if (payload[key] !== undefined) { // Solo procesar si la clave existe
            payload[key] = payload[key] !== '' && !isNaN(payload[key]) ? parseInt(payload[key], 10) : null;
        }
      });
      if (payload.genero === '') payload.genero = null;

      let response;
      if (historialPrincipal && historialPrincipal.historial_id) {
        response = await axios.put(`${API_BASE_URL}/historial-clinico/${historialPrincipal.historial_id}`, payload);
        setHistorialPrincipal(response.data.historialActualizado);
      } else {
        payload.id_paciente = pacienteInfo.id;
        response = await axios.post(`${API_BASE_URL}/historial-clinico`, payload);
        setHistorialPrincipal(response.data.historialCreado);
      }
      mostrarNotificacion('Éxito', response.data.mensaje || `Historial ${historialPrincipal ? 'actualizado' : 'creado'}.`, 'success');
      handleCloseModal();
    } catch (err) {
      console.error(`Error al ${historialPrincipal ? 'actualizar' : 'crear'} historial:`, err);
      mostrarNotificacion('Error', err.response?.data?.error || `No se pudo ${historialPrincipal ? 'actualizar' : 'crear'} el historial.`, 'error');
    } finally {
      setLoadingModal(false);
    }
  };

  if (loading) { return ( <div className="p-4 text-center"> <CSpinner color="primary" style={{width:'3rem', height:'3rem'}} /> <p className="mt-3">Cargando datos del paciente...</p> </div> ); }
  if (error) { return ( <div className="p-4"> <CAlert color="danger" className="text-center"> <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error</h4> <p>{error}</p> <CButton color="primary" onClick={() => navigate('/pacientes')}> Volver a Pacientes </CButton> </CAlert> </div> ); }
  if (!pacienteInfo) { return ( <div className="p-4"> <CAlert color="warning" className="text-center"> <h4 className="alert-heading"><CIcon icon={cilInfo} className="me-2" /> Paciente no Encontrado</h4> <p>No se pudo encontrar la información.</p> <CButton color="primary" onClick={() => navigate('/pacientes')}> Volver a Pacientes </CButton> </CAlert> </div> ); }

  const edadActualPaciente = pacienteInfo.edad !== undefined ? pacienteInfo.edad : calcularEdadActual(pacienteInfo.fecha_nacimiento);
  // El botón "Agregar Historial" solo aparece si no hay historialPrincipal
  const mostrarBotonAgregar = !historialPrincipal && !loading;

  return (
    <div className="historial-clinico-view p-4">
      <CRow className="mb-3">
        <CCol> <CButton color="secondary" onClick={() => navigate(-1)} className="mb-3"> <CIcon icon={cilArrowLeft} className="me-2" /> Volver </CButton> </CCol>
      </CRow>

      <CCard className="mb-4 shadow-sm" style={{backgroundColor: 'var(--cui-tertiary-bg)', color: 'var(--cui-body-color)'}}>
        <CCardHeader className="bg-transparent border-bottom-0 pt-3">
          <h5 className="mb-0 d-flex align-items-center"> <CIcon icon={cilUser} className="me-2 text-primary" /> Información del Paciente </h5>
        </CCardHeader>
        <CCardBody>
          <CRow className="align-items-center">
            <CCol md={2} xs={12} className="text-center mb-3 mb-md-0">
              <CAvatar src={pacienteInfo.fotoBase64 ? `data:image/jpeg;base64,${pacienteInfo.fotoBase64}` : placeholderAvatar} size="xl" style={{ width: '100px', height: '100px', objectFit: 'cover', border: '2px solid var(--cui-border-color)' }} onError={(e) => { e.target.onerror = null; e.target.src = placeholderAvatar; }} />
            </CCol>
            <CCol md={10} xs={12}>
              <h4 className="mb-1">{pacienteInfo.nombre} {pacienteInfo.apellido}</h4>
              <p className="text-body-secondary mb-1"> <strong>DNI:</strong> {pacienteInfo.dni || 'N/A'} <span className="mx-2">|</span> <strong>Género:</strong> {pacienteInfo.genero || 'N/A'} <span className="mx-2">|</span> <strong>Edad Actual:</strong> {edadActualPaciente} años </p>
              <p className="text-body-secondary mb-0"> <strong>Fecha de Nac.:</strong> {formatDisplayDateTime(pacienteInfo.fecha_nacimiento, true) || 'N/A'} </p>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CCard className="shadow-sm">
        <CCardHeader className="bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0 d-flex align-items-center"> <CIcon icon={cilBuilding} className="me-2" /> Historial Clínico General </h5>
          {pacienteInfo && (
            <CButton
              color="light"
              variant='outline'
              size="sm"
              onClick={abrirModalHistorialGeneral}
              title={historialPrincipal ? "Editar Historial" : "Agregar Historial"}
              disabled={loading || (historialPrincipal && loadingModal)} // Deshabilitar si ya existe y el modal está cargando para editar
            >
              <CIcon icon={historialPrincipal ? cilPencil : cilPlus} className="me-1" />
              {historialPrincipal ? "Editar Historial" : "Agregar Historial"}
            </CButton>
          )}
        </CCardHeader>
        <CCardBody>
          {loading && !historialPrincipal && ( <div className="text-center p-5"><CSpinner color="primary" /><p className="mt-3">Cargando historial...</p></div> )}
          
          {!loading && !historialPrincipal && pacienteInfo && (
            <CAlert color="secondary" className="text-center mt-3">
              <CIcon icon={cilInfo} size="lg" className="mb-2" />
              <p>Este paciente no tiene un historial clínico registrado.</p>
              <p>Utilice el botón "Agregar Historial" en la cabecera para crear uno.</p>
            </CAlert>
          )}

          {!loading && historialPrincipal && (
            <CListGroup flush className='mt-2'>
              <CListGroupItem><strong><CIcon icon={cilCalendar} className="me-2 text-info"/>Fecha de Registro:</strong> {formatDisplayDateTime(historialPrincipal.fecha_registro_historial)}</CListGroupItem>
              <CListGroupItem><strong><CIcon icon={cilHealing} className="me-2 text-danger"/>Enfermedad/Diagnóstico:</strong> {historialPrincipal.enfermedad || 'N/A'}</CListGroupItem>
              <CListGroupItem><strong><CIcon icon={cilPeople} className="me-2 text-primary"/>Edad (al registrar historial):</strong> {historialPrincipal.edad !== null ? `${historialPrincipal.edad} años` : 'N/A'}</CListGroupItem>
              <CListGroupItem><strong><CIcon icon={cilPeople} className="me-2 text-primary"/>Género (al registrar historial):</strong> {historialPrincipal.genero || 'N/A'}</CListGroupItem>
              <CListGroupItem><strong><CIcon icon={cilHealing} className="me-2"/>Medicamentos:</strong> <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin:0, fontFamily:'inherit'}}>{historialPrincipal.medicamentos_actuales || 'N/A'}</pre></CListGroupItem>
              <CListGroupItem><strong><CIcon icon={cilNotes} className="me-2"/>Observaciones:</strong> <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin:0, fontFamily:'inherit'}}>{historialPrincipal.observaciones || 'N/A'}</pre></CListGroupItem>
              <CListGroupItem><strong><CIcon icon={cilClock} className="me-2 text-warning"/>Días desde Última Atención (registrado):</strong> {historialPrincipal.tiempo_ultima_atencion_dias ?? 'N/A'}</CListGroupItem>
              <CListGroupItem><strong><CIcon icon={cilCalendar} className="me-2"/>Visitas en Últimos 6 Meses (registrado):</strong> {historialPrincipal.visitas_ultimos_6_meses ?? 'N/A'}</CListGroupItem>
              <CListGroupItem><strong><CIcon icon={cilHospital} className="me-2 text-danger"/>Hospitalizaciones en Último Año (registrado):</strong> {historialPrincipal.hospitalizaciones_ultimo_anio ?? 'N/A'}</CListGroupItem>
            </CListGroup>
          )}
        </CCardBody>
      </CCard>

      <CModal alignment="center" visible={showNotificationModal} onClose={() => setShowNotificationModal(false)}>
        <CModalHeader onClose={() => setShowNotificationModal(false)} className={`bg-${notificationModalConfig.color} text-white`}> <CModalTitle><CIcon icon={notificationModalConfig.icon} className="me-2" />{notificationModalConfig.title}</CModalTitle> </CModalHeader>
        <CModalBody>{notificationModalConfig.message}</CModalBody>
        <CModalFooter> <CButton color={notificationModalConfig.color} onClick={() => setShowNotificationModal(false)}>Aceptar</CButton> </CModalFooter>
      </CModal>

      {showModal && (
        <CModal alignment="center" size="lg" visible={showModal} onClose={handleCloseModal} backdrop="static">
          <CModalHeader>
            <CModalTitle>
                <CIcon icon={historialPrincipal ? cilPencil : cilPlus} className="me-2"/>
                {historialPrincipal ? `Editar Historial Clínico` : "Agregar Historial Clínico"}
            </CModalTitle>
          </CModalHeader>
          <CForm onSubmit={handleSubmitModalHistorial}>
            <CModalBody>
              {historialPrincipal && <p className="text-body-secondary mb-2">Editando historial registrado el: {formatDisplayDateTime(historialPrincipal.fecha_registro_historial)}</p>}
              <CRow className="g-3">
                <CCol md={12}><CFormLabel htmlFor="modal_hist_enfermedad">Enfermedad Principal/Diagnóstico *</CFormLabel><CFormInput id="modal_hist_enfermedad" name="enfermedad" value={formDataModal.enfermedad} onChange={handleFormModalChange} required /></CCol>
                <CCol md={12}><CFormLabel htmlFor="modal_hist_medicamentos">Medicamentos Actuales *</CFormLabel><CFormInput component="textarea" rows={3} id="modal_hist_medicamentos" name="medicamentos_actuales" value={formDataModal.medicamentos_actuales} onChange={handleFormModalChange} required /></CCol>
                <CCol md={12}><CFormLabel htmlFor="modal_hist_observaciones">Observaciones y Notas Adicionales *</CFormLabel><CFormInput component="textarea" rows={4} id="modal_hist_observaciones" name="observaciones" value={formDataModal.observaciones} onChange={handleFormModalChange} required /></CCol>
                
                <CCol md={6}>
                    <CFormLabel htmlFor="modal_hist_edad_display">Edad (al momento del registro)</CFormLabel>
                    {/* Campo de edad solo para mostrar, no editable por el usuario */}
                    <CFormInput 
  type="text" 
  id="modal_hist_edad_display" 
  value={edadParaModal ? `${edadParaModal} años` : 'Automática'} 
  onChange={(e) => setEdadParaModal(e.target.value)} 
/>

                </CCol>
                <CCol md={6}><CFormLabel htmlFor="modal_hist_genero_atencion">Género (al momento del registro)</CFormLabel><CFormSelect id="modal_hist_genero_atencion" name="genero" value={formDataModal.genero} onChange={handleFormModalChange} > {opcionesGeneroHistorial.map(op => <option key={op.value} value={op.value} disabled={op.value === ''}>{op.label}</option>)} </CFormSelect></CCol>
                
                <CCol md={4}><CFormLabel htmlFor="modal_hist_tiempo_ult_atencion">Días Últ. Atención</CFormLabel><CFormInput type="number" id="modal_hist_tiempo_ult_atencion" name="tiempo_ultima_atencion_dias" value={formDataModal.tiempo_ultima_atencion_dias} onChange={handleFormModalChange} min="0" /></CCol>
                {/* <CCol md={3}><CFormLabel htmlFor="modal_hist_visitas_30d">Visitas (30d)</CFormLabel><CFormInput type="number" id="modal_hist_visitas_30d" name="visitas_ultimos_30_dias" value={formDataModal.visitas_ultimos_30_dias} onChange={handleFormModalChange} min="0" /></CCol> // Eliminado */}
                <CCol md={4}><CFormLabel htmlFor="modal_hist_visitas_6m">Visitas (6m)</CFormLabel><CFormInput type="number" id="modal_hist_visitas_6m" name="visitas_ultimos_6_meses" value={formDataModal.visitas_ultimos_6_meses} onChange={handleFormModalChange} min="0" /></CCol>
                <CCol md={4}><CFormLabel htmlFor="modal_hist_hosp_1a">Hospitalizaciones (1año)</CFormLabel><CFormInput type="number" id="modal_hist_hosp_1a" name="hospitalizaciones_ultimo_anio" value={formDataModal.hospitalizaciones_ultimo_anio} onChange={handleFormModalChange} min="0" /></CCol>
              </CRow>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" variant="outline" onClick={handleCloseModal} disabled={loadingModal}>Cancelar</CButton>
              <CButton type="submit" color="primary" disabled={loadingModal}>
                {loadingModal ? <CSpinner size="sm" className="me-2"/> : <CIcon icon={cilSave} className="me-2"/>}
                {historialPrincipal ? "Guardar Cambios" : "Agregar Historial"}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModal>
      )}
    </div>
  );
};

export default HistorialClinicoPaciente;
