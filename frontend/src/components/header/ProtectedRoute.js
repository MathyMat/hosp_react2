// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/authContext.js';
import { CSpinner } from '@coreui/react'; // Para mostrar un spinner mientras carga la auth

const ProtectedRoute = ({ rolesPermitidos }) => {
  const { isAuthenticated, usuario, loadingAuth } = useAuth();

  if (loadingAuth) {
    // Muestra un spinner mientras se verifica el estado de autenticación inicial
    return (
      <div className="pt-3 text-center">
        <CSpinner color="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirigir a login
    // Puedes pasar la ruta actual para redirigir de vuelta después del login:
    // return <Navigate to="/login" state={{ from: location }} replace />;
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles y el usuario no tiene el rol permitido
  if (rolesPermitidos && rolesPermitidos.length > 0 && (!usuario || !rolesPermitidos.includes(usuario.rol))) {
    // Redirigir a una página de no autorizado o al dashboard si se prefiere
    console.warn(`Acceso denegado para rol: ${usuario?.rol}. Roles permitidos: ${rolesPermitidos}`);
    return <Navigate to="/dashboard" replace />; // O a una página '/unauthorized'
  }

  return <Outlet />; // Si está autenticado (y tiene el rol si se especifica), renderiza el contenido de la ruta
};

export default ProtectedRoute;