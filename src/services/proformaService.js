import api from './api';

export const proformaService = {
  obtenerTodas: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.sucursalId) params.append('sucursalId', filtros.sucursalId);
    if (filtros.busqueda) params.append('busqueda', filtros.busqueda);

    const response = await api.get(`/proformas?${params.toString()}`);
    return response.data;
  },

  obtenerPlantillaWhatsApp: async (id) => {
    const response = await api.get(`/proformas/${id}/whatsapp-template`);
    return response.data;
  },

  obtenerResumenCobros: async (sucursalId = null) => {
    const url = sucursalId ? `/proformas/resumen-cobros?sucursalId=${sucursalId}` : '/proformas/resumen-cobros';
    const response = await api.get(url);
    return response.data;
  },

  crear: async (datosProforma) => {
    const response = await api.post('/proformas', datosProforma);
    return response.data;
  },

  liquidar: async (id, metodoPago) => {
    const response = await api.put(`/proformas/${id}/liquidar`, JSON.stringify(metodoPago), {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  }
};