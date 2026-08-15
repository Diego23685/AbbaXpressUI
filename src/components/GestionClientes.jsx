import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Building2, 
  User, 
  Edit2, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw
} from 'lucide-react';
import { clienteService } from '../services/clienteService';

export default function GestionClientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEdicion, setClienteEdicion] = useState(null);

  // Estado para la Paginación (10 registros por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const REGISTROS_POR_PAGINA = 10;

  // Formulario
  const [nombre, setNombre] = useState('');
  const [codigoPais, setCodigoPais] = useState('+505');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tarifaAereo, setTarifaAereo] = useState(7.00);
  const [tarifaMaritimo, setTarifaMaritimo] = useState(4.00);
  const [direccion, setDireccion] = useState('');
  const [tipoCliente, setTipoCliente] = useState('CONSUMIDOR_FINAL');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setCargando(true);
    try {
      const data = await clienteService.obtenerTodos(busqueda);
      setClientes(data);
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

  // Lógica de Filtrado Local (Por Tipo de Cliente)
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const coincideTipo = filtroTipo === '' || c.tipoCliente === filtroTipo;
      return coincideTipo;
    });
  }, [clientes, filtroTipo]);

  // Reiniciar a la Página 1 al cambiar de filtro o al realizar búsquedas
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroTipo]);

  // Lógica de Paginación
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
    setDireccion('');
    setTipoCliente('CONSUMIDOR_FINAL');
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
    setDireccion(c.direccion || '');
    setTipoCliente(c.tipoCliente);
    setModalAbierto(true);
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
            Directorio de Clientes
          </h1>
          <p className="text-xs text-slate-500">
            Control de tarifas asignadas, clientes finales y cuentas mayoristas B2B
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

      {/* Buscador y Filtro por Tipo */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <form onSubmit={handleBuscar} className="w-full sm:w-96 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-brand font-medium"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium text-slate-700 focus:outline-none focus:border-brand"
          >
            <option value="">Todos los Tipos</option>
            <option value="CONSUMIDOR_FINAL">👤 Consumidor Final</option>
            <option value="SUCURSAL_B2B">🏢 Mayorista B2B</option>
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
                    Cargando directorio...
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
                        {c.tipoCliente === 'SUCURSAL_B2B' ? (
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
                        c.tipoCliente === 'SUCURSAL_B2B' 
                          ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {c.tipoCliente === 'SUCURSAL_B2B' ? '🏢 Mayorista B2B' : '👤 Consumidor Final'}
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
                          onClick={() => abrirModalEditar(c)}
                          className="p-1.5 text-slate-500 hover:text-brand transition cursor-pointer"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(c.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 transition cursor-pointer"
                          title="Eliminar cliente"
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

        {/* Control de Paginación */}
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
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs font-sans">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand" />
              {clienteEdicion ? 'Editar Cliente' : 'Nuevo Registro de Cliente'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nombre Completo / Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María López / Sucursal León"
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
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold"
                  >
                    <option value="+505">🇳🇮 +505</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+506">🇨🇷 +506</option>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tarifa Aéreo ($/lb)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tarifaAereo}
                    onChange={(e) => setTarifaAereo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold font-display"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tarifa Marítimo ($/lb)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tarifaMaritimo}
                    onChange={(e) => setTarifaMaritimo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold font-display"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tipo de Cliente</label>
                <select
                  value={tipoCliente}
                  onChange={(e) => setTipoCliente(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-800"
                >
                  <option value="CONSUMIDOR_FINAL">👤 Consumidor Final (B2C)</option>
                  <option value="SUCURSAL_B2B">🏢 Franquicia / Mayorista B2B (Ej. León)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Dirección de Entrega</label>
                <input
                  type="text"
                  placeholder="Ciudad, Barrio, Punto de Referencia"
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

    </div>
  );
}