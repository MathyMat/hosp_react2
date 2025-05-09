// src/views/pages/login/Login.jsx (o tu ruta a IniciarSesion.jsx)
import React, { useState, useEffect } from 'react'; // Añade useEffect
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; // Añade useLocation
import {
  CButton, CCard, CCardBody, CCol, CContainer, CForm,
  CFormInput, CRow, CFormLabel, CFormCheck, CLink, CAlert, CSpinner // Añadido CSpinner
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilHospital } from '@coreui/icons';
import { useAuth } from '../../../context/authContext.js'; // Ajusta la ruta a tu AuthContext

import { API_BASE_URL } from '../../../config/apiConfig';
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Para redirigir a la página previa si aplica
  const { login: authLogin, isAuthenticated } = useAuth(); // Obtener la función login del contexto y isAuthenticated
  
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // No implementado aún, pero lo dejamos
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);



  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { correo, password });
      authLogin(res.data.token); // <--- USA LA FUNCIÓN LOGIN DEL CONTEXTO
      
      // Redirigir a la página desde la que vino (si aplica) o al dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });

    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión. Verifique sus credenciales.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  // El JSX de tu login (sin cambios mayores, solo añadí CSpinner al botón)
  return (
    <div
      className="min-vh-100 d-flex flex-column justify-content-between px-0 py-0"
      style={{ /* ... tus estilos ... */ }}
    >
      {/* ... tu estructura de header y fondo ... */}
       <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '55vh',
          backgroundColor: '#0b2047',
          borderBottomLeftRadius: '50% 60px',
          borderBottomRightRadius: '50% 60px',
          zIndex: 0,
        }}
      />

      <div
        className="w-100 d-flex flex-column justify-content-start align-items-center"
        style={{
          paddingTop: 'calc(15vh - 50px)',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          marginBottom: '1rem', 
        }}
      >
        <CIcon icon={cilHospital} size="3xl" style={{ color: 'white', marginBottom: '0.75rem' }} />
        <h2 className="text-white fw-bold" style={{ fontSize: '1.5rem', letterSpacing: '1px' }}>SISTEMA | MEDIASSIST</h2>
      </div>


      <CContainer className="d-flex flex-column flex-grow-1 justify-content-start align-items-center pt-0">
        <CRow className="justify-content-center w-100" style={{ position: 'relative', zIndex: 1 }}>
          <CCol md={7} lg={5} xl={4}>
            <CCard className="p-4 shadow-lg" style={{ borderRadius: '10px', backgroundColor: '#FFFFFF' }}>
              <CCardBody className="py-4 px-md-4">
                <CForm onSubmit={handleLogin}>
                  <div className="text-center mb-4">
                    <h1 className="h4 mb-1" style={{color: '#2c3e50', fontWeight: '600'}}>¡Bienvenido de vuelta!</h1>
                    <p className="text-body-secondary" style={{fontSize: '0.9em', color: '#566573'}}>Inicia sesión para acceder al SISTEMA</p>
                  </div>

                  {error && (
                    <CAlert color="danger" className="d-flex align-items-center mb-3 py-2" style={{fontSize: '0.85em'}}>
                      <CIcon icon={cilLockLocked} className="flex-shrink-0 me-2" width={18} height={18} />
                      <div>{error}</div>
                    </CAlert>
                  )}

                  <div className="mb-3">
                    <CFormLabel htmlFor="loginCorreo" style={{color: '#495057', fontSize: '0.85em', marginBottom:'0.3rem'}}>Usuario</CFormLabel>
                    <CFormInput
                      type="email" id="loginCorreo" value={correo}
                      onChange={(e) => setCorreo(e.target.value)} required
                      style={{backgroundColor: '#f0f3f5', borderColor: '#ced4da', fontSize:'0.9em', padding:'0.6rem 0.75rem'}}
                      placeholder="Ingrese su correo"
                    />
                  </div>

                  <div className="mb-3">
                    <CFormLabel htmlFor="loginPassword" style={{color: '#495057', fontSize: '0.85em', marginBottom:'0.3rem'}}>Contraseña</CFormLabel>
                    <CFormInput
                      type="password" id="loginPassword" value={password}
                      onChange={(e) => setPassword(e.target.value)} required
                      style={{backgroundColor: '#f0f3f5', borderColor: '#ced4da', fontSize:'0.9em', padding:'0.6rem 0.75rem'}}
                      placeholder="Ingrese su contraseña"
                    />
                  </div>

                  <div className="mb-4">
                    <CFormCheck
                      id="rememberMe" label="Recuérdame" checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{fontSize: '0.85em', color: '#495057'}}
                    />
                  </div>

                  <div className="d-grid">
                    <CButton
                      type="submit"
                      style={{ backgroundColor: '#0b2047', borderColor: '#0b2047', color: 'white', padding: '0.65rem 0', fontSize: '0.95em' }}
                      disabled={loading}
                      className="fw-bold"
                    >
                      {loading ? <CSpinner size="sm" as="span" aria-hidden="true" className="me-1" /> : null}
                      {loading ? 'Ingresando...' : 'Iniciar sesión'}
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
        {/* ... (resto de tu JSX del footer y link de soporte) ... */}
        <div className="text-center mt-3" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '0.8em', color: '#566573' }}>
                <p className="mb-0">
                    ¿Olvidaste tu clave? Por favor, comunicarse con el buzón:
                </p>
                <CLink href="mailto:soporte.mediassist@ejemplo.com" className="d-block" style={{color: '#0b2047', textDecoration: 'underline', fontWeight:'500', marginTop: '2px'}}>
                    soporte.mediassist@ejemplo.com
                </CLink>
            </div>
        </div>
      </CContainer>
      <footer className="w-100 text-center py-3 mt-auto" style={{ position: 'relative', zIndex: 1, backgroundColor: 'transparent' }}>
        <p className="mb-0" style={{ fontSize: '0.8em', color: '#566573' }}>
          © {new Date().getFullYear()} MediAssist.
        </p>
      </footer>
    </div>
  )
}

export default Login;