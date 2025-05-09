// src/layout/header/AppHeaderDropdown.js (o tu ruta)
import React from 'react';
import {
  CAvatar,
  CDropdown,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react';
import {
  cilAccountLogout,
  cilUser, // Opcional: para un enlace al perfil
  // cilSettings, // Opcional: para un enlace a configuraciones
} from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { useNavigate } from 'react-router-dom'; // <--- IMPORTAR useNavigate
import { useAuth } from '../../context/authContext.js'; // <--- IMPORTAR useAuth (ajusta la ruta si es necesario)

// Importa una imagen por defecto si la necesitas
// import avatarPlaceholder from '../../assets/images/avatars/default_avatar.png'; 

const AppHeaderDropdown = ({ avatarSrc }) => {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth(); // <--- OBTENER logout y usuario DEL CONTEXTO

  const handleLogout = () => {
    console.log('Cerrando sesión...');
    logout(); // Llama a la función logout del AuthContext
    navigate('/login', { replace: true }); // Redirige a la página de login
  };

  const handleProfile = () => {
    navigate('/perfil'); // Asumiendo que tienes una ruta /perfil
  };

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar 
          src={avatarSrc /* || avatarPlaceholder */} // Muestra el avatar pasado o un placeholder
          size="md" 
          status={usuario ? "success" : "secondary"} // El status puede depender si hay usuario
        />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">
          {/* Puedes mostrar el nombre del usuario aquí si lo deseas y está en el contexto */}
          {usuario?.nombre || 'Cuenta'}
        </CDropdownHeader>
        
        {/* Opcional: Enlace al Perfil */}
        <CDropdownItem onClick={handleProfile} style={{ cursor: 'pointer' }}>
          <CIcon icon={cilUser} className="me-2" />
          Perfil
        </CDropdownItem>

        {/* Opcional: Otros items como Configuración */}
        {/* 
        <CDropdownItem href="#">
          <CIcon icon={cilSettings} className="me-2" />
          Configuración
        </CDropdownItem> 
        */}

        {/* <CDropdownDivider /> // Opcional: si tienes más items arriba */}
        
        <CDropdownItem onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <CIcon icon={cilAccountLogout} className="me-2" />
          Cerrar Sesión
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  );
};

export default AppHeaderDropdown;