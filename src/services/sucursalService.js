import api from './api';

export const sucursalService = {
  obtenerTodas: async (incluirInactivas = false) => {
    const res = await api.get(`/sucursales${incluirInactivas ? '?incluirInactivas=true' : ''}`);
    return res.data;
  },

  crear: async (datos) => {
    const res = await api.post('/sucursales', datos);
    return res.data;
  },

  actualizar: async (id, datos) => {
    const res = await api.put(`/sucursales/${id}`, datos);
    return res.data;
  },

  toggleEstado: async (id) => {
    const res = await api.put(`/sucursales/${id}/toggle-estado`);
    return res.data;
  }
};