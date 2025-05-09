// src/views/TuRuta/HabitacionesPacientes.js o similar

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CAlert,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
    cilBed, cilList, cilTrash, cilHospital, cilWarning, 
    cilCheckCircle, cilXCircle, cilInfo, cilPlus // Added for the new button
} from '@coreui/icons';
import { API_BASE_URL } from '../../config/apiConfig';

const HabitacionesPacientes = () => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);

  const [loading, setLoading] = useState(true); // For initial data loading
  const [formLoading, setFormLoading] = useState(false); // For form submission (now in modal)
  const [error, setError] = useState(''); // General errors, especially for list loading

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idParaEliminar, setIdParaEliminar] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({
    title: '',
    message: '',
    color: 'info',
    icon: cilInfo,
  });

  // State for Asignar Modal
  const [showAsignarModal, setShowAsignarModal] = useState(false);

  // Definición del estado formulario
  const [formulario, setFormulario] = useState({
    paciente_id: '',
    habitacion_disponible_id: '',
    fecha_ingreso: '',
    fecha_salida_estimada: '',
    doctor_id: '',
    estado_paciente: 'Estable',
    motivo_ingreso: ''
  });

  const resetFormulario = () => {
    setFormulario({
      paciente_id: '',
      habitacion_disponible_id: '',
      fecha_ingreso: '',
      fecha_salida_estimada: '',
      doctor_id: '',
      estado_paciente: 'Estable',
      motivo_ingreso: ''
    });
  };

  const mostrarNotificacion = (title, message, type = 'info') => {
    let icon = cilInfo;
    let color = type; 
    switch (type) {
      case 'success':
        icon = cilCheckCircle;
        break;
      case 'error':
        icon = cilWarning;
        color = 'danger'; 
        break;
      case 'warning':
        icon = cilWarning;
        break;
      default:
        icon = cilInfo;
        color = 'info';
        break;
    }
    setNotificationModalConfig({ title, message, color, icon });
    setShowNotificationModal(true);
  };

  const cargarDatosDependencias = async () => {
    console.log("HabitacionesPacientes: Iniciando cargarDatosDependencias...");
    try {
      const [resPacientes, resDoctores, resHabDisponibles] = await Promise.all([
        axios.get(`${API_BASE_URL}/pacientes`),
        axios.get(`${API_BASE_URL}/doctores`),
        axios.get(`${API_BASE_URL}/habitaciones/disponibles`),
      ]);
      setPacientes(Array.isArray(resPacientes.data) ? resPacientes.data : []);
      setDoctores(Array.isArray(resDoctores.data) ? resDoctores.data : []);
      setHabitacionesDisponibles(Array.isArray(resHabDisponibles.data) ? resHabDisponibles.data : []);
      console.log("HabitacionesPacientes: Dependencias cargadas.");
      return true;
    } catch (err) {
      console.error("HabitacionesPacientes: Error en cargarDatosDependencias:", err);
      let msg = `Error al cargar datos para selectores: ${err.message}`;
      if (err.response) msg += ` (Status: ${err.response.status})`;
      setError(prev => prev ? `${prev}\n${msg}` : msg); // Accumulate errors
      return false;
    }
  };
  
  const cargarAsignacionesActuales = async () => {
    console.log("HabitacionesPacientes: Cargando asignaciones actuales...");
    try {
        const resAsignaciones = await axios.get(`${API_BASE_URL}/habitaciones/asignadas`);
        setAsignaciones(Array.isArray(resAsignaciones.data) ? resAsignaciones.data : []);
        console.log("HabitacionesPacientes: Asignaciones cargadas.");
        return true;
    } catch (err) {
        console.error("HabitacionesPacientes: Error en cargarAsignacionesActuales:", err);
        let msg = `Error al cargar lista de asignaciones: ${err.message}`;
        if (err.response) msg += ` (Status: ${err.response.status})`;
        setError(prev => prev ? `${prev}\n${msg}` : msg); // Accumulate errors
        setAsignaciones([]);
        return false;
    }
  }

  const cargarTodo = async () => {
    console.log("HabitacionesPacientes: Iniciando cargarTodo...");
    setLoading(true);
    setError(''); // Clear previous errors before new load attempt
    await Promise.all([
        cargarDatosDependencias(),
        cargarAsignacionesActuales()
    ]);
    setLoading(false);
    console.log("HabitacionesPacientes: cargarTodo finalizado. Loading:", false);
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const recargarDatosPostAccion = async () => {
    console.log("Recargando datos post-acción...");
    setLoading(true); // Indicate loading for dependent data
    const asignacionesOk = await cargarAsignacionesActuales();
    const habDisponiblesOk = await (async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/habitaciones/disponibles`);
            setHabitacionesDisponibles(Array.isArray(res.data) ? res.data : []);
            return true;
        } catch (err) { 
            console.error("Error recargando habitaciones disponibles post-acción:", err);
            let msg = `Fallo al recargar habitaciones disponibles: ${err.message}`;
            if (err.response) msg += ` (Status: ${err.response.status})`;
            setError(prev => prev ? `${prev}\n${msg}` : msg);
            return false; 
        }
    })();
    setLoading(false);
    if (!asignacionesOk || !habDisponiblesOk) {
        console.warn("Problema al recargar datos post-acción.");
    }
  };

  const handleAsignarSubmit = async (e) => {
    e.preventDefault();
    if (!formulario.paciente_id || !formulario.habitacion_disponible_id || !formulario.fecha_ingreso || !formulario.doctor_id) {
        mostrarNotificacion('Campos Incompletos', 'Por favor, complete Paciente, Habitación, Fecha de Ingreso y Médico.', 'warning');
        return;
    }
    setFormLoading(true);
    try {
      const datosAEnviar = { 
        paciente_id: parseInt(formulario.paciente_id, 10),
        habitacion_disponible_id: parseInt(formulario.habitacion_disponible_id, 10),
        fecha_ingreso: formulario.fecha_ingreso,
        fecha_salida_estimada: formulario.fecha_salida_estimada || null,
        doctor_id: parseInt(formulario.doctor_id, 10),
        estado_paciente: formulario.estado_paciente,
        motivo_ingreso: formulario.motivo_ingreso.trim()
      };
      const response = await axios.post(`${API_BASE_URL}/habitaciones/asignar`, datosAEnviar);
      mostrarNotificacion('Asignación Exitosa', response.data?.message || 'La habitación ha sido asignada correctamente.', 'success');
      resetFormulario();
      setShowAsignarModal(false); // Close modal on success
      await recargarDatosPostAccion();
    } catch (err) {
      console.error('Error al asignar habitación:', err);
      mostrarNotificacion('Error al Asignar', err.response?.data?.message || err.response?.data?.error || 'Ocurrió un error al intentar asignar la habitación.', 'error');
    } finally {
      setFormLoading(false);
    }
  };
  
  const solicitarEliminarAsignacion = (id) => {
    setError(''); 
    setIdParaEliminar(id);
    setShowDeleteModal(true);
  };

  const confirmarYEliminarAsignacion = async () => {
    if (!idParaEliminar) return;
    setLoadingDelete(true);
    setError('');
    try {
      const response = await axios.delete(`${API_BASE_URL}/habitaciones/asignadas/${idParaEliminar}`);
      mostrarNotificacion('Eliminación Exitosa', response.data?.message || 'La asignación ha sido eliminada correctamente.', 'success');
      await recargarDatosPostAccion();
    } catch (err) {
      console.error('Error al eliminar asignación:', err);
      mostrarNotificacion('Error al Eliminar', err.response?.data?.message || err.response?.data?.error || 'Ocurrió un error al intentar eliminar la asignación.', 'error');
    } finally {
      setLoadingDelete(false);
      setShowDeleteModal(false);
      setIdParaEliminar(null);
    }
  };

  const estadoPacienteOpciones = [
    { value: 'Estable', label: 'Estable' },
    { value: 'Observación', label: 'Observación' },
    { value: 'Crítico', label: 'Crítico' },
  ];

  const getNombrePaciente = (pacienteId) => {
    const paciente = pacientes.find(p => p.id === parseInt(pacienteId));
    return paciente ? `${paciente.nombre} ${paciente.apellido}` : `ID: ${pacienteId}`;
  };

  const getNombreDoctor = (doctorId) => {
    const doctor = doctores.find(d => d.id === parseInt(doctorId));
    return doctor ? `${doctor.nombre} ${doctor.apellidos || doctor.apellido}` : `ID: ${doctorId}`;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    try {
        return new Date(dateTimeString).toLocaleString('es-ES', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    } catch (e) {
        return 'Fecha inválida';
    }
  };

  if (loading && error && !pacientes.length && !doctores.length && !habitacionesDisponibles.length && !asignaciones.length) {
    return (
        <div className="p-4">
            <CAlert color="danger" className="text-center">
                <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error Crítico de Carga Inicial</h4>
                <p>{error.split('\n').map((item, key) => <div key={key}>{item}</div>)}</p>
                <hr />
                <CButton color="primary" onClick={cargarTodo} disabled={loading}>
                  {loading ? <CSpinner size="sm" /> : "Reintentar Carga Completa"}
                </CButton>
            </CAlert>
        </div>
    );
  }

  return (
    <div className="p-4">
      <CRow className="mb-3">
        <CCol className="text-end">
          <CButton 
            color="primary" 
            onClick={() => { resetFormulario(); setShowAsignarModal(true); }} 
            className="px-4 py-2 shadow-sm"
            disabled={loading} // Disable if initial data is loading
          >
            <CIcon icon={cilPlus} className="me-2" />
            Asignar Nueva Habitación
          </CButton>
        </CCol>
      </CRow>

      {/* MODAL PARA ASIGNAR HABITACIÓN */}
      <CModal 
        alignment="center" 
        size="lg" 
        visible={showAsignarModal} 
        onClose={() => { setShowAsignarModal(false); resetFormulario(); }} 
        backdrop="static"
      >
        <CModalHeader onClose={() => { setShowAsignarModal(false); resetFormulario(); }}>
          <CModalTitle><CIcon icon={cilHospital} className="me-2" /> Asignar Habitación a Paciente</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleAsignarSubmit}>
          <CModalBody>
            {/* Display general error if it occurred during initial load and modal is opened */}
            {error && !loading && (
              <CAlert color="warning" dismissible onClose={() => setError('')}>
                Error al cargar datos necesarios para la asignación:
                {error.split('\n').map((item, key) => <div key={key}>{item}</div>)}
                Por favor, intente recargar la página o contacte a soporte.
              </CAlert>
            )}
            <CRow className="g-3 mb-4">
              <CCol md={6}>
                <CFormLabel htmlFor="modal_paciente_id">Paciente *</CFormLabel>
                <CFormSelect id="modal_paciente_id" name="paciente_id" value={formulario.paciente_id} onChange={handleChange} required disabled={loading || formLoading || !pacientes.length}>
                  <option value="">{(loading && !pacientes.length) ? "Cargando pacientes..." : (pacientes.length ? "Seleccione paciente" : "No hay pacientes")}</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={6}>
                <CFormLabel htmlFor="modal_habitacion_disponible_id">Habitación disponible *</CFormLabel>
                <CFormSelect id="modal_habitacion_disponible_id" name="habitacion_disponible_id" value={formulario.habitacion_disponible_id} onChange={handleChange} required disabled={loading || formLoading || !habitacionesDisponibles.length}>
                  <option value="">{(loading && !habitacionesDisponibles.length) ? "Cargando habitaciones..." : (habitacionesDisponibles.length ? "Seleccione habitación" : "No hay habitaciones disponibles")}</option>
                  {habitacionesDisponibles.map(h => (
                    <option key={h.id} value={h.id}>{h.numero} - {h.tipo}</option> 
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={6}>
                <CFormLabel htmlFor="modal_fecha_ingreso">Fecha de Ingreso *</CFormLabel>
                <CFormInput id="modal_fecha_ingreso" type="datetime-local" name="fecha_ingreso" value={formulario.fecha_ingreso} onChange={handleChange} required disabled={formLoading} />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="modal_fecha_salida_estimada">Fecha de Salida Estimada</CFormLabel>
                <CFormInput id="modal_fecha_salida_estimada" type="datetime-local" name="fecha_salida_estimada" value={formulario.fecha_salida_estimada} onChange={handleChange} disabled={formLoading}/>
              </CCol>

              <CCol md={6}>
                <CFormLabel htmlFor="modal_doctor_id">Médico *</CFormLabel>
                <CFormSelect id="modal_doctor_id" name="doctor_id" value={formulario.doctor_id} onChange={handleChange} required disabled={loading || formLoading || !doctores.length}>
                  <option value="">{(loading && !doctores.length) ? "Cargando médicos..." : (doctores.length ? "Seleccione médico" : "No hay médicos")}</option>
                  {doctores.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.nombre} {doc.apellidos || doc.apellido}</option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={6}>
                <CFormLabel htmlFor="modal_estado_paciente">Estado del paciente</CFormLabel>
                <CFormSelect id="modal_estado_paciente" name="estado_paciente" value={formulario.estado_paciente} onChange={handleChange} disabled={formLoading}>
                  {estadoPacienteOpciones.map(opcion => (
                     <option key={opcion.value} value={opcion.value}>
                       {opcion.label}
                     </option>
                  ))}
                </CFormSelect>
              </CCol>
              
              <CCol xs={12}>
                <CFormLabel htmlFor="modal_motivo_ingreso">Motivo de Ingreso</CFormLabel>
                <CFormInput id="modal_motivo_ingreso" type="text" name="motivo_ingreso" value={formulario.motivo_ingreso} onChange={handleChange} placeholder="Motivo de Ingreso" disabled={formLoading}/>
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => { setShowAsignarModal(false); resetFormulario(); }} disabled={formLoading}>
              Cancelar
            </CButton>
            <CButton type="submit" color="primary" disabled={formLoading || loading || !pacientes.length || !habitacionesDisponibles.length || !doctores.length}>
              {formLoading ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilBed} className="me-2" />}
              Asignar Habitación
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      <CCard className="shadow-sm mt-2"> {/* Original CCard for the list, mt-2 to give space for button */}
        <CCardHeader className="bg-primary text-white"> {/* Added bg-primary and text-white for consistency */}
          <h5 className="mb-0 d-flex align-items-center">
            <CIcon icon={cilList} className="me-2" />
            Listado de Asignaciones
          </h5>
        </CCardHeader>
        <CCardBody>
          {loading && !asignaciones.length && (
            <div className="text-center p-5">
              <CSpinner color="primary" />
              <p className="mt-2">Cargando lista de asignaciones...</p>
            </div>
          )}
          {!loading && !asignaciones.length && !error && ( // No general error, and no asignaciones
            <CAlert color="info" className="text-center">No hay asignaciones registradas actualmente. Use el botón "Asignar Nueva Habitación" para agregar una.</CAlert>
          )}
           {/* Display general error if it occurred and the list is empty or failed to load */}
           {!loading && error && ( 
             <CAlert color="warning" className="text-center" dismissible onClose={() => setError('')}>
                Hubo problemas al cargar los datos:
                {error.split('\n').map((item, key) => <div key={key}>{item}</div>)}
                <CButton color="warning" variant='outline' size="sm" className="mt-2" onClick={cargarTodo} disabled={loading}>Reintentar</CButton>
             </CAlert>
           )}

          {!loading && asignaciones.length > 0 && (
            <div className="table-responsive">
              <CTable hover dark className="modern-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Paciente</CTableHeaderCell>
                    <CTableHeaderCell>Habitación</CTableHeaderCell>
                    <CTableHeaderCell>Ingreso</CTableHeaderCell>
                    <CTableHeaderCell>Salida Estimada</CTableHeaderCell>
                    <CTableHeaderCell>Médico</CTableHeaderCell>
                    <CTableHeaderCell>Estado Paciente</CTableHeaderCell>
                    <CTableHeaderCell>Motivo</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Acciones</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {asignaciones.map(a => (
                    <CTableRow key={a.id}>
                      <CTableDataCell>{a.id}</CTableDataCell>
                      <CTableDataCell>{getNombrePaciente(a.paciente_id)}</CTableDataCell>
                      <CTableDataCell>{a.numero_habitacion_asignada || a.numero_disponible || a.numero || 'N/A'} - {a.tipo_habitacion_asignada || a.tipo_disponible || a.tipo || 'N/A'}</CTableDataCell>
                      <CTableDataCell>{formatDateTime(a.fecha_ingreso)}</CTableDataCell>
                      <CTableDataCell>{formatDateTime(a.fecha_salida_estimada)}</CTableDataCell>
                      <CTableDataCell>{getNombreDoctor(a.doctor_id)}</CTableDataCell>
                      <CTableDataCell>{a.estado_paciente}</CTableDataCell>
                      <CTableDataCell>{a.motivo_ingreso || '-'}</CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CButton 
                            color="danger" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => solicitarEliminarAsignacion(a.id)} 
                            disabled={loading || formLoading || loadingDelete} 
                        >
                          <CIcon icon={cilTrash} className="me-1" /> 
                          Eliminar
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Delete Confirmation Modal */}
      <CModal alignment="center" visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader onClose={() => setShowDeleteModal(false)}>
          <CModalTitle><CIcon icon={cilWarning} className="me-2 text-danger" /> Confirmar Eliminación</CModalTitle>
        </CModalHeader>
        <CModalBody>
          ¿Está seguro de que desea eliminar la asignación con ID <strong>{idParaEliminar}</strong>? Esta acción no se puede deshacer.
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loadingDelete}>
            <CIcon icon={cilXCircle} className="me-1" /> Cancelar
          </CButton>
          <CButton color="danger" onClick={confirmarYEliminarAsignacion} disabled={loadingDelete}>
            {loadingDelete ? (
              <CSpinner size="sm" className="me-2" />
            ) : (
              <CIcon icon={cilCheckCircle} className="me-1" />
            )}
            Eliminar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Notification Modal */}
      <CModal alignment="center" visible={showNotificationModal} onClose={() => setShowNotificationModal(false)}>
        <CModalHeader onClose={() => setShowNotificationModal(false)} className={`bg-${notificationModalConfig.color} text-white`}>
          <CModalTitle>
            <CIcon icon={notificationModalConfig.icon} className="me-2" /> 
            {notificationModalConfig.title}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {notificationModalConfig.message}
        </CModalBody>
        <CModalFooter>
          <CButton color={notificationModalConfig.color} onClick={() => setShowNotificationModal(false)}>
            Aceptar
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

export default HabitacionesPacientes;