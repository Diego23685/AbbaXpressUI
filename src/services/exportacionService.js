import api from './api';

export const exportacionService = {
  obtenerTodos: async (busqueda = '') => {
    const url = busqueda ? `/exportacion?busqueda=${encodeURIComponent(busqueda)}` : '/exportacion';
    const response = await api.get(url);
    return response.data;
  },

  crear: async (datosEnvio) => {
    const response = await api.post('/exportacion', datosEnvio);
    return response.data;
  }
};