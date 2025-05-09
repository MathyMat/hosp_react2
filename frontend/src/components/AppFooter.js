// src/components/AppFooter.js
import React from 'react';
import { CFooter } from '@coreui/react';
import CIcon from '@coreui/icons-react'; // 1. Importa CIcon
import { cilSettings } from '@coreui/icons'; // 2. Importa el icono específico

const AppFooter = () => {
  return (
    // Aplicamos estilos al CFooter directamente o a un div contenedor si prefieres
    <CFooter className="px-4 custom-footer d-flex align-items-center justify-content-center">
      {/* 3. Añade el icono antes del texto */}
      <CIcon
        icon={cilSettings}
        className="me-2" // Añade un pequeño margen a la derecha
        style={{ color: '#69a1f5' }} // Un tono de azul claro que resalte, puedes ajustarlo
      />
      {/* 4. Mantén tu texto */}
      <span>Financiado por SENATI</span>
      {/* El div derecho ya fue eliminado en pasos anteriores */}
    </CFooter>
  );
};

export default React.memo(AppFooter);