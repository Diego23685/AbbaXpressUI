import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Search, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { proformaService } from '../services/proformaService';
import api from '../services/api';

export default function RecepcionTransferencias() {
  const { usuario } = useAuth();
  const [cargasEnTransito, setCargasEnTransito] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarTransito();
  }, []);

  const cargarTransito = async () => {
    setCargando(true);
    try {
      const data = await proformaService.obtenerTodas({ estado: 'EN_TRANSITO', busqueda });
      setCargasEnTransito(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmarRecepcion = async () => {
    if (seleccionados.length === 0) return;
    setProcesando(true);
    try {
      await api.put('/proformas/recibir-lote', seleccionados);
      alert('¡Cargas recibidas e ingresadas a la bodega local con éxito!');
      setSeleccionados([]);
      cargarTransito();
    } catch (e) {
      alert('Error al confirmar recepción.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-500" />
            Monitoreo y Recepción de Carga en Tránsito
          </h1>
          <p className="text-xs text-slate-500">
            Control de paquetes despachados entre Managua y León pendientes de arribo
          </p>
        </div>

        {usuario?.sucursalId === 3 && (
          <button
            disabled={seleccionados.length === 0 || procesando}
            onClick={handleConfirmarRecepcion}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Entrada a Bodega León ({seleccionados.length})</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {usuario?.sucursalId === 3 && <th className="p-3 text-center">Sel.</th>}
              <th className="p-3">Proforma</th>
              <th className="p-3">Ruta</th>
              <th className="p-3">Cliente</th>
              <th className="p-3 text-center">Cant. Bultos</th>
              <th className="p-3 text-center">Peso</th>
              <th className="p-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan={7} className="p-6 text-center text-slate-400">Cargando transferencias...</td></tr>
            ) : cargasEnTransito.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-slate-400">No hay cargas en tránsito actualmente.</td></tr>
            ) : (
              cargasEnTransito.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  {usuario?.sucursalId === 3 && (
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={seleccionados.includes(p.id)}
                        onChange={() => toggleSeleccion(p.id)}
                        className="rounded text-brand cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="p-3 font-mono font-bold text-brand">{p.numeroProforma}</td>
                  <td className="p-3 font-semibold text-slate-700 flex items-center gap-1.5">
                    <span>{p.sucursalOrigen || 'Managua'}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-amber-600">{p.sucursalDestino || 'León'}</span>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{p.clienteNombre}</td>
                  <td className="p-3 text-center font-bold">{p.paquetes?.length || 0}</td>
                  <td className="p-3 text-center font-display font-bold">{p.totalLbs?.toFixed(2)} lbs</td>
                  <td className="p-3 text-center">
                    <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      🚚 En Ruta
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}