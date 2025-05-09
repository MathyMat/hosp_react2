// src/components/AppSidebar.js
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react';
import CIcon from '@coreui/icons-react'; // 1. Importa CIcon (si no estaba ya)
import { cilHospital } from '@coreui/icons'; // 2. Importa el icono de hospital
import { AppSidebarNav } from './AppSidebarNav';
import navigation from '../_nav'; // Asegúrate que la ruta sea correcta

const AppSidebar = () => {
  const dispatch = useDispatch();
  const unfoldable = useSelector((state) => state.sidebarUnfoldable);
  const sidebarShow = useSelector((state) => state.sidebarShow);

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible });
      }}
    >
      <CSidebarHeader className="border-bottom">
        {/* 3. Modifica CSidebarBrand para incluir el icono */}
        <CSidebarBrand
          to="/"
          className="d-flex align-items-center" // Asegura alineación vertical
          style={{ textDecoration: 'none', color: 'inherit', fontSize: '1.25rem', fontWeight: 'bold' }}
        >
          {/* Icono para la vista completa */}
          <CIcon
            icon={cilHospital}
            customClassName="sidebar-brand-full me-2" // Margen a la derecha
            height={28} // Ajusta el tamaño si es necesario
          />
          <span className="sidebar-brand-full">MediAssist</span>

          {/* Icono para la vista estrecha (opcional, puedes mantener solo icono) */}
          <CIcon
            icon={cilHospital}
            customClassName="sidebar-brand-narrow"
            height={28} // Ajusta el tamaño si es necesario
          />
          {/* <span className="sidebar-brand-narrow">MA</span> */} {/* Puedes comentar o eliminar el texto estrecho si prefieres solo icono */}

        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      <AppSidebarNav items={navigation} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  );
};

export default React.memo(AppSidebar);