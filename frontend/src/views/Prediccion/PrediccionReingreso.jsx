// src/views/Prediccion/PrediccionReingreso.js (o la ruta que uses)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput,
  CFormLabel, CFormSelect, CRow, CAlert, CSpinner, CModal, CModalHeader,
  CModalTitle, CModalBody, CModalFooter, CProgress, CProgressBar, CCallout
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilLightbulb, cilWarning, cilCheckCircle, cilXCircle,
  cilInfo, cilChartLine, cilHealing, cilCalendar,
  cilBarChart, cilListNumbered, cilMedicalCross, cilUser, cilReload, cilSearch
} from '@coreui/icons';

import { API_BASE_URL } from '../../config/apiConfig'; // Asegúrate que esta es la URL de TU backend

const PrediccionReingreso = () => {
  const initialFormData = {
    id_paciente_seleccionado: '', // NUEVO: Para el selector
    edad: '',
    genero: '',
    enfermedad: '',
    tiempo_ultima_atencion_dias: '',
    visitas_ultimos_30_dias: '',
    visitas_ultimos_6_meses: '',
    hospitalizaciones_ultimo_anio: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingPacientes, setLoadingPacientes] = useState(true); // NUEVO: Para cargar la lista de pacientes
  const [pacientes, setPacientes] = useState([]); // NUEVO: Lista de pacientes para el selector

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({
    title: '', message: '', color: 'info', icon: cilInfo
  });

  // NUEVO: Cargar la lista de pacientes al montar el componente
  useEffect(() => {
    const cargarListaPacientes = async () => {
      setLoadingPacientes(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/pacientes`); // Usa tu endpoint de pacientes
        if (Array.isArray(res.data)) {
          // Ordenar para una mejor UX en el selector
          const pacientesOrdenados = res.data.sort((a, b) =>
            `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)
          );
          setPacientes(pacientesOrdenados);
        } else {
          setPacientes([]);
        }
      } catch (err) {
        console.error("Error al cargar lista de pacientes:", err);
        mostrarNotificacion('Error', 'No se pudo cargar la lista de pacientes.', 'error');
        setPacientes([]);
      } finally {
        setLoadingPacientes(false);
      }
    };
    cargarListaPacientes();
  }, []);


  const mostrarNotificacion = (title, message, type = 'info') => {
    let icon = cilInfo; let color = type;
    if (type === 'success') icon = cilCheckCircle;
    else if (type === 'error') { icon = cilWarning; color = 'danger'; }
    else if (type === 'warning') icon = cilWarning;
    setNotificationModalConfig({ title, message, color, icon });
    setShowNotificationModal(true);
  };

  const calcularEdadDesdeFecha = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }
    return edad >= 0 ? edad.toString() : '';
  };


  // NUEVO: Manejar selección de paciente y autocompletar
  const handlePacienteSeleccionadoChange = async (e) => {
    const pacienteId = e.target.value;
    setFormData(prev => ({ ...initialFormData, id_paciente_seleccionado: pacienteId })); // Resetea otros campos pero mantiene el ID
    setPredictionResult(null);

    if (pacienteId) {
      setLoadingPrediction(true); // Usar un spinner mientras se cargan los datos del paciente
      try {
        // 1. Obtener datos del paciente
        const resPaciente = await axios.get(`${API_BASE_URL}/pacientes/${pacienteId}`); // Asume que tienes un endpoint para un solo paciente
        const pacienteData = resPaciente.data;

        // 2. Obtener el último registro del historial clínico para ese paciente
        //    (Necesitarás un endpoint en tu backend para esto, o ajustar el que ya tienes)
        //    Por ejemplo: /api/historial-clinico/paciente/:pacienteId/ultimo
        //    O si tu endpoint /api/historial-clinico/paciente/:pacienteId devuelve el historial ordenado,
        //    puedes tomar el primer elemento. Aquí asumiré que ya tienes los datos del historial más reciente.

        // EJEMPLO ASUMIENDO QUE EL ENDPOINT DE HISTORIAL DEVUELVE EL ÚLTIMO PRIMERO
        const resHistorial = await axios.get(`${API_BASE_URL}/historial-clinico/paciente/${pacienteId}`);
        let ultimoHistorial = null;
        if (resHistorial.data && resHistorial.data.historial && resHistorial.data.historial.length > 0) {
            // Asumimos que el historial viene ordenado DESC por fecha, así que el primero es el más reciente
            ultimoHistorial = resHistorial.data.historial[0];
        }


        setFormData(prev => ({
          ...prev,
          id_paciente_seleccionado: pacienteId,
          edad: pacienteData.edad !== undefined ? pacienteData.edad.toString() : calcularEdadDesdeFecha(pacienteData.fecha_nacimiento), // Usar edad de la tabla paciente (generada)
          genero: pacienteData.genero ? pacienteData.genero.toLowerCase() : '', // Ajustar a 'masculino', 'femenino'
          // Estos campos vendrían del ÚLTIMO registro en historial_clinico para ese paciente
          enfermedad: ultimoHistorial?.enfermedad || '',
          tiempo_ultima_atencion_dias: ultimoHistorial?.tiempo_ultima_atencion_dias?.toString() || '0', // Default a 0 si no hay historial previo
          visitas_ultimos_30_dias: ultimoHistorial?.visitas_ultimos_30_dias?.toString() || '0',
          visitas_ultimos_6_meses: ultimoHistorial?.visitas_ultimos_6_meses?.toString() || '0',
          hospitalizaciones_ultimo_anio: ultimoHistorial?.hospitalizaciones_ultimo_anio?.toString() || '0',
        }));
      } catch (err) {
        console.error("Error al cargar datos del paciente/historial para predicción:", err);
        mostrarNotificacion('Error', 'No se pudieron cargar los datos del paciente seleccionado para la predicción.', 'error');
        setFormData(initialFormData); // Reset en caso de error
      } finally {
        setLoadingPrediction(false);
      }
    }
  };


  const handleResetForm = () => {
    setFormData(initialFormData);
    setPredictionResult(null);
  };

  const handleSubmitPrediction = async (e) => {
    e.preventDefault();
    if (!formData.id_paciente_seleccionado) {
      mostrarNotificacion('Paciente no Seleccionado', 'Por favor, seleccione un paciente.', 'warning');
      return;
    }
    // Validar que los campos necesarios para la predicción estén llenos (aunque sean readOnly, por si acaso)
    const camposPrediccion = ['edad', 'genero', 'enfermedad', 'tiempo_ultima_atencion_dias', 'visitas_ultimos_30_dias', 'visitas_ultimos_6_meses', 'hospitalizaciones_ultimo_anio'];
    for (const key of camposPrediccion) {
      if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
        mostrarNotificacion('Datos Incompletos', `Faltan datos para la predicción (campo: ${key.replace(/_/g, ' ')}). Intente seleccionar el paciente de nuevo.`, 'warning');
        return;
      }
    }

    setLoadingPrediction(true);
    setPredictionResult(null);

    // Preparar datos para la API de predicción
    // La API de predicción espera ciertos nombres de campo, asegúrate que coincidan
    const dataParaAPIExterna = {
      edad: parseFloat(formData.edad),
      genero: formData.genero, // Ya debería estar en el formato correcto (ej. 'masculino')
      enfermedad: formData.enfermedad,
      tiempo_ultima_atencion_dias: parseFloat(formData.tiempo_ultima_atencion_dias),
      visitas_ultimos_30_dias: parseFloat(formData.visitas_ultimos_30_dias),
      visitas_ultimos_6_meses: parseFloat(formData.visitas_ultimos_6_meses),
      hospitalizaciones_ultimo_anio: parseFloat(formData.hospitalizaciones_ultimo_anio),
    };

    try {
      const response = await axios.post(`https://prediccion-machine-learning-hosp-react.onrender.com/api/prediction/predict`, dataParaAPIExterna);
      setPredictionResult(response.data);
      mostrarNotificacion('Predicción Exitosa', 'Se ha obtenido el resultado de la predicción.', 'success');
    } catch (err) {
      console.error("Error al realizar la predicción:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'No se pudo obtener la predicción. Intente nuevamente.';
      mostrarNotificacion('Error de Predicción', errorMessage, 'error');
    } finally {
      setLoadingPrediction(false);
    }
  };

  // Opciones de género para el formulario de predicción (debe coincidir con lo que espera el modelo)
  const opcionesGeneroPrediccion = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    // { value: 'otro', label: 'Otro' }, // Si tu modelo no maneja 'otro', omítelo.
  ];


  return (
    <div className="prediction-view p-4">
      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="bg-info text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <CIcon icon={cilChartLine} className="me-2" />
            Predicción de Reingreso Hospitalario
          </h5>
        </CCardHeader>
        <CCardBody>
          {/* NUEVO: Selector de Pacientes */}
          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel htmlFor="id_paciente_seleccionado"><CIcon icon={cilUser} className="me-1" />Seleccione Paciente *</CFormLabel>
              {loadingPacientes ? (
                <CSpinner size="sm" />
              ) : (
                <CFormSelect
                  id="id_paciente_seleccionado"
                  name="id_paciente_seleccionado"
                  value={formData.id_paciente_seleccionado}
                  onChange={handlePacienteSeleccionadoChange}
                  required
                >
                  <option value="">-- Seleccionar un paciente --</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>
                      {`${p.apellido}, ${p.nombre} (DNI: ${p.dni})`}
                    </option>
                  ))}
                </CFormSelect>
              )}
            </CCol>
          </CRow>

          {/* Formulario con campos autocompletados y bloqueados */}
         {formData.id_paciente_seleccionado && ( // Mostrar solo si un paciente está seleccionado
        <CForm onSubmit={handleSubmitPrediction}>
          <CCallout color="light" className='mb-4'>
            <h6 className='mb-3'><CIcon icon={cilInfo} className="me-2 text-info"/>Datos del Paciente para Predicción:</h6>
            <CRow className="g-3">
                <CCol md={4}>
                    <CFormLabel htmlFor="pred_edad"><CIcon icon={cilCalendar} className="me-1" />Edad</CFormLabel>
                    {/* MODIFICADO: Añadir readOnly */}
                    <CFormInput type="text" id="pred_edad" name="edad" value={formData.edad} readOnly />
                </CCol>
                <CCol md={4}>
                    <CFormLabel htmlFor="pred_genero">Género</CFormLabel>
                    {/* MODIFICADO: Añadir readOnly. El valor mostrado ya se formatea para ser legible. */}
                    <CFormInput type="text" id="pred_genero" name="genero" value={
                        opcionesGeneroPrediccion.find(g => g.value === formData.genero)?.label || formData.genero || 'N/A'
                    } readOnly />
                </CCol>
                <CCol md={4}>
                    <CFormLabel htmlFor="pred_enfermedad"><CIcon icon={cilHealing} className="me-1" />Enfermedad Principal</CFormLabel>
                    {/* MODIFICADO: Añadir readOnly */}
                    <CFormInput type="text" id="pred_enfermedad" name="enfermedad" value={formData.enfermedad} readOnly />
                </CCol>
                <CCol md={6}>
                    <CFormLabel htmlFor="pred_tiempo_ultima_atencion_dias"><CIcon icon={cilCalendar} className="me-1" />Días desde Últ. Atención</CFormLabel>
                    {/* MODIFICADO: Añadir readOnly */}
                    <CFormInput type="text" id="pred_tiempo_ultima_atencion_dias" name="tiempo_ultima_atencion_dias" value={formData.tiempo_ultima_atencion_dias} readOnly />
                </CCol>
                <CCol md={6}>
                    <CFormLabel htmlFor="pred_visitas_ultimos_30_dias"><CIcon icon={cilListNumbered} className="me-1" />Visitas (30 Días)</CFormLabel>
                    {/* MODIFICADO: Añadir readOnly */}
                    <CFormInput type="text" id="pred_visitas_ultimos_30_dias" name="visitas_ultimos_30_dias" value={formData.visitas_ultimos_30_dias} readOnly />
                </CCol>
                <CCol md={6}>
                    <CFormLabel htmlFor="pred_visitas_ultimos_6_meses"><CIcon icon={cilBarChart} className="me-1" />Atenciones (6 Meses)</CFormLabel>
                    {/* MODIFICADO: Añadir readOnly */}
                    <CFormInput type="text" id="pred_visitas_ultimos_6_meses" name="visitas_ultimos_6_meses" value={formData.visitas_ultimos_6_meses} readOnly />
                </CCol>
                <CCol md={6}>
                    <CFormLabel htmlFor="pred_hospitalizaciones_ultimo_anio"><CIcon icon={cilMedicalCross} className="me-1" />Hospitalizaciones (1 Año)</CFormLabel>
                    {/* MODIFICADO: Añadir readOnly */}
                    <CFormInput type="text" id="pred_hospitalizaciones_ultimo_anio" name="hospitalizaciones_ultimo_anio" value={formData.hospitalizaciones_ultimo_anio} readOnly />
                </CCol>
            </CRow>
          </CCallout>
          <CRow>
            <CCol xs={12} className="text-center">
              <CButton type="submit" color="primary" className="me-2 px-4" disabled={loadingPrediction || !formData.id_paciente_seleccionado}>
                {loadingPrediction ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilLightbulb} className="me-2" />}
                Predecir Reingreso
              </CButton>
              <CButton type="button" color="secondary" variant="outline" onClick={handleResetForm} disabled={loadingPrediction}>
                <CIcon icon={cilReload} className="me-2" />
                Limpiar Selección
              </CButton>
            </CCol>
          </CRow>
        </CForm>
      )}
          {!formData.id_paciente_seleccionado && !loadingPacientes && (
            <CAlert color="info" className="text-center mt-3">
              <CIcon icon={cilSearch} className="me-2"/> Por favor, seleccione un paciente de la lista para obtener una predicción.
            </CAlert>
          )}
        </CCardBody>
      </CCard>

      {/* Resultado de la Predicción (sin cambios) */}
      {loadingPrediction && !predictionResult && ( // Mostrar spinner solo durante la predicción, no al cargar paciente
        <div className="text-center p-5">
          <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3">Calculando predicción...</p>
        </div>
      )}

      {predictionResult && !loadingPrediction && (
        <CCard className="mt-4 shadow-sm">
          <CCardHeader className={`text-white ${predictionResult.prediccion === 1 ? 'bg-danger' : 'bg-success'}`}>
            <h5 className="mb-0 d-flex align-items-center">
              <CIcon icon={predictionResult.prediccion === 1 ? cilWarning : cilCheckCircle} className="me-2" />
              Resultado de la Predicción
            </h5>
          </CCardHeader>
          <CCardBody className="text-center">
            <CRow className="align-items-center">
                <CCol md={6}>
                    <h4>
                        Predicción de Reingreso: {' '}
                        <span className={`fw-bold ${predictionResult.prediccion === 1 ? 'text-danger' : 'text-success'}`}>
                            {predictionResult.prediccion === 1 ? 'SÍ REINGRESA' : 'NO REINGRESA'}
                        </span>
                    </h4>
                </CCol>
                <CCol md={6}>
                    <h5>Probabilidad de Reingreso:</h5>
                    <CProgress className="mb-2" height={25}>
                        <CProgressBar
                            value={predictionResult.probabilidad * 100}
                            color={predictionResult.prediccion === 1 ? 'danger' : 'success'}
                            variant="striped"
                            animated
                        >
                            <span className="fw-bold">{(predictionResult.probabilidad * 100).toFixed(2)}%</span>
                        </CProgressBar>
                    </CProgress>
                </CCol>
            </CRow>
            {predictionResult.prediccion === 1 && (
                <CAlert color="warning" className="mt-3 text-start">
                    <CIcon icon={cilWarning} className="me-2"/>
                    <strong>Atención:</strong> El paciente tiene una alta probabilidad de reingreso. Considere revisar el plan de alta y seguimiento.
                </CAlert>
            )}
             {predictionResult.prediccion === 0 && (
                <CAlert color="success" className="mt-3 text-start">
                    <CIcon icon={cilCheckCircle} className="me-2"/>
                    <strong>Información:</strong> El paciente tiene una baja probabilidad de reingreso según el modelo. Continúe con el plan de cuidado estándar.
                </CAlert>
            )}
          </CCardBody>
        </CCard>
      )}

      {/* Dashboard de Power BI (sin cambios) */}
      <CCard className="mt-4 mb-4 shadow-sm">
        <CCardHeader className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <CIcon icon={cilBarChart} className="me-2" />
            Dashboard de Reingreso Hospitalario (Power BI)
          </h5>
        </CCardHeader>
        <CCardBody>
          <div style={{ position: 'relative', paddingTop: '62.25%', height: 0 }}>
            <iframe
              title="prediccion-ia"
              width="100%"
              height="100%"
              src="https://app.powerbi.com/view?r=eyJrIjoiMjZmNGY5YjEtZDAyMy00M2Q4LTg1MjItY2RhZTU0ODc0NDMxIiwidCI6ImI0YTQwNTQ1LTc3NzktNGIzOC1hZmY3LTFmMTczOGY4MDg0MCIsImMiOjR9"
              frameBorder="0"
              allowFullScreen={true}
              style={{ position: 'absolute', top: 0, left: 0 }}
            ></iframe>
          </div>
        </CCardBody>
      </CCard>

      {/* Modal de Notificación */}
      <CModal alignment="center" visible={showNotificationModal} onClose={() => setShowNotificationModal(false)}>
        <CModalHeader onClose={() => setShowNotificationModal(false)} className={`bg-${notificationModalConfig.color} text-white`}>
          <CModalTitle><CIcon icon={notificationModalConfig.icon} className="me-2" />{notificationModalConfig.title}</CModalTitle>
        </CModalHeader>
        <CModalBody>{notificationModalConfig.message}</CModalBody>
        <CModalFooter>
          <CButton color={notificationModalConfig.color} onClick={() => setShowNotificationModal(false)}>Aceptar</CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

export default PrediccionReingreso;