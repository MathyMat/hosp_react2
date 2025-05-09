// src/layout/AppHeader.js
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  CContainer, CHeader, CHeaderNav, CHeaderToggler, CNavLink, CNavItem, useColorModes, CButton
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilMenu, cilMoon, cilSun, cilFullscreen, cilFullscreenExit, cilAccountLogout
} from '@coreui/icons';
import { AppHeaderDropdown } from './header/index';
import { useAuth } from '../context/authContext.js'; // Ajusta la ruta

const AppHeader = () => {
  const headerRef = useRef();
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sidebarShow = useSelector((state) => state.sidebarShow);

  // Usar el contexto de autenticación
  const { usuario, perfilCompleto, logout, isAuthenticated } = useAuth();

  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => { /* ... scroll listener sin cambios ... */ }, []);
  useEffect(() => { /* ... fullscreen listener sin cambios ... */ }, []);

  const toggleTheme = () => setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  const toggleFullScreen = () => { /* ... sin cambios ... */ };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Determinar el nombre a mostrar y el DNI
  // Priorizar datos del token (payload), luego del perfil completo si el token es mínimo
  const nombreParaMostrar = perfilCompleto?.nombres && perfilCompleto?.apellido_paterno 
                            ? `${perfilCompleto.nombres} ${perfilCompleto.apellido_paterno} ${perfilCompleto.apellido_materno || ''}`.trim()
                            : usuario?.nombreCompleto || 'Usuario'; // 'nombreCompleto' debe estar en el payload del token
  
  const infoIdentificacion = perfilCompleto?.dni 
                             ? `DNI: ${perfilCompleto.dni}`
                             : usuario?.dni ? `DNI: ${usuario.dni}` : (usuario?.id ? `ID: ${usuario.id}` : 'No identificado');


  // Determinar el src del avatar desde perfilCompleto
  const avatarSrcFromContext = perfilCompleto?.fotoBase64 
                                ? `data:image/jpeg;base64,${perfilCompleto.fotoBase64}` 
                                : undefined; // O un placeholder si prefieres

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderNav className="d-none d-md-flex">
          <CNavLink to="/dashboard" as={NavLink}>Dashboard</CNavLink>
        </CHeaderNav>

        <CHeaderNav className="ms-auto d-flex align-items-center">
          <CNavItem className="py-1">
            <CNavLink as="button" onClick={toggleTheme} title={colorMode === 'dark' ? "Modo Claro" : "Modo Oscuro"}>
              {colorMode === 'dark' ? <CIcon icon={cilSun} size="lg" /> : <CIcon icon={cilMoon} size="lg" />}
            </CNavLink>
          </CNavItem>
          <CNavItem className="py-1">
            <CNavLink as="button" onClick={toggleFullScreen} title={isFullScreen ? "Salir Pantalla Completa" : "Pantalla Completa"}>
              <CIcon icon={isFullScreen ? cilFullscreenExit : cilFullscreen} size="lg" />
            </CNavLink>
          </CNavItem>

          {isAuthenticated && (
            <>
              <li className="nav-item py-1"><div className="vr h-100 mx-2 text-body text-opacity-75"></div></li>
              <CNavItem className="d-flex align-items-center me-3">
                <div className="text-end">
                  <div className="fw-semibold" style={{fontSize: '0.9rem', color: 'var(--cui-header-color, inherit)'}}>{nombreParaMostrar}</div>
                  <div className="small text-body-secondary" style={{fontSize: '0.75rem'}}>{infoIdentificacion}</div>
                </div>
              </CNavItem>
              <AppHeaderDropdown avatarSrc={avatarSrcFromContext} /> 
            </>
          )}
        </CHeaderNav>
      </CContainer>
    </CHeader>
  );
};

export default AppHeader;