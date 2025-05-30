// src/views/Prediccion/PrediccionReingreso.jsx
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
  cilBarChart, cilListNumbered, cilMedicalCross, cilUser, cilReload, cilSearch,
  cilCommentSquare // Ícono para la explicación
} from '@coreui/icons';

// API_BASE_URL es para tu backend de GESTIÓN (Node.js/Express)
// donde obtienes la lista de pacientes y los detalles del paciente/historial
import { API_BASE_URL } from '../../config/apiConfig'; 

// URL para tu API de PREDICCIÓN (Python/Flask desplegada en Render)
// Esta API ahora solo necesita devolver { prediccion, probabilidad }
const ML_PREDICTION_API_URL = 'https://prediccion-machine-learning-hosp-react.onrender.com/api/prediction/predict';

// ¡ADVERTENCIA DE SEGURIDAD!
// Exponer tu GEMINI_API_KEY en el frontend es un riesgo de seguridad significativo.
// Considera esto solo para desarrollo/prototipado o entornos muy controlados.
// Para producción, la llamada a Gemini DEBERÍA hacerse desde un backend.

const GEMINI_API_ENDPOINT = 'AIzaSyAA6WnY1A7w4lE-u43nnE4MOQoubDAct2A'
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyAA6WnY1A7w4lE-u43nnE4MOQoubDAct2A` 
    : null;

const PrediccionReingreso = () => {
  const initialFormData = {
    id_paciente_seleccionado: '',
    edad: '', genero: '', enfermedad: '',
    tiempo_ultima_atencion_dias: '', visitas_ultimos_30_dias: '',
    visitas_ultimos_6_meses: '', hospitalizaciones_ultimo_anio: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [predictionResult, setPredictionResult] = useState(null); // { prediccion, probabilidad, explicacion }
  const [loadingMlPrediction, setLoadingMlPrediction] = useState(false);
  const [loadingGeminiExplanation, setLoadingGeminiExplanation] = useState(false);
  const [loadingPacientesList, setLoadingPacientesList] = useState(true);
  const [pacientes, setPacientes] = useState([]);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({
    title: '', message: '', color: 'info', icon: cilInfo
  });

  const opcionesGeneroPrediccion = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' },
  ];

  useEffect(() => {
    const cargarListaPacientes = async () => {
      setLoadingPacientesList(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/pacientes`);
        if (Array.isArray(res.data)) {
          const pacientesOrdenados = res.data.sort((a, b) =>
            (`${a.apellido} ${a.nombre}`).localeCompare(`${b.apellido} ${b.nombre}`)
          );
          setPacientes(pacientesOrdenados);
        } else { setPacientes([]); }
      } catch (err) {
        console.error("Error al cargar lista de pacientes:", err);
        mostrarNotificacion('Error de Carga', 'No se pudo cargar la lista de pacientes.', 'error');
        setPacientes([]);
      } finally { setLoadingPacientesList(false); }
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
    const hoy = new Date(); const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) { edad--; }
    return edad >= 0 ? edad.toString() : '';
  };

  const handlePacienteSeleccionadoChange = async (e) => {
    const pacienteId = e.target.value;
    setFormData(prev => ({ ...initialFormData, id_paciente_seleccionado: pacienteId }));
    setPredictionResult(null);

    if (pacienteId) {
      setLoadingMlPrediction(true);
      try {
        const resPaciente = await axios.get(`${API_BASE_URL}/pacientes/${pacienteId}`);
        const pacienteData = resPaciente.data;
        
        const resHistorial = await axios.get(`${API_BASE_URL}/historial-clinico/paciente/${pacienteId}`);
        let ultimoHistorial = null;
        if (resHistorial.data && resHistorial.data.historial && resHistorial.data.historial.length > 0) {
            ultimoHistorial = resHistorial.data.historial.sort((a,b) => new Date(b.fecha_registro_historial) - new Date(a.fecha_registro_historial))[0];
        }

        setFormData(prev => ({
          ...prev,
          id_paciente_seleccionado: pacienteId,
          edad: pacienteData.edad !== undefined ? pacienteData.edad.toString() : calcularEdadDesdeFecha(pacienteData.fecha_nacimiento),
          genero: pacienteData.genero ? pacienteData.genero.toLowerCase() : '',
          enfermedad: ultimoHistorial?.enfermedad || '',
          tiempo_ultima_atencion_dias: ultimoHistorial?.tiempo_ultima_atencion_dias?.toString() || '0',
          visitas_ultimos_30_dias: ultimoHistorial?.visitas_ultimos_30_dias?.toString() || '0',
          visitas_ultimos_6_meses: ultimoHistorial?.visitas_ultimos_6_meses?.toString() || '0',
          hospitalizaciones_ultimo_anio: ultimoHistorial?.hospitalizaciones_ultimo_anio?.toString() || '0',
        }));
      } catch (err) {
        console.error("Error al cargar datos del paciente/historial:", err);
        mostrarNotificacion('Error de Carga', `No se pudieron cargar los datos del paciente ID ${pacienteId}.`, 'error');
        setFormData(initialFormData);
      } finally { setLoadingMlPrediction(false); }
    }
  };

  const handleResetForm = () => { setFormData(initialFormData); setPredictionResult(null); };

  const generarExplicacionConGeminiFrontend = async (prediccionMlInfo, datosDelPaciente) => {
  if (!GEMINI_API_ENDPOINT) {
    console.warn("API Key de Gemini no configurada o endpoint no disponible.");
    return "Servicio de análisis detallado (IA) no configurado o no disponible.";
  }

  setLoadingGeminiExplanation(true);
  const { prediccion, probabilidad } = prediccionMlInfo;

  const prompt_parts = [
    "Actúa como un asistente médico virtual experto. Tu tarea es explicar de forma concisa, profesional y en un solo párrafo (máximo 4 frases) el resultado de una predicción de riesgo de reingreso hospitalario a otro profesional de la salud.",
    "La predicción se basa en los siguientes datos del paciente:",
    `- Edad: ${datosDelPaciente.edad || 'N/A'} años.`,
    `- Género: ${datosDelPaciente.genero || 'N/A'}.`,
    `- Condición Principal Reportada: ${datosDelPaciente.enfermedad || 'N/A'}.`,
    `- Días desde Última Atención Médica: ${datosDelPaciente.tiempo_ultima_atencion_dias || 'N/A'}.`,
    `- Visitas en Últimos 30 Días: ${datosDelPaciente.visitas_ultimos_30_dias || 'N/A'}.`,
    `- Atenciones en Últimos 6 Meses: ${datosDelPaciente.visitas_ultimos_6_meses || 'N/A'}.`,
    `- Hospitalizaciones en Último Año: ${datosDelPaciente.hospitalizaciones_ultimo_anio || 'N/A'}.`,
    `\nEl modelo de IA ha generado una predicción basada en estos datos.`,
    "Redacta la explicación destacando los posibles factores de los datos proporcionados que podrían ser más relevantes para este resultado. Basa tu explicación ÚNICAMENTE en la información dada. Evita especulaciones o recomendaciones médicas directas no fundamentadas en estos datos."
  ];

  if (prediccion === 1) {
    prompt_parts.push("Enfatiza los elementos que sugieren un mayor riesgo.");
  } else {
    prompt_parts.push("Enfatiza los elementos que sugieren estabilidad o menor riesgo.");
  }

  const prompt_final = prompt_parts.join("\n");

  const requestBody = {
    contents: [{ parts: [{ text: prompt_final }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 200, candidateCount: 1 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };

  try {
    const geminiResponse = await axios.post(GEMINI_API_ENDPOINT, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (geminiResponse.data.candidates && geminiResponse.data.candidates[0]?.content?.parts?.[0]?.text) {
      return geminiResponse.data.candidates[0].content.parts[0].text.trim();
    } else {
      let reason = "Respuesta inesperada de IA.";
      if (geminiResponse.data.candidates?.[0]?.finishReason) {
        reason = `Motivo: ${geminiResponse.data.candidates[0].finishReason}`;
      } else if (geminiResponse.data.promptFeedback?.blockReason) {
        reason = `Bloqueado por IA: ${geminiResponse.data.promptFeedback.blockReason}`;
      }
      console.warn("Respuesta de Gemini no tuvo el formato esperado.", reason, geminiResponse.data);
      return `No se pudo generar una explicación detallada con IA (${reason}).`;
    }
  } catch (error) {
    console.error("Error al llamar a la API de Gemini:", error.response?.data || error.message);
    return "Error al contactar el servicio de IA para la explicación. Por favor, verifique la consola para más detalles.";
  } finally {
    setLoadingGeminiExplanation(false);
  }
};
const handleSubmitPrediction = async (e) => {
    e.preventDefault();
    if (!formData.id_paciente_seleccionado) {
      mostrarNotificacion('Paciente no Seleccionado', 'Por favor, seleccione un paciente.', 'warning'); return;
    }
    const camposParaEnviar = {
      edad: parseFloat(formData.edad), genero: formData.genero, enfermedad: formData.enfermedad,
      tiempo_ultima_atencion_dias: parseFloat(formData.tiempo_ultima_atencion_dias),
      visitas_ultimos_30_dias: parseFloat(formData.visitas_ultimos_30_dias),
      visitas_ultimos_6_meses: parseFloat(formData.visitas_ultimos_6_meses),
      hospitalizaciones_ultimo_anio: parseFloat(formData.hospitalizaciones_ultimo_anio),
    };
    for (const key of ['edad', 'tiempo_ultima_atencion_dias', 'visitas_ultimos_30_dias', 'visitas_ultimos_6_meses', 'hospitalizaciones_ultimo_anio']) {
        if (isNaN(camposParaEnviar[key])) {
            mostrarNotificacion('Datos Inválidos', `El campo '${key.replace(/_/g, ' ')}' debe ser un número válido.`, 'warning'); return;
        }
    }
    if (!camposParaEnviar.genero) { mostrarNotificacion('Datos Inválidos', 'El género es requerido.', 'warning'); return; }

    setLoadingMlPrediction(true); 
    setPredictionResult(null);
    let explicacionTexto = "Generando análisis..."; // Placeholder inicial

    try {
      const responseML = await axios.post(ML_PREDICTION_API_URL, camposParaEnviar);
      const prediccionMlData = responseML.data;
      setLoadingMlPrediction(false); 

      if (prediccionMlData && typeof prediccionMlData.prediccion !== 'undefined') {
        // Actualizar el resultado parcial para mostrar predicción y probabilidad mientras se genera explicación
        setPredictionResult({ ...prediccionMlData, explicacion: explicacionTexto });

        if (GEMINI_API_ENDPOINT) {
          explicacionTexto = await generarExplicacionConGeminiFrontend(prediccionMlData, formData);
        } else {
          explicacionTexto = "Servicio de análisis detallado (IA) no configurado.";
        }
        // Actualizar el resultado final con la explicación
        setPredictionResult(prevResult => ({ ...prevResult, explicacion: explicacionTexto }));
        mostrarNotificacion('Predicción Realizada', 'Se ha obtenido el resultado y el análisis.', 'success');
      } else {
        throw new Error("La respuesta de la API de predicción ML no fue la esperada.");
      }
    } catch (err) {
      console.error("Error en el proceso de predicción y/o explicación:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Ocurrió un error en el proceso.';
      mostrarNotificacion('Error en Proceso', errorMsg, 'error');
      setLoadingMlPrediction(false);
      setLoadingGeminiExplanation(false); // Asegurarse que ambos se detengan
      setPredictionResult(prev => prev ? {...prev, explicacion: "Fallo al generar análisis."} : null);
    }
  };

  return (
    <div className="prediction-view p-4">
      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="bg-info text-white">
          <h5 className="mb-0 d-flex align-items-center"> <CIcon icon={cilChartLine} className="me-2" /> Predicción de Reingreso Hospitalario </h5>
        </CCardHeader>
        <CCardBody>
          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel htmlFor="id_paciente_seleccionado"><CIcon icon={cilUser} className="me-1" />Seleccione Paciente *</CFormLabel>
              {loadingPacientesList ? ( <CSpinner size="sm" /> ) : (
                <CFormSelect id="id_paciente_seleccionado" value={formData.id_paciente_seleccionado} onChange={handlePacienteSeleccionadoChange} required >
                  <option value="">-- Seleccionar un paciente --</option>
                  {pacientes.map(p => ( <option key={p.id} value={p.id}> {`${p.apellido}, ${p.nombre} (DNI: ${p.dni})`} </option> ))}
                </CFormSelect>
              )}
            </CCol>
          </CRow>

          {formData.id_paciente_seleccionado && (
            <CForm onSubmit={handleSubmitPrediction}>
              <CCallout color="light" className='mb-4'>
                <h6 className='mb-3'><CIcon icon={cilInfo} className="me-2 text-info"/>Datos para Predicción (Automáticos):</h6>
                <CRow className="g-3">
                    <CCol md={4}><CFormLabel>Edad</CFormLabel><CFormInput type="text" value={formData.edad} readOnly /></CCol>
                    <CCol md={4}><CFormLabel>Género</CFormLabel><CFormInput type="text" value={opcionesGeneroPrediccion.find(g => g.value === formData.genero)?.label || formData.genero || 'N/A'} readOnly /></CCol>
                    <CCol md={4}><CFormLabel>Enfermedad (últ. at.)</CFormLabel><CFormInput type="text" value={formData.enfermedad} readOnly /></CCol>
                    <CCol md={3}><CFormLabel>Días Últ. Aten.</CFormLabel><CFormInput type="text" value={formData.tiempo_ultima_atencion_dias} readOnly /></CCol>
                    <CCol md={3}><CFormLabel>Visitas (30 Días)</CFormLabel><CFormInput type="text" value={formData.visitas_ultimos_30_dias} readOnly /></CCol>
                    <CCol md={3}><CFormLabel>Aten. (6 Meses)</CFormLabel><CFormInput type="text" value={formData.visitas_ultimos_6_meses} readOnly /></CCol>
                    <CCol md={3}><CFormLabel>Hosp. (1 Año)</CFormLabel><CFormInput type="text" value={formData.hospitalizaciones_ultimo_anio} readOnly /></CCol>
                </CRow>
              </CCallout>
              <CRow>
                <CCol xs={12} className="text-center">
                  <CButton type="submit" color="primary" className="me-2 px-4" disabled={loadingMlPrediction || loadingGeminiExplanation || !formData.id_paciente_seleccionado}> 
                    {(loadingMlPrediction || loadingGeminiExplanation) ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilLightbulb} className="me-2" />} 
                    Predecir y Analizar
                  </CButton>
                  <CButton type="button" color="secondary" variant="outline" onClick={handleResetForm} disabled={loadingMlPrediction || loadingGeminiExplanation}> 
                    <CIcon icon={cilReload} className="me-2" /> Limpiar 
                  </CButton>
                </CCol>
              </CRow>
            </CForm>
          )}
          {!formData.id_paciente_seleccionado && !loadingPacientesList && ( <CAlert color="info" className="text-center mt-3"> <CIcon icon={cilSearch} className="me-2"/> Seleccione un paciente. </CAlert> )}
        </CCardBody>
      </CCard>
      
      {/* Mostrar resultado de la predicción y la explicación */}
      {predictionResult && ( // Mostrar esta sección si hay predictionResult
        <CCard className="mt-4 shadow-sm">
          <CCardHeader className={`text-white ${predictionResult.prediccion === 1 ? 'bg-danger' : 'bg-success'}`}>
            <h5 className="mb-0 d-flex align-items-center"> 
              <CIcon icon={predictionResult.prediccion === 1 ? cilWarning : cilCheckCircle} className="me-2" /> 
              Resultado de la Predicción 
            </h5>
          </CCardHeader>
          <CCardBody>
            <CRow className="align-items-center mb-3">
                <CCol md={6} className="text-center text-md-start mb-3 mb-md-0">
                    <h4> Predicción: <span className={`fw-bold ${predictionResult.prediccion === 1 ? 'text-danger' : 'text-success'}`}> {predictionResult.prediccion === 1 ? 'SÍ REINGRESA' : 'NO REINGRESA'} </span> </h4>
                </CCol>
                
            </CRow>
            
            {/* Mostrar la explicación (de Gemini o el fallback) o el spinner si se está cargando */}
            {loadingGeminiExplanation && predictionResult.explicacion === "Generando análisis..." && (
                <div className="text-center p-3"><CSpinner color="info" /><p className="mt-2">Generando análisis detallado con IA...</p></div>
            )}
            {predictionResult.explicacion && (!loadingGeminiExplanation || predictionResult.explicacion !== "Generando análisis...") && (
              <CCallout 
                color={predictionResult.prediccion === 1 ? "warning" : "info"} 
                className="mt-3" 
                style={{ backgroundColor: 'var(--cui-tertiary-bg)', borderColor: 'var(--cui-border-color-translucent)', color: 'var(--cui-body-color)' }}
              >
                <h6 className="d-flex align-items-center mb-2"> 
                  <CIcon icon={cilCommentSquare} className="me-2"/>Análisis Detallado:
                </h6>
                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'inherit', fontSize: '0.95rem', margin: 0, padding: "0.5rem 0.2rem", lineHeight: '1.6' }}>
                  {predictionResult.explicacion}
                </pre>
              </CCallout>
            )}
          </CCardBody>
        </CCard>
      )}

      
            {/* AQUI VA EL DASHBOARD DE POWER BI */}
            <CCard className="mt-4 mb-4 shadow-sm">
              <CCardHeader className="bg-primary text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <CIcon icon={cilBarChart} className="me-2" /> {/* Puedes cambiar este icono si prefieres otro */}
                  Dashboard de Reingreso Hospitalario (Power BI)
                </h5>
              </CCardHeader>
              <CCardBody>
                {/* Contenedor para hacer el iframe responsivo con un aspecto 16:10 (600w / 373.5h) */}
                <div style={{ position: 'relative', paddingTop: '62.25%', height: 0 }}>
                  <iframe
                    title="prediccion-ia"
                    width="100%" // Ocupa el ancho completo del contenedor
                    height="100%" // Ocupa el alto completo del contenedor
                    src="https://app.powerbi.com/view?r=eyJrIjoiMjZmNGY5YjEtZDAyMy00M2Q4LTg1MjItY2RhZTU0ODc0NDMxIiwidCI6ImI0YTQwNTQ1LTc3NzktNGIzOC1hZmY3LTFmMTczOGY4MDg0MCIsImMiOjR9"
                    frameBorder="0" // En React, es frameBorder
                    allowFullScreen={true} // En React, es allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0 }} // Para posicionar dentro del contenedor responsivo
                  ></iframe>
                </div>
              </CCardBody>
            </CCard>
            {/* FIN DEL DASHBOARD DE POWER BI */}
      
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
