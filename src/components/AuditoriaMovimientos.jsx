import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Building, 
  User, 
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AuditoriaMovimientos() {
  const { usuario } = useAuth();
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [moduloFiltro, setModuloFiltro] = useState('');
  const [sucursalFiltro, setSucursalFiltro] = useState('');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const REGISTROS_POR_PAGINA = 10;

  const esSuperAdmin = usuario?.rol === 'SUPER_ADMIN';
  const esManagua = usuario?.sucursalId === 1 || usuario?.sucursalId === 2;

  useEffect(() => {
    cargarLogs();
  }, [moduloFiltro, sucursalFiltro]);

  useEffect(() => {
    setPaginaActual(1);
  }, [moduloFiltro, sucursalFiltro, busqueda]);

  const cargarLogs = async () => {
    setCargando(true);
    try {
      let url = '/auditoria?';
      if (sucursalFiltro) url += `sucursalId=${sucursalFiltro}&`;
      if (moduloFiltro) url += `modulo=${moduloFiltro}&`;
      if (busqueda) url += `busqueda=${busqueda}&`;

      const response = await api.get(url);
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error al cargar bitácora de auditoría:', error);
    } finally {
      // Breve debounce visual para suavizar el cambio
      setTimeout(() => setCargando(false), 120);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarLogs();
  };

  const totalPaginas = Math.ceil(logs.length / REGISTROS_POR_PAGINA) || 1;
  const logsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    return logs.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [logs, paginaActual]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Header Interactivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl flex items-center justify-center transition-transform hover:scale-105 duration-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900">
              Bitácora de Auditoría y Movimientos
            </h1>
            <p className="text-xs text-slate-500">
              Registro cronológico y trazabilidad estricta de acciones por usuario y sucursal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Tiempo Real Activo</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        
        {(esSuperAdmin || esManagua) && (
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Filtrar por Sucursal</label>
            <div className="relative flex items-center">
              <Building className="w-4 h-4 text-slate-400 absolute left-3" />
              <select
                value={sucursalFiltro}
                onChange={(e) => setSucursalFiltro(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 font-medium text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-150"
              >
                {esSuperAdmin && <option value="">Todas las Sucursales (Global)</option>}
                {esManagua && <option value="">Consolidado Managua (Bolonia + Doral)</option>}
                <option value="1">Bolonia (Managua)</option>
                <option value="2">Doral (Managua)</option>
                {esSuperAdmin && <option value="3">León</option>}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Filtrar por Módulo</label>
          <div className="relative flex items-center">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3" />
            <select
              value={moduloFiltro}
              onChange={(e) => setModuloFiltro(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 font-medium text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-150"
            >
              <option value="">Todos los Módulos</option>
              <option value="PROFORMAS">Proformas / Carga</option>
              <option value="GASTOS">Gastos Operativos</option>
              <option value="CLIENTES">Directorio Clientes</option>
              <option value="USUARIOS">Gestión Usuarios</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Búsqueda General</label>
          <form onSubmit={handleBuscar} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Buscar por usuario o detalle..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 font-medium text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-150"
            />
          </form>
        </div>

      </div>

      {/* Tabla con Skeleton Loader y Hover Transitions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4">Acción / Módulo</th>
                <th className="py-3 px-4">Descripción del Movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                /* Skeleton Loader Efecto Pulso */
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded-full w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-3/4"></div></td>
                  </tr>
                ))
              ) : logsPaginados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400">
                    No se encontraron registros de auditoría recientes.
                  </td>
                </tr>
              ) : (
                logsPaginados.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50/90 transition-colors duration-150 cursor-default"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.fechaMovimiento).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {log.sucursal}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>{log.usuario}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-transform hover:scale-105 duration-100 ${
                        log.accion === 'CREACION' ? 'bg-emerald-100 text-emerald-800' :
                        log.accion === 'MODIFICACION' ? 'bg-amber-100 text-amber-800' :
                        log.accion === 'ELIMINACION' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.accion} ({log.modulo})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium leading-relaxed">
                      {log.descripcion}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!cargando && logs.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500">
            <span>
              Mostrando {((paginaActual - 1) * REGISTROS_POR_PAGINA) + 1} - {Math.min(paginaActual * REGISTROS_POR_PAGINA, logs.length)} de {logs.length} movimientos
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all duration-150 cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 font-semibold text-slate-700">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all duration-150 cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}