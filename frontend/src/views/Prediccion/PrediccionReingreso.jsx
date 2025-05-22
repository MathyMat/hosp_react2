// src/views/Prediccion/PrediccionReingreso.js
import React, { useState } from 'react';
import axios from 'axios';
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput,
  CFormLabel, CFormSelect, CRow, CAlert, CSpinner, CModal, CModalHeader,
  CModalTitle, CModalBody, CModalFooter, CProgress, CProgressBar
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilLightbulb, cilWarning, cilCheckCircle, cilXCircle,
  cilInfo, cilSave, cilChartLine, cilHealing, cilCalendar,
  cilBarChart, cilListNumbered, cilMedicalCross
} from '@coreui/icons';

import { API_BASE_URL } from '../../config/apiConfig'; // Ajusta la ruta si es necesario

const PrediccionReingreso = () => {
  const initialFormData = {
    edad: '',
    genero: '', // 'masculino', 'femenino', 'otro'
    enfermedad: '',
    tiempo_ultima_atencion_dias: '',
    visitas_ultimos_30_dias: '',
    visitas_ultimos_6_meses: '',
    hospitalizaciones_ultimo_anio: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  // Error state directly in the component, or use notification modal
  // const [error, setError] = useState(''); 

  // State for Notification Modal (reused from Pacientes.js for consistency)
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({
    title: '', message: '', color: 'info', icon: cilInfo
  });

  const opcionesGenero = [
    { value: '', label: 'Seleccione género...' },
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' }, // Asegúrate que estos valores coincidan con los esperados por el backend
  ];

  const mostrarNotificacion = (title, message, type = 'info') => {
    let icon = cilInfo; let color = type;
    if (type === 'success') icon = cilCheckCircle;
    else if (type === 'error') { icon = cilWarning; color = 'danger'; }
    else if (type === 'warning') icon = cilWarning;
    setNotificationModalConfig({ title, message, color, icon });
    setShowNotificationModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
    setPredictionResult(null);
    // setError(''); // Clear direct error message if used
  };

  const handleSubmitPrediction = async (e) => {
    e.preventDefault();
    // Validación simple
    for (const key in formData) {
      if (formData[key] === '' || formData[key] === null) {
        mostrarNotificacion('Campos Incompletos', `El campo '${key.replace(/_/g, ' ')}' es requerido.`, 'warning');
        return;
      }
    }

    setLoading(true);
    setPredictionResult(null);
    // setError(''); // Clear direct error

    const dataParaAPI = {
      ...formData,
      edad: parseFloat(formData.edad),
      tiempo_ultima_atencion_dias: parseFloat(formData.tiempo_ultima_atencion_dias),
      visitas_ultimos_30_dias: parseFloat(formData.visitas_ultimos_30_dias),
      visitas_ultimos_6_meses: parseFloat(formData.visitas_ultimos_6_meses),
      hospitalizaciones_ultimo_anio: parseFloat(formData.hospitalizaciones_ultimo_anio),
      // genero y enfermedad ya son strings
    };

    try {
      const response = await axios.post(`https://prediccion-machine-learning-hosp-react.onrender.com/api/prediction/predict`, dataParaAPI);
      setPredictionResult(response.data);
      mostrarNotificacion('Predicción Exitosa', 'Se ha obtenido el resultado de la predicción.', 'success');
    } catch (err) {
      console.error("Error al realizar la predicción:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'No se pudo obtener la predicción. Intente nuevamente.';
      mostrarNotificacion('Error de Predicción', errorMessage, 'error');
      // setError(errorMessage); // Set direct error
    } finally {
      setLoading(false);
    }
  };

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
          <CForm onSubmit={handleSubmitPrediction}>
            <CRow className="g-3 mb-4">
              <CCol md={4}>
                <CFormLabel htmlFor="edad"><CIcon icon={cilCalendar} className="me-1" />Edad del Paciente (años) *</CFormLabel>
                <CFormInput type="number" id="edad" name="edad" value={formData.edad} onChange={handleInputChange} min="0" required />
              </CCol>
              <CCol md={4}>
                <CFormLabel htmlFor="genero"> Género *</CFormLabel>
                <CFormSelect id="genero" name="genero" value={formData.genero} onChange={handleInputChange} required>
                  {opcionesGenero.map(op => <option key={op.value} value={op.value} disabled={op.value === ''}>{op.label}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel htmlFor="enfermedad"><CIcon icon={cilHealing} className="me-1" />Enfermedad Principal *</CFormLabel>
                <CFormInput type="text" id="enfermedad" name="enfermedad" value={formData.enfermedad} onChange={handleInputChange} placeholder="Ej: diabetes, hipertension" required />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="tiempo_ultima_atencion_dias"><CIcon icon={cilCalendar} className="me-1" />Días desde Última Atención *</CFormLabel>
                <CFormInput type="number" id="tiempo_ultima_atencion_dias" name="tiempo_ultima_atencion_dias" value={formData.tiempo_ultima_atencion_dias} onChange={handleInputChange} min="0" required />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="visitas_ultimos_30_dias"><CIcon icon={cilListNumbered} className="me-1" />Visitas en Últimos 30 Días *</CFormLabel>
                <CFormInput type="number" id="visitas_ultimos_30_dias" name="visitas_ultimos_30_dias" value={formData.visitas_ultimos_30_dias} onChange={handleInputChange} min="0" required />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="visitas_ultimos_6_meses"><CIcon icon={cilBarChart} className="me-1" />Atenciones Previas en 6 Meses *</CFormLabel>
                <CFormInput type="number" id="visitas_ultimos_6_meses" name="visitas_ultimos_6_meses" value={formData.visitas_ultimos_6_meses} onChange={handleInputChange} min="0" required />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="hospitalizaciones_ultimo_anio"><CIcon icon={cilMedicalCross} className="me-1" />Hospitalizaciones en Último Año *</CFormLabel>
                <CFormInput type="number" id="hospitalizaciones_ultimo_anio" name="hospitalizaciones_ultimo_anio" value={formData.hospitalizaciones_ultimo_anio} onChange={handleInputChange} min="0" required />
              </CCol>
            </CRow>
            <CRow>
              <CCol xs={12} className="text-center">
                <CButton type="submit" color="primary" className="me-2 px-4" disabled={loading}>
                  {loading ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilLightbulb} className="me-2" />}
                  Predecir Reingreso
                </CButton>
                <CButton type="button" color="secondary" variant="outline" onClick={handleResetForm} disabled={loading}>
                  <CIcon icon={cilXCircle} className="me-2" />
                  Limpiar Formulario
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* {error && !showNotificationModal && <CAlert color="danger" className="mt-3">{error}</CAlert>} */}

      {loading && (
        <div className="text-center p-5">
          <CSpinner color="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3">Calculando predicción...</p>
        </div>
      )}

      {predictionResult && !loading && (
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

      {/* MODAL DE NOTIFICACIÓN (reutilizado) */}
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