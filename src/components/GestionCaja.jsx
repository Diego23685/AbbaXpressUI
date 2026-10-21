import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  PlusCircle, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Coins, 
  Lock, 
  Unlock,
  Printer
} from 'lucide-react';
import api from '../services/api';

export default function GestionCaja() {
  const [estadoCaja, setEstadoCaja] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalApertura, setModalApertura] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [modalVale, setModalVale] = useState(false);

  // Denominaciones Nicaragua
  const denominacionesNIO = [1000, 500, 200, 100, 50, 20, 10];
  const denominacionesUSD = [100, 50, 20, 10, 5, 1];

  const [bultosFisicos, setBultosFisicos] = useState(0);
  const [cantidadesNIO, setCantidadesNIO] = useState({});
  const [cantidadesUSD, setCantidadesUSD] = useState({});

  // Formulario Vales
  const [conceptoVale, setConceptoVale] = useState('');
  const [beneficiarioVale, setBeneficiarioVale] = useState('');
  const [montoVale, setMontoVale] = useState('');
  const [monedaVale, setMonedaVale] = useState('NIO');

  useEffect(() => {
    cargarEstadoCaja();
  }, []);

  const cargarEstadoCaja = async () => {
    setCargando(true);
    try {
      const res = await api.get('/caja/estado-actual');
      setEstadoCaja(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const handleCambioDenominacion = (moneda, denom, valor) => {
    const cant = parseInt(valor) || 0;
    if (moneda === 'NIO') {
      setCantidadesNIO(prev => ({ ...prev, [denom]: cant }));
    } else {
      setCantidadesUSD(prev => ({ ...prev, [denom]: cant }));
    }
  };

  const totalArqueoNIO = denominacionesNIO.reduce((acc, d) => acc + (d * (cantidadesNIO[d] || 0)), 0);
  const totalArqueoUSD = denominacionesUSD.reduce((acc, d) => acc + (d * (cantidadesUSD[d] || 0)), 0);

  const handleApertura = async (e) => {
    e.preventDefault();
    const denominacionesPayload = [
      ...denominacionesNIO.map(d => ({ moneda: 'NIO', denominacion: d, cantidad: cantidadesNIO[d] || 0 })),
      ...denominacionesUSD.map(d => ({ moneda: 'USD', denominacion: d, cantidad: cantidadesUSD[d] || 0 }))
    ];

    try {
      await api.post('/caja/apertura', {
        bultosFisicosApertura: parseInt(bultosFisicos) || 0,
        denominaciones: denominacionesPayload
      });
      setModalApertura(false);
      cargarEstadoCaja();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al aperturar caja');
    }
  };

  const handleCierre = async (e) => {
    e.preventDefault();
    const denominacionesPayload = [
      ...denominacionesNIO.map(d => ({ moneda: 'NIO', denominacion: d, cantidad: cantidadesNIO[d] || 0 })),
      ...denominacionesUSD.map(d => ({ moneda: 'USD', denominacion: d, cantidad: cantidadesUSD[d] || 0 }))
    ];

    try {
      await api.post('/caja/cierre', {
        bultosFisicosCierre: parseInt(bultosFisicos) || 0,
        denominaciones: denominacionesPayload
      });
      setModalCierre(false);
      cargarEstadoCaja();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cerrar caja');
    }
  };

  const handleEmitirVale = async (e) => {
    e.preventDefault();
    try {
      await api.post('/caja/vales', {
        concepto: conceptoVale,
        beneficiario: beneficiarioVale,
        monto: parseFloat(montoVale) || 0,
        moneda: monedaVale
      });
      setModalVale(false);
      setConceptoVale('');
      setBeneficiarioVale('');
      setMontoVale('');
      cargarEstadoCaja();
    } catch (err) {
      alert('Error al registrar vale');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900">Control de Caja y Arqueo Físico</h1>
            <p className="text-xs text-slate-500">Gestión de sesiones de cajero, vales de salida y cuadre por denominación</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!estadoCaja?.abierta ? (
            <button
              onClick={() => {
                setCantidadesNIO({});
                setCantidadesUSD({});
                setModalApertura(true);
              }}
              className="px-4 py-2.5 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
            >
              <Unlock className="w-4 h-4" /> Aperturar Caja
            </button>
          ) : (
            <>
              <button
                onClick={() => setModalVale(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4" /> Emitir Vale de Caja
              </button>
              <button
                onClick={() => {
                  setCantidadesNIO({});
                  setCantidadesUSD({});
                  setModalCierre(true);
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
              >
                <Lock className="w-4 h-4" /> Realizar Corte / Cierre
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tarjetas Estado de Caja */}
      {estadoCaja?.abierta ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cajero Responsable</span>
            <p className="text-lg font-bold text-slate-800">{estadoCaja.cajero}</p>
            <p className="text-[10px] text-emerald-600 font-bold">🟢 Sesión Abierta</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Saldo Teórico Córdobas</span>
            <p className="text-2xl font-black font-display text-slate-900">C$ {estadoCaja.saldoActualTeoricoNio?.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400">Apertura: C$ {estadoCaja.montoAperturaCordobas?.toFixed(2)}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Saldo Teórico Dólares</span>
            <p className="text-2xl font-black font-display text-emerald-700">${estadoCaja.saldoActualTeoricoUsd?.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400">Apertura: ${estadoCaja.montoAperturaDolares?.toFixed(2)}</p>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Bultos en Bodega</span>
            <p className="text-2xl font-black font-display text-white">{estadoCaja.bultosFisicosApertura} bultos</p>
            <p className="text-[10px] text-slate-400">Conteo físico verificado</p>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
          <Lock className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-700">No hay sesión de caja abierta en esta sucursal</h3>
          <p className="text-xs text-slate-500">Debe realizar el conteo de billetes y bultos en bodega para habilitar la facturación.</p>
        </div>
      )}

      {/* Modal Apertura / Cierre por Denominaciones */}
      {(modalApertura || modalCierre) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold font-display text-slate-900">
              {modalApertura ? 'Apertura de Caja y Conteo Físico' : 'Cierre de Caja y Arqueo Final'}
            </h2>

            <form onSubmit={modalApertura ? handleApertura : handleCierre} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total de Bultos / Paquetes Físicos en Bodega:</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={bultosFisicos}
                  onChange={(e) => setBultosFisicos(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-sm"
                />
              </div>

              {/* Billetes NIO */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Desglose de Billetes en Córdobas (Total: C$ {totalArqueoNIO.toFixed(2)})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {denominacionesNIO.map(d => (
                    <div key={d} className="p-2 bg-slate-50 border rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 block">C$ {d}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cantidadesNIO[d] || ''}
                        onChange={(e) => handleCambioDenominacion('NIO', d, e.target.value)}
                        className="w-full bg-white border rounded p-1 font-bold text-center mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Billetes USD */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Desglose de Billetes en Dólares (Total: $ {totalArqueoUSD.toFixed(2)})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {denominacionesUSD.map(d => (
                    <div key={d} className="p-2 bg-slate-50 border rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 block">$ {d}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cantidadesUSD[d] || ''}
                        onChange={(e) => handleCambioDenominacion('USD', d, e.target.value)}
                        className="w-full bg-white border rounded p-1 font-bold text-center mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => { setModalApertura(false); setModalCierre(false); }}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg"
                >
                  {modalApertura ? 'Guardar Apertura' : 'Confirmar Cierre de Caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Vale de Caja */}
      {modalVale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold font-display text-slate-900">Emisión de Vale de Salida de Caja</h2>
            
            <form onSubmit={handleEmitirVale} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nombre del Beneficiario / Quien Recibe:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Conductor de delivery / Mensajero"
                  value={beneficiarioVale}
                  onChange={(e) => setBeneficiarioVale(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Concepto o Motivo del Egreso:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pago de combustible para entrega"
                  value={conceptoVale}
                  onChange={(e) => setConceptoVale(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Monto Retirado:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={montoVale}
                    onChange={(e) => setMontoVale(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Moneda:</label>
                  <select
                    value={monedaVale}
                    onChange={(e) => setMonedaVale(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold"
                  >
                    <option value="NIO">Córdobas (C$ NIO)</option>
                    <option value="USD">Dólares ($ USD)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalVale(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg"
                >
                  Imprimir y Guardar Vale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}