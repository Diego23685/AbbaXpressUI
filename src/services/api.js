import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5271/api', // Ajusta según el puerto de tu API .NET
});

// Interceptor para inyectar el Bearer Token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('abba_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;