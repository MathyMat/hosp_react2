
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RolProtegido = ({ children, permitido }) => {
  const navigate = useNavigate();
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || !permitido.includes(usuario.rol)) {
      navigate('/403'); // Página de acceso denegado
    }
  }, [navigate, permitido]);

  return children;
};

export default RolProtegido;
