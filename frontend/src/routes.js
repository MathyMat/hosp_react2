// src/routes.js (o donde tengas este archivo)
import React from 'react';

// Vistas existentes
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
const Perfil = React.lazy(() => import('./views/Perfil/Perfil.jsx'));

const PrediccionReingreso = React.lazy(() => import('./views/Prediccion/PrediccionReingreso.jsx'))

// === IMPORTACIÓN PARA DETALLE DE ATENCIÓN ===
// Asegúrate que la ruta a este archivo sea correcta según tu estructura de proyecto
// Y que el nombre del archivo coincida (DetalleAtencion.jsx o DetalleAtencion.js)
// ==========================================

const routes = [
  // Rutas existentes
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/calendario', name: 'Calendario', element: Calendario },
  { path: '/estadisticas', name: 'Estadísticas', element: Estadisticas },
  { path: '/pacientes', name: 'Pacientes', element: Pacientes },
  { path: '/citas', name: 'Citas', element: Citas },
  { path: '/inventario', name: 'Inventario', element: Inventario },
  { path: '/habitaciones', name: 'Habitaciones', element: Habitaciones },
  { path: '/personal', name: 'Personal', element: Personal },
  { path: '/facturacion', name: 'Facturación', element: Facturacion },
  { path: '/asistente-virtual', name: 'Asistente Virtual', element: AsistenteVirtual },
  { path: '/perfil', name: 'Mi Perfil', element: Perfil },

  { path: '/prediccion', name: 'Predicción de Reingreso', element: PrediccionReingreso }, // Nueva ruta

  // ============================================

  { path: '/', exact: true, name: 'Home' }, // Probablemente redirigido a /dashboard por DefaultLayout
];

export default routes;