import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  PlusCircle, 
  Building, 
  Zap, 
  Droplet, 
  Users, 
  FileText,
  PieChart,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
  Calendar,
  DollarSign,
  X,
  Sparkles
} from 'lucide-react';
import { finanzasService } from '../services/finanzasService';
import api from '../services/api';

export default function GastosOperativos() {
  const [gastos, setGastos] = useState([]);
  const [balance, setBalance] = useState({
    ingresosTotalesUSD: 0,
    costosProveedorUSD: 0,
    utilidadBrutaUSD: 0,
    gastosOperativosTotalesUSD: 0,
    utilidadNetaUSD: 0,
    utilidadNetaNIO: 0,
    desgloseGastosUSD: {}
  });

  const [tipoCambioOficial, setTipoCambioOficial] = useState(36.6243);
  const [cargando, setCargando] = useState(true);
  const [modalNuevoGasto, setModalNuevoGasto] = useState(false);

  // Control de visibilidad para filtros avanzados
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  // Estados para Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Paginación (10 items por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const REGISTROS_POR_PAGINA = 10;

  // Formulario nuevo gasto
  const [categoria, setCategoria] = useState('RENTA');
  const [descripcion, setDescripcion] = useState('');
  const [montoUSD, setMontoUSD] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO_USD');
  const [comprobante, setComprobante] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listaGastos, datosBalance, configRes] = await Promise.all([
        finanzasService.obtenerGastos(),
        finanzasService.obtenerBalanceUtilidades(),
        api.get('/configuracion')
      ]);
      setGastos(listaGastos || []);
      setBalance(datosBalance || {
        ingresosTotalesUSD: 0,
        costosProveedorUSD: 0,
        utilidadBrutaUSD: 0,
        gastosOperativosTotalesUSD: 0,
        utilidadNetaUSD: 0,
        utilidadNetaNIO: 0,
        desgloseGastosUSD: {}
      });
      if (configRes.data?.tipoCambioNIO) {
        setTipoCambioOficial(configRes.data.tipoCambioNIO);
      }
    } catch (error) {
      console.error('Error al cargar finanzas:', error);
    } finally {
      setTimeout(() => setCargando(false), 120);
    }
  };

  const categoriasUnicas = useMemo(() => {
    const cats = gastos.map(g => g.categoria?.toUpperCase().trim()).filter(Boolean);
    return [...new Set(cats)];
  }, [gastos]);

  const sucursalesUnicas = useMemo(() => {
    const nombres = gastos.map(g => g.sucursalNombre).filter(Boolean);
    return [...new Set(nombres)];
  }, [gastos]);

  const contadorFiltrosActivos = useMemo(() => {
    let count = 0;
    if (filtroCategoria) count++;
    if (filtroSucursal) count++;
    if (filtroMetodo) count++;
    if (fechaInicio) count++;
    if (fechaFin) count++;
    return count;
  }, [filtroCategoria, filtroSucursal, filtroMetodo, fechaInicio, fechaFin]);

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const coincideBusqueda = 
        g.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        g.numeroComprobante?.toLowerCase().includes(busqueda.toLowerCase());

      const catGasto = g.categoria?.toUpperCase().trim();
      const coincideCategoria = filtroCategoria === '' || catGasto === filtroCategoria.toUpperCase().trim();
      const coincideSucursal = filtroSucursal === '' || g.sucursalNombre === filtroSucursal;
      const coincideMetodo = filtroMetodo === '' || g.metodoPago === filtroMetodo;

      const fechaGasto = new Date(g.fechaGasto);
      const coincideFechaInicio = !fechaInicio || fechaGasto >= new Date(fechaInicio);
      const coincideFechaFin = !fechaFin || fechaGasto <= new Date(`${fechaFin}T23:59:59`);

      return coincideBusqueda && coincideCategoria && coincideSucursal && coincideMetodo && coincideFechaInicio && coincideFechaFin;
    });
  }, [gastos, busqueda, filtroCategoria, filtroSucursal, filtroMetodo, fechaInicio, fechaFin]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroCategoria, filtroSucursal, filtroMetodo, fechaInicio, fechaFin]);

  const totalPaginas = Math.ceil(gastosFiltrados.length / REGISTROS_POR_PAGINA) || 1;
  const gastosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    return gastosFiltrados.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [gastosFiltrados, paginaActual]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setFiltroSucursal('');
    setFiltroMetodo('');
    setFechaInicio('');
    setFechaFin('');
  };

  const handleCrearGasto = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await finanzasService.registrarGasto({
        categoria,
        descripcion,
        montoUSD: parseFloat(montoUSD) || 0,
        tipoCambio: tipoCambioOficial,
        metodoPago,
        numeroComprobante: comprobante
      });
      setModalNuevoGasto(false);
      setDescripcion('');
      setMontoUSD('');
      setComprobante('');
      cargarDatos();
    } catch (error) {
      alert('Error al registrar gasto');
    } finally {
      setGuardando(false);
    }
  };

  const getIconoCategoria = (cat) => {
    switch (cat?.toUpperCase()) {
      case 'RENTA':
      case 'ALQUILER': return <Building className="w-4 h-4 text-indigo-500" />;
      case 'ENERGIA': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'AGUA': return <Droplet className="w-4 h-4 text-sky-500" />;
      case 'NOMINA': return <Users className="w-4 h-4 text-emerald-500" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl flex items-center justify-center transition-transform hover:scale-105 duration-200">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900">
              Control de Gastos y Utilidades Netas
            </h1>
            <p className="text-xs text-slate-500">
              Rentabilidad real deduciendo fletes mayoristas (AereoMar) y gastos operativos
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalNuevoGasto(true)}
          className="px-4 py-2.5 bg-brand hover:bg-brand-600 active:scale-95 text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Gasto Operativo</span>
        </button>
      </div>

      {/* Tarjetas de Rentabilidad Real con Hover-Lift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">1. Venta Total Facturada</span>
          <p className="text-2xl font-black font-display text-slate-900">
            ${balance.ingresosTotalesUSD.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
          </p>
          <p className="text-[10px] text-slate-500">Ingresos brutos cobrados</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">2. Costo Proveedor (AereoMar)</span>
          <p className="text-2xl font-black font-display text-red-600">
            -${balance.costosProveedorUSD.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
          </p>
          <p className="text-[10px] text-slate-500">Flete y despacho primario</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">3. Gastos Operativos</span>
          <p className="text-2xl font-black font-display text-amber-600">
            -${balance.gastosOperativosTotalesUSD.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
          </p>
          <p className="text-[10px] text-slate-500">Renta, nómina, luz y agua</p>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">4. UTILIDAD NETA REAL</span>
          <p className="text-2xl font-black font-display text-emerald-400">
            ${balance.utilidadNetaUSD.toFixed(2)} <span className="text-xs font-normal text-slate-300">USD</span>
          </p>
          <p className="text-[10px] text-brand-300 font-display">
            C$ {balance.utilidadNetaNIO.toFixed(2)} NIO
          </p>
        </div>
      </div>

      {/* Panel de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por concepto o comprobante..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
              className={`px-3 py-2 rounded-xl font-semibold border flex items-center gap-2 transition-all active:scale-95 cursor-pointer text-xs ${
                mostrarFiltrosAvanzados || contadorFiltrosActivos > 0
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros Avanzados</span>
              {contadorFiltrosActivos > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-brand text-white text-[10px] rounded-full font-bold">
                  {contadorFiltrosActivos}
                </span>
              )}
              {mostrarFiltrosAvanzados ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {(busqueda || contadorFiltrosActivos > 0) && (
              <button
                onClick={limpiarFiltros}
                className="p-2 text-slate-500 hover:text-brand active:scale-95 bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
                title="Limpiar todos los filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Acordeón de Filtros con Animación */}
        {mostrarFiltrosAvanzados && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Categoría</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand font-medium text-xs cursor-pointer"
              >
                <option value="">Todas las Categorías</option>
                {categoriasUnicas.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sucursal</label>
              <select
                value={filtroSucursal}
                onChange={(e) => setFiltroSucursal(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand font-medium text-xs cursor-pointer"
              >
                <option value="">Todas las Sucursales</option>
                {sucursalesUnicas.map((suc) => (
                  <option key={suc} value={suc}>{suc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Método de Pago</label>
              <select
                value={filtroMetodo}
                onChange={(e) => setFiltroMetodo(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand font-medium text-xs cursor-pointer"
              >
                <option value="">Todos los Métodos</option>
                <option value="EFECTIVO_USD">Efectivo ($ USD)</option>
                <option value="EFECTIVO_NIO">Efectivo (C$ NIO)</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>

            <div className="lg:col-span-2 min-w-0">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Rango de Fechas
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand min-w-0"
                />
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand min-w-0"
                />
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Historial de Gastos con Skeleton Loader */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand" />
            Bitácora de Gastos ({gastosFiltrados.length} registros)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-right">Monto ($ USD / C$ NIO)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 rounded w-48"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-3.5 bg-slate-200 rounded w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : gastosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No se encontraron gastos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                gastosPaginados.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(g.fechaGasto).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        {getIconoCategoria(g.categoria)}
                        <span>{g.categoria}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {g.descripcion}
                      {g.numeroComprobante && (
                        <span className="text-[10px] text-slate-400 ml-2 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          Doc: {g.numeroComprobante}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {g.sucursalNombre || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {g.metodoPago}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold font-display text-slate-900">
                        ${g.montoUSD.toFixed(2)} USD
                      </div>
                      <div className="text-[10px] text-slate-400 font-display">
                        C$ {(g.montoNIO || (g.montoUSD * tipoCambioOficial)).toFixed(2)} NIO
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!cargando && gastosFiltrados.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500">
            <span>
              Mostrando {((paginaActual - 1) * REGISTROS_POR_PAGINA) + 1} - {Math.min(paginaActual * REGISTROS_POR_PAGINA, gastosFiltrados.length)} de {gastosFiltrados.length} gastos
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 font-semibold text-slate-700">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nuevo Gasto con Animación */}
      {modalNuevoGasto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-sans animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-brand" />
                Nuevo Gasto Operativo
              </h2>
              <button 
                onClick={() => setModalNuevoGasto(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearGasto} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Categoría del Gasto</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition cursor-pointer"
                >
                  <option value="RENTA">🏠 Renta de Local</option>
                  <option value="ENERGIA">⚡ Energía Eléctrica</option>
                  <option value="AGUA">💧 Agua Potable</option>
                  <option value="NOMINA">👥 Nómina / Salarios</option>
                  <option value="PAPELERIA">📄 Papelería</option>
                  <option value="MANTENIMIENTO">🛠️ Mantenimiento</option>
                  <option value="SERVICIOS">🌐 Servicios</option>
                  <option value="PUBLICIDAD">📢 Publicidad</option>
                  <option value="TRANSPORTE">🚚 Transporte</option>
                  <option value="OTROS">🛠️ Otros Gastos Operativos</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Descripción / Concepto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pago de mensualidad de local Bolonia"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Monto ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={montoUSD}
                    onChange={(e) => setMontoUSD(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold font-display text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Método de Pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition cursor-pointer"
                  >
                    <option value="EFECTIVO_USD">Efectivo ($ USD)</option>
                    <option value="EFECTIVO_NIO">Efectivo (C$ NIO)</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="TARJETA">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">N° de Factura / Recibo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. FAC-00982"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNuevoGasto(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-1/2 py-3 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl transition shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}