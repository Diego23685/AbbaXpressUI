import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  PlusCircle, 
  Edit2, 
  Power, 
  MapPin, 
  Phone, 
  Search, 
  X, 
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { sucursalService } from '../services/sucursalService';

export default function GestionSucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [sucursalEdicion, setSucursalEdicion] = useState(null);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoSucursal, setTipoSucursal] = useState('FRANQUICIA_B2B');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarSucursales();
  }, []);

  const cargarSucursales = async () => {
    setCargando(true);
    try {
      const data = await sucursalService.obtenerTodas(true);
      setSucursales(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setSucursalEdicion(null);
    setNombre('');
    setCiudad('');
    setDireccion('');
    setTelefono('');
    setTipoSucursal('FRANQUICIA_B2B');
    setModalAbierto(true);
  };

  const abrirModalEditar = (s) => {
    setSucursalEdicion(s);
    setNombre(s.nombre);
    setCiudad(s.ciudad);
    setDireccion(s.direccion || '');
    setTelefono(s.telefono || '');
    setTipoSucursal(s.tipoSucursal);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    const payload = {
      nombre: nombre.trim(),
      ciudad: ciudad.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      tipoSucursal
    };

    try {
      if (sucursalEdicion) {
        await sucursalService.actualizar(sucursalEdicion.id, payload);
        setMensaje({ tipo: 'exito', texto: `Sucursal "${nombre}" actualizada exitosamente.` });
      } else {
        await sucursalService.crear(payload);
        setMensaje({ tipo: 'exito', texto: `Sucursal "${nombre}" creada e inicializada exitosamente.` });
      }
      setModalAbierto(false);
      cargarSucursales();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al guardar la sucursal.' });
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (id) => {
    try {
      await sucursalService.toggleEstado(id);
      cargarSucursales();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo cambiar el estado de la sucursal');
    }
  };

  const sucursalesFiltradas = sucursales.filter(s => 
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.ciudad.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900">Gestión de Agencias y Sucursales</h1>
            <p className="text-xs text-slate-500">Administración de sedes propias y subagencias mayoristas B2B</p>
          </div>
        </div>

        <button
          onClick={abrirModalCrear}
          className="px-4 py-2.5 bg-brand hover:bg-brand-600 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Sucursal</span>
        </button>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <div className="w-full sm:w-80 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Buscar por nombre o ciudad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-brand font-medium"
          />
        </div>
      </div>

      {/* Tabla de Sucursales */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="py-3 px-4">Sucursal / Nombre</th>
                <th className="py-3 px-4">Ciudad</th>
                <th className="py-3 px-4">Dirección</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4 text-center">Tipo Operativo</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Cargando sucursales...</td></tr>
              ) : sucursalesFiltradas.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">No se encontraron sucursales.</td></tr>
              ) : (
                sucursalesFiltradas.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <Building className="w-4 h-4 text-brand shrink-0" />
                      <span>{s.nombre}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{s.ciudad}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{s.direccion || 'Sin dirección'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{s.telefono || 'S/N'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.tipoSucursal === 'PROPIA'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {s.tipoSucursal === 'PROPIA' ? 'Matriz / Propia' : 'Subagencia B2B'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.activa ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {s.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => abrirModalEditar(s)}
                          className="p-1.5 text-slate-400 hover:text-brand hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Editar sucursal"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {s.id !== 1 && (
                          <button
                            onClick={() => handleToggleEstado(s.id)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              s.activa ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={s.activa ? 'Desactivar sucursal' : 'Activar sucursal'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-sans">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand" />
                {sucursalEdicion ? 'Editar Sucursal' : 'Nueva Sucursal / Subagencia'}
              </h2>
              <button 
                onClick={() => setModalAbierto(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre de la Sucursal</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sucursal Chinandega - Central"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Ciudad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Chinandega"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+505 8888-8888"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tipo de Operación</label>
                <select
                  value={tipoSucursal}
                  onChange={(e) => setTipoSucursal(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="FRANQUICIA_B2B">Franquicia / Subagencia B2B (Independiente)</option>
                  <option value="PROPIA">Sede Propia / Matriz (Managua)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Las subagencias B2B heredan tarifas base automáticamente y se registran como clientes mayoristas en Managua.
                </p>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dirección Física</label>
                <input
                  type="text"
                  placeholder="Punto de referencia o dirección exacta"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-1/2 py-2.5 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}