// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios'; // Necesario para cargar el perfil

const API_USUARIOS_URL = 'http://localhost:3001/api/usuarios'; // Ajusta si es necesario

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(null); // Datos del token decodificado
  const [perfilCompleto, setPerfilCompleto] = useState(null); // Para foto y otros detalles
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const fetchUserProfileForContext = async (currentToken, decodedUserFromToken) => {
    if (!currentToken) return null;
    try {
      console.log("AuthContext: Intentando cargar perfil completo para el header...");
      const response = await axios.get(`${API_USUARIOS_URL}/perfil`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      console.log("AuthContext: Perfil completo cargado:", response.data);
      return response.data; // Esto incluirá fotoBase64 y otros detalles
    } catch (error) {
      console.error("AuthContext: Error al cargar perfil completo para header:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Si falla por autenticación, podría ser un token inválido, desloguear.
        logout(); // Llama a la función de logout para limpiar todo
      }
      return null; // O retornar solo los datos del token si falla el perfil
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoadingAuth(true);
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const decodedToken = jwtDecode(storedToken);
          const currentTime = Date.now() / 1000;
          if (decodedToken.exp < currentTime) {
            logout(); // Llama a la función de logout si está expirado
          } else {
            setToken(storedToken);
            setUsuario(decodedToken); // Guardar el payload del token
            setIsAuthenticated(true);
            // Cargar el perfil completo para obtener la fotoBase64 y otros detalles
            const perfil = await fetchUserProfileForContext(storedToken, decodedToken);
            setPerfilCompleto(perfil);
          }
        } catch (error) {
          console.error("AuthContext: Error inicializando auth, limpiando.", error);
          logout();
        }
      } else {
        setIsAuthenticated(false);
        setUsuario(null);
        setToken(null);
        setPerfilCompleto(null);
      }
      setLoadingAuth(false);
    };
    initializeAuth();
  }, []); // Sin dependencias para que corra solo al montar

  const login = async (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    try {
      const decodedToken = jwtDecode(newToken);
      setUsuario(decodedToken);
      setIsAuthenticated(true);
      // Después del login, cargar el perfil completo
      const perfil = await fetchUserProfileForContext(newToken, decodedToken);
      setPerfilCompleto(perfil);
    } catch (error) {
      console.error("Error decodificando token en login:", error);
      logout();
    }
  };

  const logout = () => {
    console.log("AuthContext: Ejecutando logout...");
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
    setPerfilCompleto(null);
    setIsAuthenticated(false);
  };

  // Función para actualizar la foto en el contexto (llamada desde Perfil.jsx después de subir una nueva)
  const updateUserProfilePhoto = (newFotoBase64) => {
    setPerfilCompleto(prev => prev ? {...prev, fotoBase64: newFotoBase64} : { fotoBase64: newFotoBase64 });
  };


  return (
    <AuthContext.Provider value={{ token, usuario, perfilCompleto, isAuthenticated, login, logout, loadingAuth, updateUserProfilePhoto }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};