import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Building2, 
  User, 
  Edit2, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Tv,
  Smartphone
} from 'lucide-react';
import { clienteService } from '../services/clienteService';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function GestionClientes() {
  const { usuario } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEdicion, setClienteEdicion] = useState(null);

  // Estados Historial 360°
  const [modalHistorial, setModalHistorial] = useState(null);
  const [datos360, setDatos360] = useState(null);
  const [cargando360, setCargando360] = useState(false);

  const esLeon = usuario?.sucursalId === 3;

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const REGISTROS_POR_PAGINA = 10;

  // Formulario
  const [nombre, setNombre] = useState('');
  const [codigoPais, setCodigoPais] = useState('+505');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tarifaAereo, setTarifaAereo] = useState(7.00);
  const [tarifaMaritimo, setTarifaMaritimo] = useState(4.00);
  const [tarifaCelularFija, setTarifaCelularFija] = useState(35.00);
  const [tarifaTvAereo, setTarifaTvAereo] = useState(7.50);
  const [tarifaTvMaritimo, setTarifaTvMaritimo] = useState(3.50);
  const [direccion, setDireccion] = useState('');
  const [tipoCliente, setTipoCliente] = useState('CLIENTE_GENERAL');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setCargando(true);
    try {
      const data = await clienteService.obtenerTodos({ 
        busqueda: busqueda.trim() || undefined 
      });
      setClientes(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarClientes();
  };

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      if (!filtroTipo) return true;
      return c.tipoCliente === filtroTipo;
    });
  }, [clientes, filtroTipo]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroTipo]);

  const totalPaginas = Math.ceil(clientesFiltrados.length / REGISTROS_POR_PAGINA) || 1;
  const clientesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    return clientesFiltrados.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [clientesFiltrados, paginaActual]);

  const abrirModalNuevo = () => {
    setClienteEdicion(null);
    setNombre('');
    setCodigoPais('+505');
    setTelefono('');
    setEmail('');
    setTarifaAereo(7.00);
    setTarifaMaritimo(4.00);
    setTarifaCelularFija(35.00);
    setTarifaTvAereo(7.50);
    setTarifaTvMaritimo(3.50);
    setDireccion('');
    setTipoCliente('CLIENTE_GENERAL');
    setModalAbierto(true);
  };

  const abrirModalEditar = (c) => {
    setClienteEdicion(c);
    setNombre(c.nombre);
    setCodigoPais(c.codigoPais || '+505');
    setTelefono(c.telefono);
    setEmail(c.email || '');
    setTarifaAereo(c.tarifaAereo);
    setTarifaMaritimo(c.tarifaMaritimo);
    setTarifaCelularFija(c.tarifaCelularFija ?? 35.00);
    setTarifaTvAereo(c.tarifaTvAereo ?? 7.50);
    setTarifaTvMaritimo(c.tarifaTvMaritimo ?? 3.50);
    setDireccion(c.direccion || '');
    setTipoCliente(c.tipoCliente || 'CLIENTE_GENERAL');
    setModalAbierto(true);
  };

  const abrirHistorial360 = async (c) => {
    setModalHistorial(c);
    setCargando360(true);
    try {
      const res = await api.get(`/clientes/${c.id}/historial-360`);
      setDatos360(res.data);
    } catch (e) {
      alert('Error al consultar historial del cliente');
      setModalHistorial(null);
    } finally {
      setCargando360(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const payload = {
      nombre,
      codigoPais,
      telefono,
      email,
      tarifaAereo: parseFloat(tarifaAereo) || 0,
      tarifaMaritimo: parseFloat(tarifaMaritimo) || 0,
      tarifaCelularFija: parseFloat(tarifaCelularFija) || 0,
      tarifaTvAereo: parseFloat(tarifaTvAereo) || 0,
      tarifaTvMaritimo: parseFloat(tarifaTvMaritimo) || 0,
      direccion,
      tipoCliente
    };

    try {
      if (clienteEdicion) {
        await clienteService.actualizar(clienteEdicion.id, payload);
      } else {
        await clienteService.crear(payload);
      }
      setModalAbierto(false);
      cargarClientes();
    } catch (error) {
      alert('Error al guardar cliente');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas desactivar este cliente?')) return;
    try {
      await clienteService.eliminar(id);
      cargarClientes();
    } catch (error) {
      alert('Error al eliminar cliente');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand" />
            Directorio de Clientes ({esLeon ? 'Sucursal León' : 'Sede Managua'})
          </h1>
          <p className="text-xs text-slate-500">
            Control de tarifas generales, especiales (TV, Celulares) y consulta de historial 360°
          </p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="px-4 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <form onSubmit={handleBuscar} className="w-full sm:w-80 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-brand font-medium"
          />
        </form>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-transparent font-medium text-slate-700 focus:outline-none text-xs cursor-pointer w-full sm:w-auto"
          >
            <option value="">Todos los Tipos</option>
            <option value="CLIENTE_GENERAL">Cliente General</option>
            <option value="CLIENTE_MAYORISTA">Cliente Mayorista</option>
            {!esLeon && <option value="SUBAGENCIA">Subagencia (León)</option>}
          </select>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Nombre / Contacto</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-center">Tarifa Aérea</th>
                <th className="py-3 px-4 text-center">Tarifa Marítima</th>
                <th className="py-3 px-4">Dirección</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    Cargando directorio de clientes...
                  </td>
                </tr>
              ) : clientesPaginados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                clientesPaginados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        {c.tipoCliente === 'SUBAGENCIA' ? (
                          <Building2 className="w-4 h-4 text-brand shrink-0" />
                        ) : (
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span>{c.nombre}</span>
                      </div>
                      {c.email && <div className="text-[10px] text-slate-400 font-normal">{c.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {c.codigoPais} {c.telefono}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.tipoCliente === 'SUBAGENCIA' 
                          ? 'bg-purple-100 text-purple-800' 
                          : c.tipoCliente === 'CLIENTE_MAYORISTA'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {c.tipoCliente === 'SUBAGENCIA' ? 'Subagencia' : c.tipoCliente === 'CLIENTE_MAYORISTA' ? 'Mayorista' : 'Cliente General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-display font-bold text-slate-800">
                      ${c.tarifaAereo.toFixed(2)}/lb
                    </td>
                    <td className="py-3.5 px-4 text-center font-display font-bold text-slate-800">
                      ${c.tarifaMaritimo.toFixed(2)}/lb
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {c.direccion || 'Sin dirección registrada'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => abrirHistorial360(c)}
                          className="p-1.5 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Historial 360° del Cliente"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirModalEditar(c)}
                          className="p-1.5 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(c.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Desactivar cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!cargando && clientesFiltrados.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500 text-xs">
            <span>
              Mostrando {((paginaActual - 1) * REGISTROS_POR_PAGINA) + 1} - {Math.min(paginaActual * REGISTROS_POR_PAGINA, clientesFiltrados.length)} de {clientesFiltrados.length} clientes
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 font-semibold text-slate-700">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Cliente */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand" />
              {clienteEdicion ? 'Editar Ficha de Cliente' : 'Nuevo Registro de Cliente'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nombre Completo / Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María López"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-brand font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Prefijo</label>
                  <select
                    value={codigoPais}
                    onChange={(e) => setCodigoPais(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold cursor-pointer"
                  >
                    <option value="+505">+505 (NI)</option>
                    <option value="+1">+1 (USA)</option>
                    <option value="+506">+506 (CR)</option>
                    <option value="+504">+504 (HN)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Teléfono Móvil (WhatsApp)</label>
                  <input
                    type="text"
                    required
                    placeholder="8888-8888"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tipo de Cliente</label>
                <select
                  value={tipoCliente}
                  onChange={(e) => setTipoCliente(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="CLIENTE_GENERAL">Cliente General</option>
                  <option value="CLIENTE_MAYORISTA">Cliente Mayorista</option>
                  {!esLeon && <option value="SUBAGENCIA">Subagencia (León)</option>}
                </select>
              </div>

              {/* Tarifas Base por Libra */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tarifa Aéreo ($/lb)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tarifaAereo}
                    onChange={(e) => setTarifaAereo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold font-display"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tarifa Marítimo ($/lb)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tarifaMaritimo}
                    onChange={(e) => setTarifaMaritimo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold font-display"
                  />
                </div>
              </div>

              {/* Costos Fijos Especiales Acordados */}
              <div className="space-y-2 bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
                <span className="font-bold text-amber-900 text-[10px] uppercase block">
                  Tarifas Fijas Especiales por Ítem (Opcional)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 font-semibold mb-1 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-purple-600" /> Celular ($)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={tarifaCelularFija}
                      onChange={(e) => setTarifaCelularFija(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 font-semibold mb-1 flex items-center gap-1">
                      <Tv className="w-3 h-3 text-amber-600" /> TV Aéreo ($/lb)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={tarifaTvAereo}
                      onChange={(e) => setTarifaTvAereo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 font-semibold mb-1 flex items-center gap-1">
                      <Tv className="w-3 h-3 text-cyan-600" /> TV Mar. ($/lb)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={tarifaTvMaritimo}
                      onChange={(e) => setTarifaTvMaritimo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dirección de Entrega</label>
                <input
                  type="text"
                  placeholder="Dirección o punto de referencia"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-1/2 py-3 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial 360° del Cliente */}
      {modalHistorial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Historial 360° de Envíos</h2>
                <p className="text-[11px] text-brand font-bold">{modalHistorial.nombre} ({modalHistorial.telefono})</p>
              </div>
              <button 
                onClick={() => setModalHistorial(null)} 
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {cargando360 ? (
              <div className="py-10 text-center text-slate-400">Consultando métricas históricas...</div>
            ) : datos360 ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">Total Facturado</span>
                    <p className="text-xl font-black text-emerald-700">${datos360.metricas?.totalFacturadoUSD?.toFixed(2)} USD</p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-amber-800">Saldo Pendiente</span>
                    <p className="text-xl font-black text-amber-700">${datos360.metricas?.saldoPendienteUSD?.toFixed(2)} USD</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-600">Libras Movidas</span>
                    <p className="text-xl font-black text-slate-800">{datos360.metricas?.totalLibrasMovidas?.toFixed(2)} lbs</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-600">Envíos Totales</span>
                    <p className="text-xl font-black text-slate-800">{datos360.metricas?.frecuenciaEnvios}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-700 text-[10px] uppercase">Últimas Proformas Registradas:</span>
                  <div className="max-h-48 overflow-y-auto space-y-1 divide-y border rounded-xl p-2 bg-slate-50/50">
                    {datos360.ultimasProformas?.length === 0 ? (
                      <p className="py-4 text-center text-slate-400">Sin proformas registradas.</p>
                    ) : (
                      datos360.ultimasProformas?.map(p => (
                        <div key={p.id} className="flex justify-between py-1.5 text-[11px] items-center">
                          <span className="font-mono font-bold text-brand">{p.numeroProforma}</span>
                          <span>{p.totalLbs?.toFixed(2)} lb</span>
                          <span className="font-bold">${p.totalCobradoUSD?.toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            p.estado === 'FACTURADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.estado}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}