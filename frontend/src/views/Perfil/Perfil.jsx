// src/views/Perfil/Perfil.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  CCard, CCardBody, CCardHeader, CNav, CNavItem, CNavLink, CTabContent, CTabPane,
  CRow, CCol, CForm, CFormLabel, CFormInput, CFormSelect, CButton, CAvatar,
  CSpinner, CAlert, CBadge,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilUser, cilLockLocked, cilSave, cilShieldAlt, cilCamera, cilWarning, 
  cilPencil, cilX // Iconos para Editar y Cancelar
} from '@coreui/icons';
import { useAuth } from '../../context/authContext.js'; 
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL } from '../../config/apiConfig'; // Ajusta si tu URL base es diferente

const Perfil = () => {
  const { usuario: authUser, token, logout, updateUserProfilePhotoInContext } = useAuth(); // Renombrado para claridad
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [originalPersonalInfo, setOriginalPersonalInfo] = useState(null);

  const [personalInfo, setPersonalInfo] = useState({
    apellido_paterno: '',
    apellido_materno: '',
    nombres: '',
    dni: '',
    correo: '', // Correo principal (del token/backend, no editable aquí)
    correo_recuperacion: '',
    fecha_nacimiento: '',
    telefono_celular: '',
    tipo_telefono: '',
    genero: '',
    distrito: '',
    direccion: '',
    fotoBase64: null,
    rol_nombre: '', // Para mostrar el nombre del rol
  });
  const [passwordChange, setPasswordChange] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // Para la previsualización de la imagen

  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [successPassword, setSuccessPassword] = useState(null);

  const generoOptions = [ { label: 'Seleccione...', value: '' }, { label: 'Masculino', value: 'Masculino' }, { label: 'Femenino', value: 'Femenino' }, { label: 'Otro', value: 'Otro' }, { label: 'Prefiero no decirlo', value: 'Prefiero no decirlo'} ];
  const distritoOptions = [ { label: 'Seleccione...', value: '' }, { label: 'Lima', value: 'Lima' }, { label: 'Cusco', value: 'Cusco' }, { label: 'Arequipa', value: 'Arequipa' }, /* ... más distritos ... */ ];
  const telefonoTipoOptions = [ { label: 'Seleccione...', value: '' }, { label: 'Celular', value: 'Celular' }, { label: 'Fijo', value: 'Fijo' }, { label: 'Trabajo', value: 'Trabajo'}, ];

  const mapRoleIdToName = (roleId) => {
    switch (parseInt(roleId)) { 
      case 1: return 'Administrador';
      case 2: return 'Doctor';
      case 3: return 'Paciente';
      default: return 'Rol no especificado';
    }
  };
  
  const getAuthHeaders = () => {
    if (token) { return { Authorization: `Bearer ${token}` }; }
    console.warn("Perfil: No hay token disponible para getAuthHeaders.");
    return {};
  };

  const fetchProfile = async () => {
    setLoading(true); setError(null); setSuccessInfo(null);
    const headers = getAuthHeaders();

    if (!authUser || !headers.Authorization) {
      setError("No autenticado o información de usuario no disponible. Por favor, inicie sesión.");
      setLoading(false);
      setTimeout(() => { 
        if(typeof logout === 'function') logout(); 
        navigate('/login', { replace: true }); 
      }, 2500);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios/perfil`, { headers }); 
      const userData = response.data;
      
      const formattedData = {
        apellido_paterno: userData.apellido_paterno || '',
        apellido_materno: userData.apellido_materno || '',
        nombres: userData.nombres || '',
        dni: userData.dni || '',
        correo: userData.correo || (authUser?.correo || ''), // Correo del perfil o del token como fallback
        correo_recuperacion: userData.correo_recuperacion || '',
        fecha_nacimiento: userData.fecha_nacimiento ? userData.fecha_nacimiento.split('T')[0] : '',
        telefono_celular: userData.telefono_celular || '',
        tipo_telefono: userData.tipo_telefono || '',
        genero: userData.genero || '',
        distrito: userData.distrito || '',
        direccion: userData.direccion || '',
        fotoBase64: userData.fotoBase64 || null,
        rol_nombre: mapRoleIdToName(authUser?.rol || userData.rol_id), // Usar rol del token o del perfil
      };
      setPersonalInfo(formattedData);
      setOriginalPersonalInfo(formattedData);

      if (userData.fotoBase64) {
        setPreviewUrl(`data:image/jpeg;base64,${userData.fotoBase64}`);
      } else {
        setPreviewUrl("https://via.placeholder.com/150?text=Sin+Foto");
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Sesión expirada o no autorizada. Por favor, inicie sesión nuevamente.');
        if(typeof logout === 'function') logout(); 
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      } else {
        setError(err.response?.data?.message || 'No se pudo cargar la información del perfil.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && authUser) { 
        fetchProfile();
    } else if (!token && !loading) { // Evitar loop si ya se está cargando o no hay token
        setLoading(false);
        setError("No hay sesión activa. Redirigiendo al login...");
        setTimeout(() => navigate('/login', {replace: true }), 2000);
    }
    // La dependencia de authUser asegura que si el objeto authUser cambia (ej. rol), se recargue.
  }, [token, authUser, navigate, logout]); 

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
    setSuccessInfo(null); setError(null);
  };

  const handleFileChange = (e) => {
    if (!isEditing) return;
    const file = e.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/gif")) {
        if (file.size > 5 * 1024 * 1024) { 
            alert("El archivo es demasiado grande. Máximo 5MB.");
            setPreviewUrl(originalPersonalInfo?.fotoBase64 ? `data:image/jpeg;base64,${originalPersonalInfo.fotoBase64}` : "https://via.placeholder.com/150?text=Sin+Foto");
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = null; 
            return;
        }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => { setPreviewUrl(reader.result); };
        reader.readAsDataURL(file);
    } else {
        setSelectedFile(null);
        setPreviewUrl(originalPersonalInfo?.fotoBase64 ? `data:image/jpeg;base64,${originalPersonalInfo.fotoBase64}` : "https://via.placeholder.com/150?text=Sin+Foto");
        if (file) { alert("Por favor, seleccione un archivo de imagen válido (JPG, PNG, GIF)."); }
    }
  };

  const handleToggleEdit = () => {
    setError(null); 
    setSuccessInfo(null);
    if (isEditing && originalPersonalInfo) {
      setPersonalInfo(originalPersonalInfo);
      setPreviewUrl(originalPersonalInfo.fotoBase64 ? `data:image/jpeg;base64,${originalPersonalInfo.fotoBase64}` : "https://via.placeholder.com/150?text=Sin+Foto");
      setSelectedFile(null);
      if(fileInputRef.current) fileInputRef.current.value = null;
    }
    setIsEditing(prev => !prev);
  };

  const handleUpdatePersonalInfo = async (e) => {
    e.preventDefault();
    if (!personalInfo.nombres || !personalInfo.apellido_paterno || !personalInfo.apellido_materno || !personalInfo.dni || !personalInfo.fecha_nacimiento || !personalInfo.telefono_celular || !personalInfo.genero || !personalInfo.direccion) {
        setError('Por favor, completa todos los campos marcados con *.');
        setSuccessInfo(null); return;
    }
    setSavingInfo(true); setError(null); setSuccessInfo(null);
    
    const formData = new FormData();
    // Solo enviar campos que el backend espera para actualizar (excluir rol_nombre, correo principal)
    formData.append('nombres', personalInfo.nombres);
    formData.append('apellido_paterno', personalInfo.apellido_paterno);
    formData.append('apellido_materno', personalInfo.apellido_materno);
    formData.append('dni', personalInfo.dni);
    formData.append('correo_recuperacion', personalInfo.correo_recuperacion || '');
    formData.append('fecha_nacimiento', personalInfo.fecha_nacimiento);
    formData.append('genero', personalInfo.genero || '');
    formData.append('telefono_celular', personalInfo.telefono_celular || '');
    formData.append('tipo_telefono', personalInfo.tipo_telefono || '');
    formData.append('distrito', personalInfo.distrito || '');
    formData.append('direccion', personalInfo.direccion || '');
    // Si tienes un campo 'nombre' (display name) que el backend también actualiza:
    // formData.append('nombre', personalInfo.nombre_display_o_username); 
    if (selectedFile) { formData.append('fotoFile', selectedFile); }

    const headers = getAuthHeaders();
    if (!headers.Authorization) { setError("No autenticado."); setSavingInfo(false); return; }

    try {
      const response = await axios.put(`${API_BASE_URL}/usuarios/perfil`, formData, { headers });
      setSuccessInfo(response.data.message || 'Información actualizada con éxito.');
      
      const newFotoBase64 = response.data.newFotoBase64; // El backend debería devolver la nueva foto
      const updatedData = {
          ...personalInfo, // Mantener los cambios del formulario
          fotoBase64: newFotoBase64 || personalInfo.fotoBase64 // Usar nueva foto si vino, sino la anterior
      };
      setPersonalInfo(updatedData);
      setOriginalPersonalInfo(updatedData); // Actualizar el original con los datos guardados
      
      if (newFotoBase64) {
        setPreviewUrl(`data:image/jpeg;base64,${newFotoBase64}`);
        if (typeof updateUserProfilePhotoInContext === 'function') {
            updateUserProfilePhotoInContext(newFotoBase64); // Actualizar foto en AuthContext
        }
      } else if (selectedFile) {
          // Si se subió un archivo pero el backend no devolvió la foto, recargar perfil para obtenerla
          setTimeout(fetchProfile, 700); 
      }
      
      setSelectedFile(null); 
      if (fileInputRef.current) fileInputRef.current.value = null;
      setIsEditing(false); 
    } catch (err) {
      console.error('Error updating personal info:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Sesión expirada o no autorizada.');
        if(typeof logout === 'function') logout();
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } else {
        setError(err.response?.data?.message || 'Error al actualizar la información.');
      }
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePasswordInfoChange = (e) => {
     setPasswordChange({ ...passwordChange, [e.target.name]: e.target.value });
     setSuccessPassword(null); setError(null);
   };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordChange.new_password !== passwordChange.confirm_password) {
        setError('La nueva contraseña y la confirmación no coinciden.'); setSuccessPassword(null); return;
    }
    if (!passwordChange.current_password || !passwordChange.new_password || !passwordChange.confirm_password) {
        setError('Por favor, completa todos los campos de contraseña.'); setSuccessPassword(null); return;
    }
    if (passwordChange.new_password.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres.'); setSuccessPassword(null); return;
    }
    setSavingPassword(true); setError(null); setSuccessPassword(null);
    
    const headers = getAuthHeaders();
    if (!headers.Authorization) { setError("No autenticado."); setSavingPassword(false); return; }

    try {
        const response = await axios.post(`${API_BASE_URL}/usuarios/cambiar-password`, {
          currentPassword: passwordChange.current_password,
          newPassword: passwordChange.new_password,
        }, { headers });
        setSuccessPassword(response.data.message || 'Contraseña actualizada con éxito.');
        setPasswordChange({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) { /* ... (manejo de error sin cambios significativos, pero asegurar limpieza de setError) ... */ } finally { setSavingPassword(false); }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 200px)' }}>
        <CSpinner color="primary" /> <span className="ms-2">Cargando perfil...</span>
      </div>
    );
  }
  
  // Si hay error y no se está editando (para no ocultar errores de validación del form)
  if (error && !savingInfo && !savingPassword && !isEditing) {
    return (
        <div className="p-4">
            <CAlert color="danger" className="text-center">
                <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error al Cargar Perfil</h4>
                <p>{error}</p>
                <hr />
                <CButton color="primary" onClick={fetchProfile} disabled={loading}>
                  {loading ? <CSpinner size="sm" /> : "Reintentar Carga"}
                </CButton>
                 <CButton color="secondary" onClick={() => { logout(); navigate('/login');}} className="ms-2">
                   Ir a Login
                 </CButton>
            </CAlert>
        </div>
    );
  }

  return (
    <CCard className="m-4 shadow-sm">
      <CCardHeader className="p-0 border-bottom-0">
        <CNav variant="tabs" role="tablist" className="p-0 px-3 bg-body-tertiary rounded-top">
          <CNavItem role="presentation">
            <CNavLink href="#" active={activeTab === 'personal'} onClick={(e) => { e.preventDefault(); setActiveTab('personal'); setError(null); setSuccessInfo(null); setSuccessPassword(null);}} role="tab">
              <CIcon icon={cilUser} className="me-2" /> Información personal
            </CNavLink>
          </CNavItem>
          <CNavItem role="presentation">
            <CNavLink href="#" active={activeTab === 'password'} onClick={(e) => { e.preventDefault(); setActiveTab('password'); setError(null); setSuccessInfo(null); setSuccessPassword(null);}} role="tab">
              <CIcon icon={cilLockLocked} className="me-2" /> Cambio de contraseña
            </CNavLink>
          </CNavItem>
        </CNav>
      </CCardHeader>
      <CCardBody className="p-4">
        {/* Alerta para errores de validación o guardado, si se está editando o se intentó guardar */}
        {error && (savingInfo || savingPassword || isEditing) && (
            <CAlert color="danger" className="d-flex align-items-center mb-4" dismissible onClose={() => setError(null)}>
                <CIcon icon={cilWarning} className="flex-shrink-0 me-2" width={24} height={24} />
                <div>{error}</div>
            </CAlert>
         )}

        <CTabContent>
          <CTabPane role="tabpanel" visible={activeTab === 'personal'}>
            <CForm onSubmit={handleUpdatePersonalInfo}>
                <CRow className="g-3">
                <CCol md={3} className="text-center align-self-start pt-md-4">
                    <div className="mb-3 position-relative d-inline-block">
                        <CAvatar 
                            src={previewUrl || "https://via.placeholder.com/150?text=Sin+Foto"}
                            size="xl" 
                            status={personalInfo.fotoBase64 || selectedFile ? "success" : undefined}
                            style={{width: '150px', height: '150px', objectFit: 'cover', border: '2px solid #ccc', padding: '2px', cursor: isEditing ? 'pointer' : 'default'}}
                            onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
                            title={isEditing ? "Haz clic para cambiar la foto" : "Foto de perfil"}
                        />
                        {isEditing && (
                            <CButton 
                                color="light" shape="circle" className="position-absolute border shadow-sm"
                                style={{bottom: '5px', right: '5px', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                onClick={() => fileInputRef.current?.click()}
                                title="Cambiar foto"
                            > <CIcon icon={cilCamera} size="sm"/> </CButton>
                        )}
                        <CFormInput type="file" id="fotoFile" hidden ref={fileInputRef} accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} disabled={!isEditing} />
                    </div>
                     <div className="fw-semibold mt-2 mb-1">{`${personalInfo.nombres} ${personalInfo.apellido_paterno} ${personalInfo.apellido_materno}`.trim() || authUser?.nombreCompleto || 'Usuario'}</div>
                     {authUser && <div className="small text-body-secondary">ID: {authUser.id}</div>}
                </CCol>
                
                <CCol md={9}>
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                        <h5 className="mb-0">Información Personal</h5>
                        <CButton 
                            color={isEditing ? "secondary" : "primary"} 
                            variant={isEditing ? "outline" : undefined}
                            onClick={handleToggleEdit}
                            size="sm"
                        >
                            <CIcon icon={isEditing ? cilX : cilPencil} className="me-1"/>
                            {isEditing ? "Cancelar" : "Editar Perfil"}
                        </CButton>
                    </div>
                    <CRow className="g-3">
                        <CCol md={6}>
                            <CFormLabel htmlFor="rol_nombre">Rol</CFormLabel>
                            <CFormInput type="text" id="rol_nombre" name="rol_nombre" value={personalInfo.rol_nombre} readOnly disabled />
                        </CCol>
                        <CCol md={6}>
                            <CFormLabel htmlFor="dni">DNI *</CFormLabel>
                            <CFormInput type="text" id="dni" name="dni" value={personalInfo.dni} onChange={handlePersonalInfoChange} required maxLength="15" disabled={!isEditing} />
                        </CCol>
                        <CCol md={6}><CFormLabel htmlFor="nombres">Nombres *</CFormLabel><CFormInput type="text" id="nombres" name="nombres" value={personalInfo.nombres} onChange={handlePersonalInfoChange} required disabled={!isEditing} /></CCol>
                        <CCol md={6}><CFormLabel htmlFor="apellido_paterno">Apellido paterno *</CFormLabel><CFormInput type="text" id="apellido_paterno" name="apellido_paterno" value={personalInfo.apellido_paterno} onChange={handlePersonalInfoChange} required disabled={!isEditing} /></CCol>
                        <CCol md={12}><CFormLabel htmlFor="apellido_materno">Apellido materno *</CFormLabel><CFormInput type="text" id="apellido_materno" name="apellido_materno" value={personalInfo.apellido_materno} onChange={handlePersonalInfoChange} required disabled={!isEditing} /></CCol>
                        <CCol md={6}><CFormLabel htmlFor="correo">Correo personal (Login) *</CFormLabel><CFormInput type="email" id="correo" name="correo" value={personalInfo.correo} readOnly disabled title="El correo de inicio de sesión no se puede modificar."/></CCol>
                        <CCol md={6}><CFormLabel htmlFor="correo_recuperacion">Correo de recuperación</CFormLabel><CFormInput type="email" id="correo_recuperacion" name="correo_recuperacion" value={personalInfo.correo_recuperacion} onChange={handlePersonalInfoChange} disabled={!isEditing} /></CCol>
                        <CCol md={6}><CFormLabel htmlFor="fecha_nacimiento">Fecha de nacimiento *</CFormLabel><CFormInput type="date" id="fecha_nacimiento" name="fecha_nacimiento" value={personalInfo.fecha_nacimiento} onChange={handlePersonalInfoChange} required disabled={!isEditing} /></CCol>
                        <CCol md={6}><CFormLabel htmlFor="genero">Género *</CFormLabel><CFormSelect id="genero" name="genero" value={personalInfo.genero} onChange={handlePersonalInfoChange} required disabled={!isEditing}>
                            {generoOptions.map(option => (<option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>))}
                        </CFormSelect></CCol>
                        <CCol md={6}><CFormLabel htmlFor="telefono_celular">Teléfono celular *</CFormLabel><CFormInput type="tel" id="telefono_celular" name="telefono_celular" value={personalInfo.telefono_celular} onChange={handlePersonalInfoChange} required disabled={!isEditing} /></CCol>
                        <CCol md={6}><CFormLabel htmlFor="tipo_telefono">Tipo de Teléfono</CFormLabel><CFormSelect id="tipo_telefono" name="tipo_telefono" value={personalInfo.tipo_telefono} onChange={handlePersonalInfoChange} disabled={!isEditing} >
                            {telefonoTipoOptions.map(option => (<option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>))}
                        </CFormSelect></CCol>
                        <CCol md={6}><CFormLabel htmlFor="distrito">Distrito</CFormLabel><CFormSelect id="distrito" name="distrito" value={personalInfo.distrito} onChange={handlePersonalInfoChange} disabled={!isEditing}>
                             {distritoOptions.map(option => (<option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>))}
                        </CFormSelect></CCol>
                        <CCol md={6}><CFormLabel htmlFor="direccion">Dirección *</CFormLabel><CFormInput type="text" id="direccion" name="direccion" value={personalInfo.direccion} onChange={handlePersonalInfoChange} required disabled={!isEditing} /></CCol>
                    </CRow>
                    {isEditing && (
                        <div className="d-flex justify-content-end align-items-center mt-4">
                            {successInfo && <CBadge color="success" className="me-3 p-2">{successInfo}</CBadge>}
                            <CButton type="submit" color="primary" disabled={savingInfo}>
                                {savingInfo ? <CSpinner size="sm" className="me-2"/> : <CIcon icon={cilSave} className="me-2"/>}
                                Guardar Cambios
                            </CButton>
                        </div>
                    )}
                </CCol>
                </CRow>
            </CForm>
          </CTabPane>

          <CTabPane role="tabpanel" visible={activeTab === 'password'}>
            {/* ... (Contenido de la pestaña de cambio de contraseña sin cambios) ... */}
             <h5 className="mb-4 border-bottom pb-2">Cambio de Contraseña</h5>
               <CForm onSubmit={handleUpdatePassword}>
                <CRow className="g-3 justify-content-center">
                    <CCol md={8} lg={6}>
                        <CFormLabel htmlFor="current_password">Contraseña actual *</CFormLabel>
                        <CFormInput 
                            type="password" id="current_password" name="current_password" 
                            value={passwordChange.current_password} onChange={handlePasswordInfoChange} required className="mb-3"
                        />
                        <CFormLabel htmlFor="new_password">Nueva contraseña *</CFormLabel>
                        <CFormInput 
                            type="password" id="new_password" name="new_password" 
                            value={passwordChange.new_password} onChange={handlePasswordInfoChange} required className="mb-3"
                        />
                        <CFormLabel htmlFor="confirm_password">Confirmar contraseña *</CFormLabel>
                        <CFormInput 
                            type="password" id="confirm_password" name="confirm_password" 
                            value={passwordChange.confirm_password} onChange={handlePasswordInfoChange} required className="mb-3"
                        />
                    </CCol>
                </CRow>
                <div className="d-flex justify-content-end align-items-center mt-3 me-lg-5 pe-lg-3">
                    {successPassword && <CBadge color="success" className="me-3 p-2">{successPassword}</CBadge>}
                    <CButton type="submit" color="primary" disabled={savingPassword}>
                        {savingPassword ? <CSpinner size="sm" className="me-2"/> : <CIcon icon={cilShieldAlt} className="me-2"/>}
                        Actualizar Contraseña
                    </CButton>
                </div>
               </CForm>
          </CTabPane>
        </CTabContent>
      </CCardBody>
    </CCard>
  );
};

export default Perfil;