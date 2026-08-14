import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Building2, 
  Users, 
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ReportesFinancieros() {
  const { usuario } = useAuth();
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sucursalFiltro, setSucursalFiltro] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const esSuperAdmin = usuario?.rol === 'SUPER_ADMIN';
  const esLeon = usuario?.sucursalId === 3;
  const esManagua = usuario?.sucursalId === 1 || usuario?.sucursalId === 2;

  useEffect(() => {
    cargarReporte();
  }, [sucursalFiltro, fechaInicio, fechaFin]);

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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand" />
            Reportes de Utilidades, Pérdidas y Ventas
          </h1>
          <p className="text-xs text-slate-500">
            {esLeon 
              ? 'Análisis financiero exclusivo para la sucursal de León'
              : 'Consolidado financiero y análisis de rendimiento por sede (Managua / León)'}
          </p>
        </div>
      </div>

      {/* Filtros de Fecha y Sucursal */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        
        {/* Selector de Sucursal Dinámico y Seguro */}
        {(esSuperAdmin || esManagua) && (
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Filtrar por Sucursal</label>
            <select
              value={sucursalFiltro}
              onChange={(e) => setSucursalFiltro(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-brand"
            >
              {esSuperAdmin && <option value="">🏢 Todas las Sucursales (Consolidado Global)</option>}
              {esManagua && <option value="">🏢 Consolidado Managua (Bolonia + Doral)</option>}
              <option value="1">Bolonia (Managua)</option>
              <option value="2">Doral (Managua)</option>
              {/* Ocultamos totalmente la opción de León para evitar filtros cruzados no autorizados */}
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
          {/* Tarjetas KPI Financieras (Pérdidas y Ganancias) */}
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
                <span className="font-bold uppercase tracking-wider text-[10px]">Utilidad Neta (Neta Final)</span>
                {rf.utilidadNetaUSD >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
              <p className="text-2xl font-black font-display text-white">${rf.utilidadNetaUSD.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 font-mono">C$ {rf.utilidadNetaNIO.toFixed(2)} NIO</p>
            </div>

          </div>

          {/* Tablas de Rendimiento (Ventas por Cliente y por Sucursal) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            
            {/* Ventas por Cliente */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="font-bold font-display text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-brand" /> Ventas por Cliente / Mayorista
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
                    {reporte?.ventasPorCliente?.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-800">{c.cliente}</td>
                        <td className="py-2.5 text-center font-medium text-slate-600">{c.cantidadProformas}</td>
                        <td className="py-2.5 text-right font-black font-display text-emerald-700">${c.totalUSD.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ventas por Sucursal */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="font-bold font-display text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand" /> Rendimiento por Sucursal
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                      <th className="py-2">Sucursal</th>
                      <th className="py-2 text-center">Proformas Facturadas</th>
                      <th className="py-2 text-right">Total USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reporte?.ventasPorSucursal?.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-800">{s.sucursal}</td>
                        <td className="py-2.5 text-center font-medium text-slate-600">{s.cantidadProformas}</td>
                        <td className="py-2.5 text-right font-black font-display text-emerald-700">${s.totalUSD.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}