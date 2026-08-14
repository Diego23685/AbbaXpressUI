import api from './api';

export const finanzasService = {
  obtenerGastos: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.sucursalId) params.append('sucursalId', filtros.sucursalId);
    if (filtros.categoria) params.append('categoria', filtros.categoria);

    const response = await api.get(`/finanzas/gastos?${params.toString()}`);
    return response.data;
  },

  registrarGasto: async (datosGasto) => {
    const response = await api.post('/finanzas/gastos', datosGasto);
    return response.data;
  },

  obtenerBalanceUtilidades: async (sucursalId = null) => {
    const url = sucursalId ? `/finanzas/balance-utilidades?sucursalId=${sucursalId}` : '/finanzas/balance-utilidades';
    const response = await api.get(url);
    return response.data;
  }
};