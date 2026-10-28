import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Users, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ReportesFinancieros() {
  const { usuario } = useAuth();
  const [reporte, setReporte] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [sucursalFiltro, setSucursalFiltro] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [paginaClientes, setPaginaClientes] = useState(1);
  const [paginaSucursales, setPaginaSucursales] = useState(1);
  const REGISTROS_POR_PAGINA = 10;

  const esSuperAdmin = usuario?.rol === 'SUPER_ADMIN';
  const esPropia = usuario?.tipoSucursal === 'PROPIA';

  useEffect(() => {
    cargarSucursales();
  }, []);

  useEffect(() => {
    cargarReporte();
  }, [sucursalFiltro, fechaInicio, fechaFin]);

  useEffect(() => {
    setPaginaClientes(1);
    setPaginaSucursales(1);
  }, [sucursalFiltro, fechaInicio, fechaFin]);

  const cargarSucursales = async () => {
    try {
      const res = await api.get('/sucursales');
      setSucursales(res.data || []);
    } catch (e) {
      console.error('Error al cargar sucursales:', e);
    }
  };

  const cargarReporte = async () => {
    setCargando(true);
    try {
      let url = '/reportes/general?';
      if (sucursalFiltro) url += `sucursalId=${sucursalFiltro}&`;
      if (fechaInicio) url += `fechaInicio=${fechaInicio}&`;
      if (fechaFin) url += `fechaFin=${fechaFin}&`;

      const response = await api.get(url);
      setReporte(response.data);
    } catch (error) {
      console.error('Error al cargar reporte financiero:', error);
    } finally {
      setCargando(false);
    }
  };

  const rf = reporte?.resumenFinanciero || {
    ventasTotalesUSD: 0,
    ventasTotalesNIO: 0,
    costosProveedorUSD: 0,
    utilidadBrutaUSD: 0,
    gastosOperativosUSD: 0,
    utilidadNetaUSD: 0,
    utilidadNetaNIO: 0,
    margenPeridaGanancia: 'GANANCIA'
  };

  const listaClientes = reporte?.ventasPorCliente || [];
  const totalPaginasClientes = Math.ceil(listaClientes.length / REGISTROS_POR_PAGINA) || 1;
  const clientesPaginados = useMemo(() => {
    const inicio = (paginaClientes - 1) * REGISTROS_POR_PAGINA;
    return listaClientes.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [listaClientes, paginaClientes]);

  const listaSucursales = reporte?.ventasPorSucursal || [];
  const totalPaginasSucursales = Math.ceil(listaSucursales.length / REGISTROS_POR_PAGINA) || 1;
  const sucursalesPaginadas = useMemo(() => {
    const inicio = (paginaSucursales - 1) * REGISTROS_POR_PAGINA;
    return listaSucursales.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [listaSucursales, paginaSucursales]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand" />
            Reportes de Utilidades, Pérdidas y Ventas
          </h1>
          <p className="text-xs text-slate-500">
            {esPropia 
              ? 'Consolidado financiero y análisis de rendimiento de agencias' 
              : `Rendimiento financiero exclusivo: ${usuario?.sucursalNombre || 'Sucursal'}`}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {(esSuperAdmin || esPropia) && (
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Filtrar por Sucursal</label>
            <select
              value={sucursalFiltro}
              onChange={(e) => setSucursalFiltro(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="">🏢 Consolidado Completo (Sedes Propias)</option>
              {sucursales
                .filter(s => esSuperAdmin || s.tipoSucursal === 'PROPIA')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.ciudad}) {s.tipoSucursal === 'FRANQUICIA_B2B' ? '• B2B' : ''}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Fecha Inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Fecha Fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-slate-400 text-xs">Calculando indicadores financieros...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ventas Totales</span>
              <p className="text-2xl font-black font-display text-slate-900">${rf.ventasTotalesUSD.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500 font-mono">C$ {rf.ventasTotalesNIO.toFixed(2)} NIO</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Utilidad Bruta</span>
              <p className="text-2xl font-black font-display text-emerald-600">${rf.utilidadBrutaUSD.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500 font-medium">Menos costos de proveedores</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Gastos Operativos</span>
              <p className="text-2xl font-black font-display text-red-600">${rf.gastosOperativosUSD.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500 font-medium">Registros de caja chica / gastos</p>
            </div>

            <div className={`p-4 rounded-2xl shadow-sm text-white space-y-1 ${rf.utilidadNetaUSD >= 0 ? 'bg-slate-900' : 'bg-red-900'}`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold uppercase tracking-wider text-[10px]">Utilidad Neta Real</span>
                {rf.utilidadNetaUSD >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
              <p className="text-2xl font-black font-display text-white">${rf.utilidadNetaUSD.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 font-mono">C$ {rf.utilidadNetaNIO.toFixed(2)} NIO</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-bold font-display text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand" /> Ventas por Cliente ({listaClientes.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                        <th className="py-2">Cliente</th>
                        <th className="py-2 text-center">Proformas</th>
                        <th className="py-2 text-right">Total USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientesPaginados.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-6 text-slate-400">Sin registros de clientes.</td></tr>
                      ) : (
                        clientesPaginados.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 font-bold text-slate-800">{c.cliente}</td>
                            <td className="py-2.5 text-center font-medium text-slate-600">{c.cantidadProformas}</td>
                            <td className="py-2.5 text-right font-black font-display text-emerald-700">${c.totalUSD.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {listaClientes.length > 0 && (
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-slate-500">
                  <span className="text-[11px]">Pág. {paginaClientes} de {totalPaginasClientes}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPaginaClientes((p) => Math.max(p - 1, 1))}
                      disabled={paginaClientes === 1}
                      className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPaginaClientes((p) => Math.min(p + 1, totalPaginasClientes))}
                      disabled={paginaClientes === totalPaginasClientes}
                      className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-bold font-display text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand" /> Rendimiento por Sucursal ({listaSucursales.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                        <th className="py-2">Sucursal</th>
                        <th className="py-2 text-center">Proformas</th>
                        <th className="py-2 text-right">Total USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sucursalesPaginadas.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-6 text-slate-400">Sin registros de sucursales.</td></tr>
                      ) : (
                        sucursalesPaginadas.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 font-bold text-slate-800">{s.sucursal}</td>
                            <td className="py-2.5 text-center font-medium text-slate-600">{s.cantidadProformas}</td>
                            <td className="py-2.5 text-right font-black font-display text-emerald-700">${s.totalUSD.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {listaSucursales.length > 0 && (
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-slate-500">
                  <span className="text-[11px]">Pág. {paginaSucursales} de {totalPaginasSucursales}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPaginaSucursales((p) => Math.max(p - 1, 1))}
                      disabled={paginaSucursales === 1}
                      className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPaginaSucursales((p) => Math.min(p + 1, totalPaginasSucursales))}
                      disabled={paginaSucursales === totalPaginasSucursales}
                      className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}