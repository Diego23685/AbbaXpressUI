import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Building, 
  User, 
  Clock,
  Activity
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

  const esSuperAdmin = usuario?.rol === 'SUPER_ADMIN';
  const esManagua = usuario?.sucursalId === 1 || usuario?.sucursalId === 2;

  useEffect(() => {
    cargarLogs();
  }, [moduloFiltro, sucursalFiltro]);

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
      setCargando(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarLogs();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand" />
            Bitácora de Auditoría y Movimientos
          </h1>
          <p className="text-xs text-slate-500">
            Registro cronológico y trazabilidad estricta de acciones por usuario y sucursal
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        
        {/* Selector de Sucursal (Seguro según rol) */}
        {(esSuperAdmin || esManagua) && (
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Filtrar por Sucursal</label>
            <div className="relative flex items-center">
              <Building className="w-4 h-4 text-slate-400 absolute left-3" />
              <select
                value={sucursalFiltro}
                onChange={(e) => setSucursalFiltro(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 font-medium text-slate-800 focus:outline-none focus:border-brand"
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

        {/* Módulo */}
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Filtrar por Módulo</label>
          <div className="relative flex items-center">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3" />
            <select
              value={moduloFiltro}
              onChange={(e) => setModuloFiltro(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 font-medium text-slate-800 focus:outline-none focus:border-brand"
            >
              <option value="">Todos los Módulos</option>
              <option value="PROFORMAS">Proformas / Carga</option>
              <option value="GASTOS">Gastos Operativos</option>
              <option value="CLIENTES">Directorio Clientes</option>
              <option value="USUARIOS">Gestión Usuarios</option>
            </select>
          </div>
        </div>

        {/* Buscador */}
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Búsqueda General</label>
          <form onSubmit={handleBuscar} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Buscar por usuario o detalle..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 font-medium text-slate-800 focus:outline-none focus:border-brand"
            />
          </form>
        </div>

      </div>

      {/* Tabla de Logs */}
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
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400">
                    Cargando bitácora de auditoría...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400">
                    No se encontraron registros de auditoría recientes.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.fechaMovimiento).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {log.sucursal}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-1.5 pt-4">
                      <User className="w-3.5 h-3.5 text-brand" />
                      <span>{log.usuario}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.accion === 'CREACION' ? 'bg-emerald-100 text-emerald-800' :
                        log.accion === 'MODIFICACION' ? 'bg-amber-100 text-amber-800' :
                        log.accion === 'ELIMINACION' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.accion} ({log.modulo})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {log.descripcion}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}