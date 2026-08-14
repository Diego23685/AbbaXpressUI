import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  PlusCircle, 
  Building, 
  Zap, 
  Droplet, 
  Users, 
  FileText,
  PieChart
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
      setGastos(listaGastos);
      setBalance(datosBalance);
      if (configRes.data?.tipoCambioNIO) {
        setTipoCambioOficial(configRes.data.tipoCambioNIO);
      }
    } catch (error) {
      console.error('Error al cargar finanzas:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleCrearGasto = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await finanzasService.registrarGasto({
        categoria,
        descripcion,
        montoUSD: parseFloat(montoUSD) || 0,
        tipoCambio: tipoCambioOficial, // ✅ T/C oficial sincronizado
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
    switch (cat) {
      case 'RENTA': return <Building className="w-4 h-4 text-indigo-500" />;
      case 'ENERGIA': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'AGUA': return <Droplet className="w-4 h-4 text-sky-500" />;
      case 'NOMINA': return <Users className="w-4 h-4 text-emerald-500" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand" />
            Control de Gastos y Utilidades Netas
          </h1>
          <p className="text-xs text-slate-500">
            Cálculo de rentabilidad real deduciendo costos de proveedor (AereoMar) y gastos operativos
          </p>
        </div>
        <button
          onClick={() => setModalNuevoGasto(true)}
          className="px-4 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Gasto Operativo</span>
        </button>
      </div>

      {/* Tarjetas de Rentabilidad Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">1. Venta Total Facturada</span>
          <p className="text-2xl font-black font-display text-slate-900">
            ${balance.ingresosTotalesUSD.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
          </p>
          <p className="text-[10px] text-slate-500">Ingresos brutos cobrados</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">2. Costo Proveedor (AereoMar)</span>
          <p className="text-2xl font-black font-display text-red-600">
            -${balance.costosProveedorUSD.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
          </p>
          <p className="text-[10px] text-slate-500">Flete y despacho primario</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">3. Gastos Operativos</span>
          <p className="text-2xl font-black font-display text-amber-600">
            -${balance.gastosOperativosTotalesUSD.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
          </p>
          <p className="text-[10px] text-slate-500">Renta, nómina, luz y agua</p>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-2">
          <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">4. UTILIDAD NETA REAL</span>
          <p className="text-2xl font-black font-display text-emerald-400">
            ${balance.utilidadNetaUSD.toFixed(2)} <span className="text-xs font-normal text-slate-300">USD</span>
          </p>
          <p className="text-[10px] text-brand-300 font-display">
            C$ {balance.utilidadNetaNIO.toFixed(2)} NIO
          </p>
        </div>

      </div>

      {/* Historial de Gastos Registrados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand" />
            Bitácora de Gastos por Sucursal
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
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Cargando gastos...
                  </td>
                </tr>
              ) : gastos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    No hay gastos operativos registrados aún.
                  </td>
                </tr>
              ) : (
                gastos.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition">
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
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">
                          (Doc: {g.numeroComprobante})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {g.sucursalNombre}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {g.metodoPago}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold font-display text-slate-900">
                        ${g.montoUSD.toFixed(2)} USD
                      </div>
                      <div className="text-[10px] text-slate-400 font-display">
                        C$ {g.montoNIO.toFixed(2)} NIO
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Gasto */}
      {modalNuevoGasto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-sans">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-brand" />
              Nuevo Gasto Operativo
            </h2>

            <form onSubmit={handleCrearGasto} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Categoría del Gasto</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-brand"
                >
                  <option value="RENTA">🏠 Renta de Local</option>
                  <option value="ENERGIA">⚡ Energía Eléctrica</option>
                  <option value="AGUA">💧 Agua Potable</option>
                  <option value="NOMINA">👥 Nómina / Salarios</option>
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
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-brand"
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
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Método de Pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-brand"
                  >
                    <option value="EFECTIVO_USD">Efectivo ($ USD)</option>
                    <option value="EFECTIVO_NIO">Efectivo (C$ NIO)</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
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
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNuevoGasto(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-1/2 py-3 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50"
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