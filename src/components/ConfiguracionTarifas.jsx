import React, { useState, useEffect } from 'react';
import { Settings, Save, DollarSign, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ConfiguracionTarifas() {
  const { usuario } = useAuth();
  
  const [config, setConfig] = useState({
    tipoCambioNIO: 36.6243,
    tarifaAereoGeneral: 7.00,
    tarifaMaritimoGeneral: 4.00,
    tarifaCelularFija: 35.00,
    tarifaTvMaritimo: 3.50,
    tarifaTvAereo: 7.50,
    costoProveedorAereo: 3.80,
    costoProveedorMaritimo: 1.50
  });

  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // 1. Cargar sucursales si es Super Admin
  useEffect(() => {
    if (usuario?.rol === 'SUPER_ADMIN') {
      cargarSucursales();
    } else {
      setSucursalSeleccionada(usuario?.sucursalId || '');
    }
  }, [usuario]);

  // 2. Cargar configuración cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (sucursalSeleccionada) {
      cargarConfiguracion(sucursalSeleccionada);
    }
  }, [sucursalSeleccionada]);

  const cargarSucursales = async () => {
    try {
      const res = await api.get('/sucursales');
      setSucursales(res.data);
      if (res.data.length > 0 && !sucursalSeleccionada) {
        // Por defecto selecciona la propia del Super Admin
        setSucursalSeleccionada(usuario?.sucursalId || res.data[0].id);
      }
    } catch (e) {
      console.error('Error cargando sucursales:', e);
    }
  };

  const cargarConfiguracion = async (sucId) => {
    setMensaje(null);
    try {
      const res = await api.get(`/configuracion?sucursalId=${sucId}`);
      if (res.data) {
        setConfig(res.data);
      }
    } catch (e) {
      console.error(e);
      setMensaje({ tipo: 'error', texto: 'Error al cargar las tarifas de la sucursal.' });
    }
  };

  const handleChange = (campo, valor) => {
    setConfig({ ...config, [campo]: parseFloat(valor) || 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await api.put(`/configuracion?sucursalId=${sucursalSeleccionada}`, config);
      setMensaje({ tipo: 'exito', texto: 'Configuración y tarifas actualizadas con éxito.' });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar tarifas. Verifique permisos.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand" />
            Panel de Tarifas y Parámetros
          </h1>
          <p className="text-xs text-slate-500">
            Control de tipo de cambio, tarifas de venta y costos de proveedor (AereoMar)
          </p>
        </div>

        {/* Selector de Sucursal exclusivo para Super Admin */}
        {usuario?.rol === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={sucursalSeleccionada}
              onChange={(e) => setSucursalSeleccionada(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>Configurando: {s.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-xs font-bold ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Tipo de Cambio Oficial */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Tipo de Cambio Oficial (Córdoba / Dólar)
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tasa Oficial (C$ NIO por $1 USD)</label>
            <input
              type="number"
              step="0.0001"
              value={config.tipoCambioNIO}
              onChange={(e) => handleChange('tipoCambioNIO', e.target.value)}
              className="w-full sm:w-64 bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-display font-bold text-slate-900 focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        {/* Tarifas al Cliente Final */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tarifas Predeterminadas de Venta al Cliente
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Aéreo General ($/lb)</label>
              <input
                type="number"
                step="0.1"
                value={config.tarifaAereoGeneral}
                onChange={(e) => handleChange('tarifaAereoGeneral', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold font-display focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Marítimo General ($/lb)</label>
              <input
                type="number"
                step="0.1"
                value={config.tarifaMaritimoGeneral}
                onChange={(e) => handleChange('tarifaMaritimoGeneral', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold font-display focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Celular Tarifa Plana ($/und)</label>
              <input
                type="number"
                step="1"
                value={config.tarifaCelularFija}
                onChange={(e) => handleChange('tarifaCelularFija', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold font-display focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Smart TV Marítimo ($/lb)</label>
              <input
                type="number"
                step="0.1"
                value={config.tarifaTvMaritimo}
                onChange={(e) => handleChange('tarifaTvMaritimo', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold font-display focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Smart TV Aéreo ($/lb)</label>
              <input
                type="number"
                step="0.1"
                value={config.tarifaTvAereo}
                onChange={(e) => handleChange('tarifaTvAereo', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold font-display focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Costos Base de Proveedor (AereoMar) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Costos Base de Flete Proveedor (AereoMar) - Para cálculo de Utilidad Bruta
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Costo Aéreo ($/lb)</label>
              <input
                type="number"
                step="0.1"
                value={config.costoProveedorAereo}
                onChange={(e) => handleChange('costoProveedorAereo', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold font-display text-red-600 focus:border-red-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Costo Marítimo ($/lb)</label>
              <input
                type="number"
                step="0.1"
                value={config.costoProveedorMaritimo}
                onChange={(e) => handleChange('costoProveedorMaritimo', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold font-display text-red-600 focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={guardando || !sucursalSeleccionada}
          className="px-8 py-3.5 bg-brand hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{guardando ? 'Guardando...' : 'Guardar Cambios de Configuración'}</span>
        </button>

      </form>
    </div>
  );
}