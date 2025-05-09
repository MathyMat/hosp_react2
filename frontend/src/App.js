// src/App.js
import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
// useSelector y useColorModes no se usarán directamente para auth, pero los dejamos si los usas para el tema.
import { useSelector } from 'react-redux' 
import { CSpinner, useColorModes } from '@coreui/react'

import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './scss/style.scss'
// import './scss/examples.scss' // Descomenta si tienes este archivo y lo usas

// Importa AuthProvider y useAuth
import { AuthProvider, useAuth } from './context/authContext.js' // Ajusta la ruta si es diferente

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
// Asegúrate que la ruta a tu componente de Login sea correcta
const Login = React.lazy(() => import('./views/Cuentas/Iniciar Sesion/Iniciar Sesion.jsx')) 
// const Page404 = React.lazy(() => import('./views/pages/page404/Page404')) // Descomenta si tienes estas páginas
// const Page500 = React.lazy(() => import('./views/pages/page500/Page500')) // Descomenta si tienes estas páginas


// Componente ProtectedRoute modificado para usar el AuthContext
const ProtectedRoute = ({ children, rolesPermitidos }) => { // Añadido rolesPermitidos
  const { isAuthenticated, usuario, loadingAuth } = useAuth();

  if (loadingAuth) {
    // Muestra un spinner mientras se verifica el estado de autenticación inicial
    return (
      <div className="pt-3 text-center d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
        <CSpinner color="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: No autenticado, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  // Verificación de roles (opcional, como lo teníamos antes)
  if (rolesPermitidos && rolesPermitidos.length > 0 && (!usuario || !rolesPermitidos.includes(usuario.rol))) {
    console.warn(`ProtectedRoute: Acceso denegado para rol: ${usuario?.rol}. Roles permitidos: ${rolesPermitidos}. Redirigiendo a /dashboard.`);
    return <Navigate to="/dashboard" replace />; // O a una página '/unauthorized'
  }
  
  return children; // Si está autenticado (y tiene el rol si se especifica), renderiza el children
};

// Componente para manejar la redirección inicial
const InitialRedirect = () => {
    const { isAuthenticated, loadingAuth } = useAuth();

    if (loadingAuth) {
        return (
            <div className="pt-3 text-center d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
                <CSpinner color="primary" />
            </div>
        );
    }
    // Si está autenticado y en la ruta raíz, redirigir a dashboard
    // Si no está autenticado y en la ruta raíz, redirigir a login
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}


const AppContent = () => {
  // Lógica del tema (la mantenemos como la tenías)
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme) // Asumiendo que tienes Redux para 'theme'

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) return
    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Suspense
      fallback={
        <div className="pt-3 text-center d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
          <CSpinner color="primary" variant="grow" />
          <p className="mt-3">Cargando aplicación...</p> {/* Mensaje más descriptivo */}
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* <Route exact path="/404" name="Page 404" element={<Page404 />} /> */}
        {/* <Route exact path="/500" name="Page 500" element={<Page500 />} /> */}

        {/* Ruta raíz: decide si mostrar login o dashboard basado en autenticación */}
        <Route path="/" element={<InitialRedirect />} />

        {/* Rutas Protegidas */}
        {/* DefaultLayout y todo lo que cuelgue de él estará protegido */}
        <Route
          path="/*" // Captura /dashboard, /perfil, etc.
          element={
            <ProtectedRoute>
              <DefaultLayout />
            </ProtectedRoute>
          }
        />
        {/* Si quieres que una ruta específica como /admin solo sea para rol 1: */}
        {/* <Route
          path="/admin/*"
          element={
            <ProtectedRoute rolesPermitidos={[1]}> 
              <AdminLayout /> // Un layout diferente para admin si es necesario
            </ProtectedRoute>
          }
        /> */}
      </Routes>
    </Suspense>
  )
}


const App = () => {
  return (
    <HashRouter>
      <AuthProvider> {/* AuthProvider envuelve el contenido que necesita acceso al contexto de autenticación */}
        <AppContent /> {/* AppContent ahora contiene la lógica del tema y las rutas */}
      </AuthProvider>
    </HashRouter>
  )
}

export default App