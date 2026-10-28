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

  const [sucursalActual, setSucursalActual] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Módulo de Proveedores
  const [proveedores, setProveedores] = useState([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);
  const [modalProveedor, setModalProveedor] = useState(false);
  const [proveedorEdicion, setProveedorEdicion] = useState(null);
  
  const [nombreProv, setNombreProv] = useState('');
  const [contactoProv, setContactoProv] = useState('');
  const [telefonoProv, setTelefonoProv] = useState('');
  const [costoAereoProv, setCostoAereoProv] = useState(3.80);
  const [costoMaritimoProv, setCostoMaritimoProv] = useState(1.50);
  const [guardandoProv, setGuardandoProv] = useState(false);

  const sucursalIdEfectivo = usuario?.sucursalId || 1;

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [sucRes, confRes, provRes] = await Promise.all([
        api.get(`/sucursales/${sucursalIdEfectivo}`),
        api.get(`/configuracion?sucursalId=${sucursalIdEfectivo}`),
        api.get('/proveedores')
      ]);

      setSucursalActual(sucRes.data);
      if (confRes.data) setConfig(confRes.data);
      setProveedores(provRes.data || []);
    } catch (e) {
      console.error(e);
      setMensaje({ tipo: 'error', texto: 'Error al cargar configuración de la sucursal.' });
    } finally {
      setCargando(false);
    }
  };

  const cargarProveedores = async () => {
    setCargandoProveedores(true);
    try {
      const res = await api.get('/proveedores');
      setProveedores(res.data || []);
    } catch (e) {
      console.error(e);
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
      await api.put(`/configuracion?sucursalId=${sucursalIdEfectivo}`, config);
      setMensaje({ tipo: 'exito', texto: 'Configuración y tarifas actualizadas con éxito.' });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.response?.data?.message || 'Error al actualizar tarifas.' });
    } finally {
      setGuardando(false);
    }
  };

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
      costoLibraMaritimo: parseFloat(costoMaritimoProv) || 0
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
  const esFranquicia = sucursalActual?.tipoSucursal === 'FRANQUICIA_B2B';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Header Contextual */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900">
              {esFranquicia 
                ? `Tarifas y Proveedores: ${sucursalActual?.nombre}` 
                : 'Tarifas y Parámetros (Sedes Propias)'}
            </h1>
            <p className="text-xs text-slate-500">
              {esFranquicia
                ? 'Precios al cliente final y proveedores propios administrados de forma autónoma'
                : 'Tarifas maestras aplicables a las sedes de la casa matriz'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
          <Building2 className="w-4 h-4 text-brand shrink-0" />
          <span className="font-bold text-slate-800">
            {esFranquicia ? `Subagencia B2B: ${sucursalActual?.ciudad}` : 'Sede Central'}
          </span>
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Proveedores Propios de la Sede */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand" />
              Proveedores de Flete ({esFranquicia ? sucursalActual?.nombre : 'Red Propia'})
            </h2>
            <p className="text-[11px] text-slate-400">
              Couriers y costos de flete independientes para ingreso de carga en esta bodega
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
          <p className="text-xs text-slate-400 py-4 text-center">No hay proveedores registrados para esta sucursal.</p>
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Tipo de Cambio Oficial (Córdoba / Dólar)
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Oficial Sucursal</span>
          </div>

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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-3 font-display font-black text-slate-900 focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tarifas de Venta al Cliente Final */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              Tarifas de Venta al Cliente Final ({esFranquicia ? sucursalActual?.nombre : 'Sede Propia'})
            </h2>
            <span className="text-[11px] font-semibold text-brand">Precios al Consumidor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-blue-600" />
                <span>Aéreo General ($/lb)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={config.tarifaAereoGeneral}
                onChange={(e) => handleChange('tarifaAereoGeneral', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5 text-cyan-600" />
                <span>Marítimo General ($/lb)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={config.tarifaMaritimoGeneral}
                onChange={(e) => handleChange('tarifaMaritimoGeneral', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>Celular Tarifa Plana ($/und)</span>
              </label>
              <input
                type="number"
                step="1"
                value={config.tarifaCelularFija}
                onChange={(e) => handleChange('tarifaCelularFija', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-amber-600" />
                <span>Smart TV Marítimo ($/lb)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={config.tarifaTvMaritimo}
                onChange={(e) => handleChange('tarifaTvMaritimo', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-amber-600" />
                <span>Smart TV Aéreo ($/lb)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={config.tarifaTvAereo}
                onChange={(e) => handleChange('tarifaTvAereo', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display"
              />
            </div>
          </div>
        </div>

        {/* Costos Base de Flete */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Costo Base de Flete Predeterminado
            </h2>
            <span className="text-[11px] font-semibold text-slate-500">
              {esFranquicia ? 'Costo mayorista matriz' : 'Costo courier origen'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-700">Costo Base Aéreo ($/lb)</label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Margen: +${margenAereoUSD}/lb
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                value={config.costoProveedorAereo}
                onChange={(e) => handleChange('costoProveedorAereo', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-700">Costo Base Marítimo ($/lb)</label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Margen: +${margenMaritimoUSD}/lb
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                value={config.costoProveedorMaritimo}
                onChange={(e) => handleChange('costoProveedorMaritimo', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold font-display"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={guardando || cargando}
          className="px-8 py-3.5 bg-brand hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{guardando ? 'Guardando...' : `Guardar Tarifas de ${esFranquicia ? sucursalActual?.nombre : 'Sedes Propias'}`}</span>
        </button>
      </form>

      {/* Modal Proveedor */}
      {modalProveedor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-sans">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand" />
                {proveedorEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor de Flete'}
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
                <label className="block text-slate-700 font-semibold mb-1">Nombre del Proveedor</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carga Directa Miami / Courier Local"
                  value={nombreProv}
                  onChange={(e) => setNombreProv(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Contacto</label>
                  <div className="relative flex items-center">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                    <input
                      type="text"
                      placeholder="Contacto"
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