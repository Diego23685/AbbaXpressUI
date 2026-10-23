import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  DollarSign, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Plane, 
  Ship, 
  Tv, 
  Smartphone,
  Sparkles,
  Truck,
  PlusCircle,
  Edit2,
  Trash2,
  Phone,
  User,
  X
} from 'lucide-react';
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
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Estados Módulo Proveedores
  const [proveedores, setProveedores] = useState([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);
  const [modalProveedor, setModalProveedor] = useState(false);
  const [proveedorEdicion, setProveedorEdicion] = useState(null);
  
  // Formulario Proveedor
  const [nombreProv, setNombreProv] = useState('');
  const [contactoProv, setContactoProv] = useState('');
  const [telefonoProv, setTelefonoProv] = useState('');
  const [costoAereoProv, setCostoAereoProv] = useState(3.80);
  const [costoMaritimoProv, setCostoMaritimoProv] = useState(1.50);
  const [guardandoProv, setGuardandoProv] = useState(false);

  // 1. Cargar datos iniciales
  useEffect(() => {
    if (usuario?.rol === 'SUPER_ADMIN') {
      cargarSucursales();
    } else {
      setSucursalSeleccionada(usuario?.sucursalId || '');
    }
    cargarProveedores();
  }, [usuario]);

  // 2. Cargar configuración cuando cambia la sucursal
  useEffect(() => {
    if (sucursalSeleccionada) {
      cargarConfiguracion(sucursalSeleccionada);
    }
  }, [sucursalSeleccionada]);

  const cargarSucursales = async () => {
    try {
      const res = await api.get('/sucursales');
      setSucursales(res.data || []);
      if (res.data && res.data.length > 0 && !sucursalSeleccionada) {
        setSucursalSeleccionada(usuario?.sucursalId || res.data[0].id);
      }
    } catch (e) {
      console.error('Error cargando sucursales:', e);
    }
  };

  const cargarConfiguracion = async (sucId) => {
    setCargando(true);
    setMensaje(null);
    try {
      const res = await api.get(`/configuracion?sucursalId=${sucId}`);
      if (res.data) {
        setConfig(res.data);
      }
    } catch (e) {
      console.error(e);
      setMensaje({ tipo: 'error', texto: 'Error al cargar las tarifas de la sucursal.' });
    } finally {
      setTimeout(() => setCargando(false), 120);
    }
  };

  const cargarProveedores = async () => {
    setCargandoProveedores(true);
    try {
      const res = await api.get('/proveedores');
      setProveedores(res.data || []);
    } catch (e) {
      console.error('Error al cargar proveedores:', e);
    } finally {
      setCargandoProveedores(false);
    }
  };

  const handleChange = (campo, valor) => {
    setConfig((prev) => ({ ...prev, [campo]: parseFloat(valor) || 0 }));
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

  // Funciones Proveedores
  const abrirModalNuevoProveedor = () => {
    setProveedorEdicion(null);
    setNombreProv('');
    setContactoProv('');
    setTelefonoProv('');
    setCostoAereoProv(3.80);
    setCostoMaritimoProv(1.50);
    setModalProveedor(true);
  };

  const abrirModalEditarProveedor = (p) => {
    setProveedorEdicion(p);
    setNombreProv(p.nombre);
    setContactoProv(p.contacto || '');
    setTelefonoProv(p.telefono || '');
    setCostoAereoProv(p.costoLibraAereo);
    setCostoMaritimoProv(p.costoLibraMaritimo);
    setModalProveedor(true);
  };

  const handleSubmitProveedor = async (e) => {
    e.preventDefault();
    setGuardandoProv(true);
    const payload = {
      nombre: nombreProv.trim(),
      contacto: contactoProv.trim(),
      telefono: telefonoProv.trim(),
      costoLibraAereo: parseFloat(costoAereoProv) || 0,
      costoLibraMaritimo: parseFloat(costoMaritimoProv) || 0,
      activo: true
    };

    try {
      if (proveedorEdicion) {
        await api.put(`/proveedores/${proveedorEdicion.id}`, payload);
      } else {
        await api.post('/proveedores', payload);
      }
      setModalProveedor(false);
      cargarProveedores();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar el proveedor');
    } finally {
      setGuardandoProv(false);
    }
  };

  const handleEliminarProveedor = async (p) => {
    if (!window.confirm(`¿Seguro que deseas desactivar al proveedor "${p.nombre}"?`)) return;
    try {
      await api.put(`/proveedores/${p.id}`, { ...p, activo: false });
      cargarProveedores();
    } catch (err) {
      alert('Error al desactivar proveedor');
    }
  };

  const margenAereoUSD = (config.tarifaAereoGeneral - config.costoProveedorAereo).toFixed(2);
  const margenMaritimoUSD = (config.tarifaMaritimoGeneral - config.costoProveedorMaritimo).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl flex items-center justify-center transition-transform hover:scale-105 duration-200">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900">
              Panel de Tarifas y Parámetros
            </h1>
            <p className="text-xs text-slate-500">
              Control de tipo de cambio, tarifas de venta, couriers y costos base de flete
            </p>
          </div>
        </div>

        {/* Selector de Sucursal exclusivo para Super Admin */}
        {usuario?.rol === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs transition-all focus-within:ring-2 focus-within:ring-brand/20">
            <Building2 className="w-4 h-4 text-brand shrink-0" />
            <select
              value={sucursalSeleccionada}
              onChange={(e) => setSucursalSeleccionada(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>Configurando: {s.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* SECCIÓN MÓDULO 1.2: GESTIÓN DE PROVEEDORES / COURIERS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand" />
              Gestión de Proveedores de Carga / Couriers
            </h2>
            <p className="text-[11px] text-slate-400">
              Administración de costos diferenciados por proveedor aplicables a cada bulto
            </p>
          </div>
          <button
            type="button"
            onClick={abrirModalNuevoProveedor}
            className="px-3.5 py-2 bg-brand hover:bg-brand-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Proveedor</span>
          </button>
        </div>

        {cargandoProveedores ? (
          <div className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
        ) : proveedores.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No hay proveedores registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                  <th className="p-2.5">Proveedor</th>
                  <th className="p-2.5">Contacto / Tel</th>
                  <th className="p-2.5 text-center">Costo Aéreo ($/lb)</th>
                  <th className="p-2.5 text-center">Costo Marítimo ($/lb)</th>
                  <th className="p-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proveedores.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-2.5 font-bold text-slate-800">{p.nombre}</td>
                    <td className="p-2.5 text-slate-500">{p.contacto || 'N/A'} • {p.telefono || 'S/N'}</td>
                    <td className="p-2.5 text-center font-bold font-display text-slate-900">${p.costoLibraAereo?.toFixed(2)}</td>
                    <td className="p-2.5 text-center font-bold font-display text-slate-900">${p.costoLibraMaritimo?.toFixed(2)}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirModalEditarProveedor(p)}
                          className="p-1.5 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Editar costos"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarProveedor(p)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Desactivar proveedor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Tipo de Cambio Oficial */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 transition-all hover:border-slate-300 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Tipo de Cambio Oficial (Córdoba / Dólar)
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Banco Central / Mercado</span>
          </div>

          {cargando ? (
            <div className="h-10 bg-slate-100 rounded-xl w-64 animate-pulse"></div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tasa Oficial Sincronizada (C$ NIO por $1.00 USD)
              </label>
              <div className="relative flex items-center w-full sm:w-64">
                <span className="absolute left-3.5 font-bold text-slate-400 text-xs">C$</span>
                <input
                  type="number"
                  step="0.0001"
                  value={config.tipoCambioNIO}
                  onChange={(e) => handleChange('tipoCambioNIO', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-3 font-display font-black text-slate-900 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-all duration-150"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tarifas al Consumidor Final */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 transition-all hover:border-slate-300 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              Tarifas Predeterminadas de Venta al Cliente
            </h2>
            <span className="text-[11px] font-semibold text-brand">Precios Base</span>
          </div>
          
          {cargando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              
              <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-blue-600" />
                  <span>Aéreo General ($/lb)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.tarifaAereoGeneral}
                  onChange={(e) => handleChange('tarifaAereoGeneral', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display focus:border-brand focus:outline-none transition-all"
                />
              </div>

              <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Ship className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Marítimo General ($/lb)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.tarifaMaritimoGeneral}
                  onChange={(e) => handleChange('tarifaMaritimoGeneral', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display focus:border-brand focus:outline-none transition-all"
                />
              </div>

              <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                  <span>Celular Tarifa Plana ($/und)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  value={config.tarifaCelularFija}
                  onChange={(e) => handleChange('tarifaCelularFija', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display focus:border-brand focus:outline-none transition-all"
                />
              </div>

              <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-amber-600" />
                  <span>Smart TV Marítimo ($/lb)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.tarifaTvMaritimo}
                  onChange={(e) => handleChange('tarifaTvMaritimo', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display focus:border-brand focus:outline-none transition-all"
                />
              </div>

              <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-amber-600" />
                  <span>Smart TV Aéreo ($/lb)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.tarifaTvAereo}
                  onChange={(e) => handleChange('tarifaTvAereo', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display focus:border-brand focus:outline-none transition-all"
                />
              </div>

            </div>
          )}
        </div>

        {/* Costos Base de Proveedor con Estimación de Margen en Vivo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 transition-all hover:border-slate-300 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Costos Base de Flete Proveedor Predeterminado
            </h2>
            <span className="text-[11px] font-semibold text-slate-500">Cálculo de Utilidad</span>
          </div>
          
          {cargando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
              <div className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700">Costo Flete Aéreo ($/lb)</label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Margen: +${margenAereoUSD}/lb
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={config.costoProveedorAereo}
                  onChange={(e) => handleChange('costoProveedorAereo', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display text-slate-900 focus:border-brand focus:outline-none transition-all"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700">Costo Flete Marítimo ($/lb)</label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Margen: +${margenMaritimoUSD}/lb
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={config.costoProveedorMaritimo}
                  onChange={(e) => handleChange('costoProveedorMaritimo', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display text-slate-900 focus:border-brand focus:outline-none transition-all"
                />
              </div>

            </div>
          )}
        </div>

        {/* Botón de Guardado */}
        <button
          type="submit"
          disabled={guardando || !sucursalSeleccionada || cargando}
          className="px-8 py-3.5 bg-brand hover:bg-brand-600 active:scale-95 text-white font-bold rounded-2xl shadow-lg transition-all duration-150 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{guardando ? 'Guardando cambios...' : 'Guardar Cambios de Configuración'}</span>
        </button>

      </form>

      {/* Modal Crear / Editar Proveedor */}
      {modalProveedor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-sans">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand" />
                {proveedorEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor de Carga'}
              </h2>
              <button 
                type="button"
                onClick={() => setModalProveedor(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProveedor} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre de la Empresa / Courier</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. TransExpress / Carga Express"
                  value={nombreProv}
                  onChange={(e) => setNombreProv(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Contacto</label>
                  <div className="relative flex items-center">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                    <input
                      type="text"
                      placeholder="Ej. Roberto M."
                      value={contactoProv}
                      onChange={(e) => setContactoProv(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-8 pr-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Teléfono</label>
                  <div className="relative flex items-center">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={telefonoProv}
                      onChange={(e) => setTelefonoProv(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-8 pr-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Costo Aéreo ($/lb)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costoAereoProv}
                    onChange={(e) => setCostoAereoProv(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold font-display text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Costo Marítimo ($/lb)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costoMaritimoProv}
                    onChange={(e) => setCostoMaritimoProv(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold font-display text-center"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalProveedor(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProv}
                  className="w-1/2 py-2.5 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg"
                >
                  {guardandoProv ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}