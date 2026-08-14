import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('abba_user');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [cargando, setCargando] = useState(false);

  const login = async (username, password) => {
    setCargando(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data;

      localStorage.setItem('abba_token', data.token);
      localStorage.setItem('abba_user', JSON.stringify(data));
      setUsuario(data);
      return { exito: true };
    } catch (error) {
      const mensaje = error.response?.data?.message || 'Error al conectar con el servidor';
      return { exito: false, mensaje };
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('abba_token');
    localStorage.removeItem('abba_user');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando, estaAutenticado: !!usuario }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);