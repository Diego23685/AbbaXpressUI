import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  Trash2, 
  FileText, 
  Globe, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  Printer, 
  ExternalLink 
} from 'lucide-react';
import { exportacionService } from '../services/exportacionService';

export default function ExportacionFedEx() {
  const [envios, setEnvios] = useState([]);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalFactura, setModalFactura] = useState(null);

  // Formulario
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
    try {
      const data = await exportacionService.obtenerTodos();
      setEnvios(data);
    } catch (e) {
      console.error(e);
    }
  };

  const agregarItem = () => {
    setItems([...items, { descripcionES: '', descripcionEN: '', cantidad: 1, pesoLbs: 1, valorDeclaradoUSD: 10 }]);
  };

  const eliminarItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const actualizarItem = (index, campo, valor) => {
    const list = [...items];
    list[index][campo] = valor;
    setItems(list);
  };

  // Cálculo automático
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
      cargarEnvios();
    } catch (e) {
      alert('Error al guardar envío de exportación');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-brand" />
            Exportación Nicaragua ➔ EE. UU. (FedEx)
          </h1>
          <p className="text-xs text-slate-500">
            Desglose aduanero ítem por ítem y Commercial Invoice oficial
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="px-4 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
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
                <th className="py-3 px-4">Peso</th>
                <th className="py-3 px-4 text-right">Total ($ USD)</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {envios.map((env) => (
                <tr key={env.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand">
                    {env.codigoEnvio}
                    {env.trackingFedEx && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        FedEx: {env.trackingFedEx}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {env.remitenteNombre}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{env.destinatarioNombre}</div>
                    <div className="text-[10px] text-slate-400">{env.destinatarioCiudad}, {env.destinatarioEstado}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold font-display">
                    {env.pesoTotalLbs} lbs
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold font-display text-slate-900">
                    ${env.totalCobradoUSD.toFixed(2)} USD
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setModalFactura(env)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-brand" />
                      <span>Commercial Invoice</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Envío */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 text-xs font-sans">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand" />
              Nuevo Manifiesto de Exportación FedEx
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Sección Remitente & Destinatario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-2">
                  <span className="font-bold text-[11px] text-slate-700 uppercase">Remitente (Nicaragua)</span>
                  <input
                    type="text"
                    required
                    placeholder="Nombre Completo"
                    value={remitenteNombre}
                    onChange={(e) => setRemitenteNombre(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Teléfono (+505)"
                    value={remitenteTelefono}
                    onChange={(e) => setRemitenteTelefono(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2"
                  />
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-[11px] text-slate-700 uppercase">Destinatario (USA)</span>
                  <input
                    type="text"
                    required
                    placeholder="Nombre en EE. UU."
                    value={destinatarioNombre}
                    onChange={(e) => setDestinatarioNombre(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={destinatarioEstado}
                      onChange={(e) => setDestinatarioEstado(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl p-2 font-bold"
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
                      className="w-full bg-white border border-slate-300 rounded-xl p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Peso & Tarifas */}
              <div className="grid grid-cols-3 gap-3 bg-brand/5 p-4 rounded-2xl border border-brand/20">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peso Total (Lbs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pesoTotalLbs}
                    onChange={(e) => setPesoTotalLbs(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold font-display"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recargo Estado</label>
                  <div className="p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-700">
                    +${recargoEstado.toFixed(2)} USD
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total a Cobrar</label>
                  <div className="p-2 bg-slate-900 text-emerald-400 rounded-xl font-bold font-display">
                    ${totalCobroUSD.toFixed(2)} USD
                  </div>
                </div>
              </div>

              {/* Desglose Aduanero Ítem por Ítem */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Desglose Aduanero Ítem por Ítem</span>
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="text-brand font-bold hover:underline cursor-pointer"
                  >
                    + Agregar Artículo
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 items-center">
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
                      className="col-span-1 text-red-500 hover:text-red-700 flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg"
                >
                  Guardar Envío de Exportación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Commercial Invoice Bilingüe */}
      {modalFactura && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-4 text-xs font-sans">
            <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-base font-black font-display text-slate-900">COMMERCIAL INVOICE / DECLARACIÓN DE ADUANA</h2>
                <p className="text-[10px] text-slate-400">Abba Xpress • FedEx International Gateway</p>
              </div>
              <span className="font-mono font-bold text-brand">{modalFactura.codigoEnvio}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Shipper (Remitente)</p>
                <p className="font-bold text-slate-800">{modalFactura.remitenteNombre}</p>
                <p className="text-slate-500">{modalFactura.remitenteTelefono}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Consignee (Destinatario)</p>
                <p className="font-bold text-slate-800">{modalFactura.destinatarioNombre}</p>
                <p className="text-slate-500">{modalFactura.destinatarioCiudad}, {modalFactura.destinatarioEstado}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-200">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="p-2">Description (ES/EN)</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Value USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {modalFactura.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <div className="font-bold">{it.descripcionEN}</div>
                      <div className="text-[10px] text-slate-400">{it.descripcionES}</div>
                    </td>
                    <td className="p-2 text-center font-bold">{it.cantidad}</td>
                    <td className="p-2 text-right font-mono font-bold">${it.valorDeclaradoUSD.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setModalFactura(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl flex items-center gap-2"
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