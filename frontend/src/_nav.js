// src/_nav.js
import React from 'react';
import CIcon from '@coreui/icons-react';
import {
  cilSpeedometer,
  cilPeople,
  cilCalendarCheck,
  cilStorage,
  cilBed,
  cilGroup,
  cilCreditCard,
  cilChatBubble,
  cilUser,
  cilNotes,
  cilChartLine // Icono para "Atenciones Clínicas", puedes cambiarlo si prefieres otro.
           // Otros iconos relevantes podrían ser: cilStethoscope, cilClipboard, cilMedicalCross
} from '@coreui/icons';
import { CNavItem, CNavTitle } from '@coreui/react';

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'GESTIÓN CLÍNICA', // Título de sección agrupador
  },
  {
    component: CNavItem,
    name: 'Pacientes',
    to: '/pacientes',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Citas',
    to: '/citas',
    icon: <CIcon icon={cilCalendarCheck} customClassName="nav-icon" />,
  },

  // FIN DEL NUEVO ITEM
  {
    component: CNavTitle,
    name: 'RECURSOS',
  },
  {
    component: CNavItem,
    name: 'Inventario',
    to: '/inventario',
    icon: <CIcon icon={cilStorage} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Habitaciones',
    to: '/habitaciones',
    icon: <CIcon icon={cilBed} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'ADMINISTRACIÓN',
  },
  {
    component: CNavItem,
    name: 'Personal',
    to: '/personal',
    icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Facturación', // Corregido
    to: '/facturacion',
    icon: <CIcon icon={cilCreditCard} customClassName="nav-icon" />,
  },
  
   {
    component: CNavItem,
    name: 'Mi Perfil',
    to: '/perfil',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'HERRAMIENTAS',
  },
  {
    component: CNavItem,
    name: 'Asistente Virtual',
    to: '/asistente-virtual',
    icon: <CIcon icon={cilChatBubble} customClassName="nav-icon" />,
  },
    { // Nuevo item para predicción
    component: CNavItem,
    name: 'Predicción Reingreso',
    to: '/prediccion',
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
  },
  // --- Consideración Futura para Predicciones ---
  // {
  //   component: CNavTitle,
  //   name: 'ANÁLISIS Y PREDICCIÓN',
  // },
  // {
  //   component: CNavItem,
  //   name: 'Riesgo de Pacientes', // o 'Panel de Predicciones'
  //   to: '/predicciones/panel', // Ejemplo de ruta
  //   icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />, // Usar un icono como cilChartLine
  // },
];

export default _nav;