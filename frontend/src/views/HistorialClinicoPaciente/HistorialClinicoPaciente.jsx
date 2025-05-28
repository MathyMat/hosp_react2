// src/views/HistorialClinico/HistorialClinicoPaciente.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Para obtener el ID del paciente de la URL
import axios from 'axios';
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CAlert, CSpinner,
  CAvatar, CListGroup, CListGroupItem, CBadge, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CButton
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilUser, cilMedicalCross, cilCalendar, cilNotes, cilArrowLeft, cilHospital, cilClipboard, cilClock, cilPeople, cilWarning, cilInfo
} from '@coreui/icons';

import placeholderAvatar from '../../assets/images/avatar-placeholder.png';
import { API_BASE_URL } from '../../config/apiConfig';

const HistorialClinicoPaciente = () => {
  const { pacienteId } = useParams(); // Obtiene el ID del paciente de la URL (ej: /historial/:pacienteId)
  const navigate = useNavigate();

  const [pacienteInfo, setPacienteInfo] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
        edad--;
    }
    return edad;
  };
  
  const formatDisplayDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Fecha Inválida';
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC' // Asumiendo que el timestamp del servidor es UTC
      });
    } catch (e) {
      console.error("Error al formatear fecha-hora:", e);
      return 'Error Fecha';
    }
  };


  useEffect(() => {
    const cargarHistorial = async () => {
      if (!pacienteId) {
        setError("No se proporcionó un ID de paciente.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_BASE_URL}/historial-clinico/paciente/${pacienteId}`);
        setPacienteInfo(response.data.paciente);
        setHistorial(response.data.historial);
      } catch (err) {
        console.error("Error al cargar el historial clínico:", err);
        setError(err.response?.data?.error || 'Error al cargar el historial clínico del paciente. Por favor, intente más tarde.');
        setPacienteInfo(null);
        setHistorial([]);
      } finally {
        setLoading(false);
      }
    };

    cargarHistorial();
  }, [pacienteId]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <CSpinner color="primary" style={{width:'3rem', height:'3rem'}} />
        <p className="mt-3">Cargando historial clínico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <CAlert color="danger" className="text-center">
          <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error al Cargar Historial</h4>
          <p>{error}</p>
          <CButton color="primary" onClick={() => navigate('/pacientes')}>
            Volver a Pacientes
          </CButton>
        </CAlert>
      </div>
    );
  }

  if (!pacienteInfo) {
     return (
      <div className="p-4">
        <CAlert color="warning" className="text-center">
          <h4 className="alert-heading"><CIcon icon={cilInfo} className="me-2" /> Paciente no Encontrado</h4>
          <p>No se pudo encontrar la información del paciente seleccionado.</p>
           <CButton color="primary" onClick={() => navigate('/pacientes')}>
            Volver a Pacientes
          </CButton>
        </CAlert>
      </div>
    );
  }

  // Calcular edad del paciente si no viene de la columna generada 'edad'
  const edadPaciente = pacienteInfo.edad !== undefined ? pacienteInfo.edad : calcularEdad(pacienteInfo.fecha_nacimiento);

  return (
    <div className="historial-clinico-view p-4">
      <CRow className="mb-3">
        <CCol>
          <CButton color="secondary" onClick={() => navigate(-1)} className="mb-3"> {/* navigate(-1) va a la página anterior */}
            <CIcon icon={cilArrowLeft} className="me-2" /> Volver
          </CButton>
        </CCol>
      </CRow>

      {/* Información del Paciente */}
      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="bg-light">
          <h5 className="mb-0 d-flex align-items-center">
            <CIcon icon={cilUser} className="me-2 text-primary" />
            Información del Paciente
          </h5>
        </CCardHeader>
        <CCardBody>
          <CRow className="align-items-center">
            <CCol md={2} className="text-center mb-3 mb-md-0">
              <CAvatar
                src={pacienteInfo.fotoBase64 ? `data:image/jpeg;base64,${pacienteInfo.fotoBase64}` : placeholderAvatar}
                size="xl"
                style={{ width: '100px', height: '100px', objectFit: 'cover', border: '2px solid #dee2e6' }}
                onError={(e) => { e.target.onerror = null; e.target.src = placeholderAvatar; }}
              />
            </CCol>
            <CCol md={10}>
              <h4 className="mb-1">{pacienteInfo.nombre} {pacienteInfo.apellido}</h4>
              <p className="text-body-secondary mb-1">
                <strong>DNI:</strong> {pacienteInfo.dni || 'N/A'} <span className="mx-2">|</span>
                <strong>Género:</strong> {pacienteInfo.genero || 'N/A'} <span className="mx-2">|</span>
                <strong>Edad:</strong> {edadPaciente} años
              </p>
              <p className="text-body-secondary mb-0">
                <strong>Fecha de Nac.:</strong> {formatDisplayDateTime(pacienteInfo.fecha_nacimiento)?.split(',')[0] || 'N/A'} {/* Solo fecha */}
              </p>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Historial Clínico */}
      <CCard className="shadow-sm">
        <CCardHeader className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <CIcon icon={cilMedicalCross} className="me-2" />
            Historial de Atenciones
          </h5>
        </CCardHeader>
        <CCardBody>
          {historial.length === 0 ? (
            <CAlert color="info" className="text-center">
              <CIcon icon={cilInfo} size="xl" className="mb-2" />
              <p className="h5">Este paciente no tiene registros en su historial clínico.</p>
            </CAlert>
          ) : (
            <CTable hover responsive striped className="mt-2">
              <CTableHead>
                <CTableRow color="light">
                  <CTableHeaderCell scope="col"><CIcon icon={cilCalendar} className="me-1"/>Fecha Registro</CTableHeaderCell>
                  <CTableHeaderCell scope="col"><CIcon icon={cilHospital} className="me-1"/>Enfermedad/Motivo</CTableHeaderCell>
                  <CTableHeaderCell scope="col"><CIcon icon={cilPeople} className="me-1"/>Edad (en atención)</CTableHeaderCell>
                  <CTableHeaderCell scope="col"><CIcon icon={cilClock} className="me-1"/>Últ. Atención (días)</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Medicamentos</CTableHeaderCell>
                  <CTableHeaderCell scope="col"><CIcon icon={cilNotes} className="me-1"/>Observaciones</CTableHeaderCell>
                  {/* Puedes agregar más columnas según la tabla historial_clinico */}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {historial.map((entrada) => (
                  <CTableRow key={entrada.historial_id}>
                    <CTableDataCell>{formatDisplayDateTime(entrada.fecha_registro_historial)}</CTableDataCell>
                    <CTableDataCell>{entrada.enfermedad || 'N/A'}</CTableDataCell>
                    <CTableDataCell>{entrada.edad !== null ? `${entrada.edad} años` : 'N/A'}</CTableDataCell>
                    <CTableDataCell>{entrada.tiempo_ultima_atencion_dias !== null ? entrada.tiempo_ultima_atencion_dias : 'N/A'}</CTableDataCell>
                    <CTableDataCell style={{maxWidth: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                        {entrada.medicamentos_actuales || 'N/A'}
                    </CTableDataCell>
                    <CTableDataCell style={{maxWidth: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                        {entrada.observaciones || 'N/A'}
                    </CTableDataCell>
                    {/* Ejemplo de como mostrar más campos:
                    <CTableDataCell>{entrada.visitas_ultimos_30_dias ?? 'N/A'}</CTableDataCell>
                    <CTableDataCell>{entrada.visitas_ultimos_6_meses ?? 'N/A'}</CTableDataCell>
                    <CTableDataCell>{entrada.hospitalizaciones_ultimo_anio ?? 'N/A'}</CTableDataCell>
                    */}
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
};

export default HistorialClinicoPaciente;