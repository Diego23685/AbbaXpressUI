import api from './api';

export const clienteService = {
  obtenerTodos: async (busqueda = '') => {
    const url = busqueda ? `/clientes?busqueda=${encodeURIComponent(busqueda)}` : '/clientes';
    const response = await api.get(url);
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
    await api.delete(`/clientes/${id}`);
  }
};