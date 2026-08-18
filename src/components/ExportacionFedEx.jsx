import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Plus, 
  Trash2, 
  Printer, 
  X, 
  PlaneTakeoff, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  Package,
  ExternalLink
} from 'lucide-react';
import { exportacionService } from '../services/exportacionService';

export default function ExportacionFedEx() {
  const [envios, setEnvios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalFactura, setModalFactura] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario de Envío
  const [remitenteNombre, setRemitenteNombre] = useState('');
  const [remitenteTelefono, setRemitenteTelefono] = useState('');
  const [destinatarioNombre, setDestinatarioNombre] = useState('');
  const [destinatarioTelefono, setDestinatarioTelefono] = useState('');
  const [destinatarioEstado, setDestinatarioEstado] = useState('FL');
  const [destinatarioCiudad, setDestinatarioCiudad] = useState('');
  const [destinatarioZip, setDestinatarioZip] = useState('');
  const [destinatarioDireccion, setDestinatarioDireccion] = useState('');
  const [pesoTotalLbs, setPesoTotalLbs] = useState(10);
  const [trackingFedEx, setTrackingFedEx] = useState('');

  // Ítems aduaneros
  const [items, setItems] = useState([
    { descripcionES: 'Queso seco artesanal', descripcionEN: 'Artisanal dry cheese', cantidad: 2, pesoLbs: 5, valorDeclaradoUSD: 25 }
  ]);

  useEffect(() => {
    cargarEnvios();
  }, []);

  const cargarEnvios = async () => {
    setCargando(true);
    try {
      const data = await exportacionService.obtenerTodos();
      setEnvios(data || []);
    } catch (e) {
      console.error('Error cargando exportaciones:', e);
    } finally {
      setTimeout(() => setCargando(false), 120);
    }
  };

  const agregarItem = () => {
    setItems((prev) => [
      ...prev,
      { descripcionES: '', descripcionEN: '', cantidad: 1, pesoLbs: 1, valorDeclaradoUSD: 10 }
    ]);
  };

  const eliminarItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarItem = (index, campo, valor) => {
    setItems((prev) => {
      const list = [...prev];
      list[index] = { ...list[index], [campo]: valor };
      return list;
    });
  };

  // Cálculo automático de tarifas de exportación
  const calcularTarifaBase = (peso) => {
    if (peso <= 10) return 190;
    if (peso <= 20) return 250;
    if (peso <= 30) return 350;
    return 450;
  };

  const recargoEstado = destinatarioEstado.toUpperCase() === 'FL' ? 0 : 10;
  const tarifaBase = calcularTarifaBase(parseFloat(pesoTotalLbs) || 0);
  const totalCobroUSD = tarifaBase + recargoEstado;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await exportacionService.crear({
        remitenteNombre,
        remitenteTelefono,
        destinatarioNombre,
        destinatarioTelefono,
        destinatarioEstado,
        destinatarioCiudad,
        destinatarioZipCode: destinatarioZip,
        destinatarioDireccion,
        pesoTotalLbs: parseFloat(pesoTotalLbs) || 0,
        trackingFedEx,
        items
      });
      setModalNuevo(false);
      // Limpiar Formulario
      setRemitenteNombre('');
      setRemitenteTelefono('');
      setDestinatarioNombre('');
      setDestinatarioCiudad('');
      setDestinatarioDireccion('');
      setTrackingFedEx('');
      cargarEnvios();
    } catch (e) {
      alert('Error al registrar envío de exportación');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Header Interactivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl flex items-center justify-center transition-transform hover:scale-105 duration-200">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
              Exportación Nicaragua ➔ EE. UU. (FedEx)
            </h1>
            <p className="text-xs text-slate-500">
              Desglose aduanero ítem por ítem y emisión de Commercial Invoice oficial
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalNuevo(true)}
          className="px-4 py-2.5 bg-brand hover:bg-brand-600 active:scale-95 text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Envío a EE. UU.</span>
        </button>
      </div>

      {/* Lista de Envíos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Código / Tracking</th>
                <th className="py-3 px-4">Remitente</th>
                <th className="py-3 px-4">Destinatario (USA)</th>
                <th className="py-3 px-4 text-center">Peso</th>
                <th className="py-3 px-4 text-right">Total ($ USD)</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-3.5 bg-slate-200 rounded w-16 mx-auto"></div></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-7 bg-slate-200 rounded-xl w-32 mx-auto"></div></td>
                  </tr>
                ))
              ) : envios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No se han registrado manifiestos de exportación a EE. UU.
                  </td>
                </tr>
              ) : (
                envios.map((env) => (
                  <tr key={env.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand">
                      {env.codigoEnvio}
                      {env.trackingFedEx && (
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <span>FedEx: {env.trackingFedEx}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {env.remitenteNombre}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{env.destinatarioNombre}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {env.destinatarioCiudad}, {env.destinatarioEstado}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-display text-slate-900">
                      {env.pesoTotalLbs} lbs
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-display text-emerald-600">
                      ${env.totalCobradoUSD.toFixed(2)} USD
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setModalFactura(env)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl font-bold transition-all flex items-center gap-1.5 mx-auto cursor-pointer shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand" />
                        <span>Commercial Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Envío con Animación */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 text-xs font-sans animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-brand" />
                Nuevo Manifiesto de Exportación FedEx
              </h2>
              <button 
                onClick={() => setModalNuevo(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Sección Remitente & Destinatario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-2">
                  <span className="font-bold text-[11px] text-slate-700 uppercase flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-brand" /> Remitente (Nicaragua)
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Nombre Completo"
                    value={remitenteNombre}
                    onChange={(e) => setRemitenteNombre(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Teléfono (+505)"
                    value={remitenteTelefono}
                    onChange={(e) => setRemitenteTelefono(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-[11px] text-slate-700 uppercase flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand" /> Destinatario (USA)
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Nombre en EE. UU."
                    value={destinatarioNombre}
                    onChange={(e) => setDestinatarioNombre(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={destinatarioEstado}
                      onChange={(e) => setDestinatarioEstado(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl p-2 font-bold cursor-pointer"
                    >
                      <option value="FL">Florida (FL - Base)</option>
                      <option value="TX">Texas (TX +$10)</option>
                      <option value="CA">California (CA +$10)</option>
                      <option value="NY">New York (NY +$10)</option>
                      <option value="OTRO">Otro Estado (+$10)</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Ciudad"
                      value={destinatarioCiudad}
                      onChange={(e) => setDestinatarioCiudad(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Peso & Tarifas Dinámicas */}
              <div className="grid grid-cols-3 gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Peso Total (Lbs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pesoTotalLbs}
                    onChange={(e) => setPesoTotalLbs(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 font-bold font-display"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Recargo Estado</label>
                  <div className="p-2 bg-slate-800 border border-slate-700 rounded-xl font-bold text-slate-300 font-display">
                    +${recargoEstado.toFixed(2)} USD
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Total a Cobrar</label>
                  <div className="p-2 bg-slate-800/80 text-emerald-400 rounded-xl font-bold font-display text-sm">
                    ${totalCobroUSD.toFixed(2)} USD
                  </div>
                </div>
              </div>

              {/* Desglose Aduanero */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Desglose Aduanero Ítem por Ítem
                  </span>
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="text-brand font-bold hover:underline cursor-pointer active:scale-95 transition"
                  >
                    + Agregar Artículo
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 items-center transition-all hover:bg-slate-100/60">
                      <input
                        type="text"
                        placeholder="Español (ej. Queso)"
                        value={it.descripcionES}
                        onChange={(e) => actualizarItem(idx, 'descripcionES', e.target.value)}
                        className="col-span-4 bg-white border border-slate-300 rounded-lg p-1.5"
                      />
                      <input
                        type="text"
                        placeholder="Inglés (ej. Cheese)"
                        value={it.descripcionEN}
                        onChange={(e) => actualizarItem(idx, 'descripcionEN', e.target.value)}
                        className="col-span-4 bg-white border border-slate-300 rounded-lg p-1.5"
                      />
                      <input
                        type="number"
                        placeholder="Cant."
                        value={it.cantidad}
                        onChange={(e) => actualizarItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                        className="col-span-1 bg-white border border-slate-300 rounded-lg p-1.5 text-center font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Valor $"
                        value={it.valorDeclaradoUSD}
                        onChange={(e) => actualizarItem(idx, 'valorDeclaradoUSD', parseFloat(e.target.value) || 0)}
                        className="col-span-2 bg-white border border-slate-300 rounded-lg p-1.5 font-bold font-display"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarItem(idx)}
                        disabled={items.length === 1}
                        className="col-span-1 text-slate-400 hover:text-red-600 disabled:opacity-30 flex justify-center cursor-pointer transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-1/2 py-3 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Envío de Exportación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Commercial Invoice Bilingüe */}
      {modalFactura && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-4 text-xs font-sans animate-in zoom-in-95 duration-150">
            <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black font-display text-slate-900">COMMERCIAL INVOICE / DECLARACIÓN ADUANAL</h2>
                <p className="text-[10px] text-slate-400">Abba Xpress Logistics • FedEx International Gateway</p>
              </div>
              <span className="font-mono font-bold text-brand text-sm">{modalFactura.codigoEnvio}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Shipper (Remitente)</p>
                <p className="font-bold text-slate-800 text-sm">{modalFactura.remitenteNombre}</p>
                <p className="text-slate-500 font-mono">{modalFactura.remitenteTelefono}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Consignee (Destinatario)</p>
                <p className="font-bold text-slate-800 text-sm">{modalFactura.destinatarioNombre}</p>
                <p className="text-slate-500">{modalFactura.destinatarioCiudad}, {modalFactura.destinatarioEstado}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="p-2.5">Description (EN / ES)</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Value USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {modalFactura.items?.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5">
                      <div className="font-bold text-slate-800">{it.descripcionEN}</div>
                      <div className="text-[10px] text-slate-400">{it.descripcionES}</div>
                    </td>
                    <td className="p-2.5 text-center font-bold">{it.cantidad}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700">${it.valorDeclaradoUSD?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setModalFactura(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition active:scale-95 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-brand hover:bg-brand-600 active:scale-95 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Manifiesto</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}