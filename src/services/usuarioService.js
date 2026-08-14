import api from './api';

export const usuarioService = {
  obtenerTodos: async () => {
    const res = await api.get('/usuarios');
    return res.data;
  },
  obtenerSucursales: async () => {
    const res = await api.get('/sucursales');
    return res.data;
  },
  crear: async (datos) => {
    const res = await api.post('/usuarios', datos);
    return res.data;
  },
  actualizar: async (id, datos) => {
    const res = await api.put(`/usuarios/${id}`, datos);
    return res.data;
  },
  toggleEstado: async (id) => {
    const res = await api.put(`/usuarios/${id}/toggle-estado`);
    return res.data;
  }
};