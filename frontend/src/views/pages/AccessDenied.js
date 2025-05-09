
import React from 'react';
import { CContainer, CCard, CCardBody, CCardHeader } from '@coreui/react';

const AccessDenied = () => {
  return (
    <CContainer className="py-5">
      <CCard>
        <CCardHeader>
          <h3>Acceso Denegado</h3>
        </CCardHeader>
        <CCardBody>
          <p>No tienes permiso para acceder a esta página.</p>
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default AccessDenied;
