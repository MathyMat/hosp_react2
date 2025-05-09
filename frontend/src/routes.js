import React from 'react';

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard.jsx'));
const Calendario = React.lazy(() => import('./views/Calendario/Calendario'));
const Estadisticas = React.lazy(() => import('./views/Estadisticas/Estadisticas'));

const Pacientes = React.lazy(() => import('./views/Pacientes/Pacientes.jsx'));
const Citas = React.lazy(() => import('./views/Citas/Citas.jsx'));

const Inventario = React.lazy(() => import('./views/Inventario/Inventario.jsx'));
const Habitaciones = React.lazy(() => import('./views/Habitaciones/Habitaciones.jsx'));

const Personal = React.lazy(() => import('./views/Personal/Personal.jsx'));
const Facturacion = React.lazy(() => import('./views/Facturacion/Facturacion.jsx'));

const AsistenteVirtual = React.lazy(() => import('./views/AsistenteVirtual/AsistenteVirtual.jsx'));
// ASUMIENDO QUE Perfil.js está en src/views/Cuentas/Perfil.js
const Perfil = React.lazy(() => import('./views/Perfil/Perfil.jsx')); // <--- MODIFICACIÓN AQUÍ


const routes = [
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/calendario', name: 'Calendario', element: Calendario },
  { path: '/estadisticas', name: 'Estadisticas', element: Estadisticas },
  { path: '/pacientes', name: 'Pacientes', element: Pacientes },
  { path: '/citas', name: 'Citas', element: Citas },
  { path: '/inventario', name: 'Inventario', element: Inventario },
  { path: '/habitaciones', name: 'Habitaciones', element: Habitaciones },
  { path: '/personal', name: 'Personal', element: Personal },
  { path: '/facturacion', name: 'Facturacion', element: Facturacion },
  { path: '/asistente-virtual', name: 'Asistente Virtual', element: AsistenteVirtual },
  { path: '/perfil', name: 'Mi Perfil', element: Perfil },

  { path: '/', exact: true, name: 'Home' },
];

export default routes;