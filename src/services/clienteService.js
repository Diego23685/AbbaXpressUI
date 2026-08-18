import api from './api';

export const clienteService = {
  obtenerTodos: async (params = {}) => {
    // Soporta si se envía un string o un objeto con filtros
    const queryParams = typeof params === 'string' 
      ? { busqueda: params } 
      : params;

    const response = await api.get('/clientes', { params: queryParams });
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  crear: async (datosCliente) => {
    const response = await api.post('/clientes', datosCliente);
    return response.data;
  },

  actualizar: async (id, datosCliente) => {
    const response = await api.put(`/clientes/${id}`, datosCliente);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  }
};