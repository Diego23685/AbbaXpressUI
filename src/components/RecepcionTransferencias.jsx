import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Search, 
  Package, 
  ArrowRight, 
  UserCheck, 
  X, 
  Save, 
  User, 
  CreditCard,
  Building,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { proformaService } from '../services/proformaService';
import { clienteService } from '../services/clienteService';
import api from '../services/api';
import ArriboAnimacion from '../components/ArriboAnimacion';

export default function RecepcionTransferencias() {
  const { usuario } = useAuth();
  const [cargasEnTransito, setCargasEnTransito] = useState([]);
  const [clientesLeon, setClientesLeon] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [procesando, setProcesando] = useState(false);

  // Preferencia persistente de animación
  const [habilitarAnimacion, setHabilitarAnimacion] = useState(() => {
    const guardado = localStorage.getItem('abba_animacion_arribo');
    return guardado !== null ? JSON.parse(guardado) : true;
  });

  // Estados de Animación de Arribo
  const [mostrarAnimacionArribo, setMostrarAnimacionArribo] = useState(false);
  const [datosAnimacion, setDatosAnimacion] = useState({
    proformaNumero: '',
    clienteNombre: '',
    cantidadBultos: 1
  });

  // Modal de Verificación y Asignación Directa
  const [modalProcesar, setModalProcesar] = useState(false);
  const [proformaSeleccionada, setProformaSeleccionada] = useState(null);
  const [clienteLeonId, setClienteLeonId] = useState('');
  const [clienteActual, setClienteActual] = useState(null);
  const [metodoPago, setMetodoPago] = useState('CREDITO');
  const [cargoDelivery, setCargoDelivery] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [paquetesEditables, setPaquetesEditables] = useState([]);

  const esLeon = usuario?.sucursalId === 3;

  useEffect(() => {
    cargarDatos();
  }, []);

  const toggleAnimacionPreferencia = (valor) => {
    setHabilitarAnimacion(valor);
    localStorage.setItem('abba_animacion_arribo', JSON.stringify(valor));
  };

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [transitoData, clientesData] = await Promise.all([
        proformaService.obtenerTodas({ estado: 'EN_TRANSITO', busqueda }),
        esLeon ? clienteService.obtenerTodos() : Promise.resolve([])
      ]);

      setCargasEnTransito(transitoData || []);
      setClientesLeon(clientesData || []);
    } catch (e) {
      console.error('Error al cargar datos:', e);
    } finally {
      setCargando(false);
    }
  };

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const abrirModalAsignacion = (proforma) => {
    setProformaSeleccionada(proforma);
    const primerCliente = clientesLeon[0] || null;
    setClienteLeonId(primerCliente ? primerCliente.id : '');
    setClienteActual(primerCliente);
    setMetodoPago('CREDITO');
    setCargoDelivery(proforma.cargoDeliveryUSD || 0);
    setDescuento(proforma.descuentoUSD || 0);

    const pkgs = proforma.paquetes.map((pkg) => {
      let tarifaSugerida = pkg.tarifaAplicada;
      if (primerCliente) {
        tarifaSugerida = pkg.viaEnvio === 'MARITIMO' ? primerCliente.tarifaMaritimo : primerCliente.tarifaAereo;
      }
      return {
        id: pkg.id,
        tracking: pkg.tracking,
        label: pkg.label,
        viaEnvio: pkg.viaEnvio,
        categoria: pkg.categoria,
        pesoLbs: pkg.pesoLbs,
        tarifaAplicada: tarifaSugerida
      };
    });

    setPaquetesEditables(pkgs);
    setModalProcesar(true);
  };

  const handleCambioCliente = (e) => {
    const id = parseInt(e.target.value);
    setClienteLeonId(id);
    const cliente = clientesLeon.find((c) => c.id === id);
    setClienteActual(cliente || null);

    if (cliente) {
      setPaquetesEditables((prev) =>
        prev.map((pkg) => {
          let tarifa = pkg.tarifaAplicada;
          if (pkg.categoria === 'GENERAL' || pkg.categoria === 'PALLET') {
            tarifa = pkg.viaEnvio === 'MARITIMO' ? cliente.tarifaMaritimo : cliente.tarifaAereo;
          }
          return { ...pkg, tarifaAplicada: tarifa };
        })
      );
    }
  };

  const actualizarPaquete = (id, campo, valor) => {
    setPaquetesEditables((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  };

  const calcularSubtotalItem = (pkg) => {
    const peso = parseFloat(pkg.pesoLbs) || 0;
    const tarifa = parseFloat(pkg.tarifaAplicada) || 0;
    if (pkg.categoria === 'CELULAR' || pkg.categoria === 'PALLET') return tarifa;
    return peso * tarifa;
  };

  const totalUSD = Math.max(
    0,
    paquetesEditables.reduce((acc, p) => acc + calcularSubtotalItem(p), 0) +
      (parseFloat(cargoDelivery) || 0) -
      (parseFloat(descuento) || 0)
  );

  const handleGuardarRecepcionLeon = async (e) => {
    e.preventDefault();
    if (!clienteLeonId) {
      alert('Seleccione un cliente consignatario en León.');
      return;
    }

    setProcesando(true);
    try {
      const payload = {
        clienteId: parseInt(clienteLeonId),
        metodoPago: metodoPago,
        cargoDeliveryUSD: parseFloat(cargoDelivery) || 0,
        descuentoUSD: parseFloat(descuento) || 0,
        paquetes: paquetesEditables.map((p) => ({
          id: p.id,
          pesoLbs: parseFloat(p.pesoLbs) || 0,
          tarifaAplicada: parseFloat(p.tarifaAplicada) || 0
        }))
      };

      await api.put(`/proformas/${proformaSeleccionada.id}/procesar-recepcion-leon`, payload);
      setModalProcesar(false);

      if (habilitarAnimacion) {
        setDatosAnimacion({
          proformaNumero: proformaSeleccionada.numeroProforma,
          clienteNombre: clienteActual?.nombre || 'Cliente Local',
          cantidadBultos: paquetesEditables.length
        });
        setMostrarAnimacionArribo(true);
      } else {
        await cargarDatos();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error al procesar la recepción.');
    } finally {
      setProcesando(false);
    }
  };

  const handleConfirmarLoteSimple = async () => {
    if (seleccionados.length === 0) return;
    setProcesando(true);
    try {
      await api.put('/proformas/recibir-lote', seleccionados);
      const totalSeleccionados = seleccionados.length;
      setSeleccionados([]);

      if (habilitarAnimacion) {
        setDatosAnimacion({
          proformaNumero: `${totalSeleccionados} Cargas`,
          clienteNombre: 'Ingreso General de Bodega',
          cantidadBultos: totalSeleccionados
        });
        setMostrarAnimacionArribo(true);
      } else {
        await cargarDatos();
      }
    } catch (e) {
      alert('Error al confirmar recepción.');
    } finally {
      setProcesando(false);
    }
  };

  const handleAnimacionTerminada = async () => {
    setMostrarAnimacionArribo(false);
    await cargarDatos();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Modal Animación Condicional */}
      {mostrarAnimacionArribo && (
        <ArriboAnimacion
          proformaNumero={datosAnimacion.proformaNumero}
          clienteNombre={datosAnimacion.clienteNombre}
          cantidadBultos={datosAnimacion.cantidadBultos}
          sucursal="Bodega Central León"
          onCompletado={handleAnimacionTerminada}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand" />
            Monitoreo y Recepción de Transferencias en Tránsito
          </h1>
          <p className="text-xs text-slate-500">
            Arribo de cargas desde Managua, verificación de paquetes y asignación directa a clientes locales
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Checkbox / Switch para activar o desactivar animaciones */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-100 transition select-none">
            <input
              type="checkbox"
              checked={habilitarAnimacion}
              onChange={(e) => toggleAnimacionPreferencia(e.target.checked)}
              className="w-4 h-4 text-brand rounded focus:ring-brand accent-brand cursor-pointer"
            />
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Efectos Visuales & Sonido</span>
          </label>

          {esLeon && seleccionados.length > 0 && (
            <button
              disabled={procesando}
              onClick={handleConfirmarLoteSimple}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ingreso Masivo ({seleccionados.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Cargas en Tránsito */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {esLeon && <th className="p-3 text-center w-10">Sel.</th>}
              <th className="p-3">Proforma</th>
              <th className="p-3">Ruta</th>
              <th className="p-3">Consignatario Origen</th>
              <th className="p-3 text-center">Bultos</th>
              <th className="p-3 text-center">Peso</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">Cargando transferencias en tránsito...</td></tr>
            ) : cargasEnTransito.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">No hay transferencias en ruta hacia sucursal actualmente.</td></tr>
            ) : (
              cargasEnTransito.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                  {esLeon && (
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
                  <td className="p-3 font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span>{p.sucursalOrigen || 'Managua'}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-brand font-bold">{p.sucursalDestino || 'León'}</span>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{p.clienteNombre}</td>
                  <td className="p-3 text-center font-bold">{p.paquetes?.length || 0}</td>
                  <td className="p-3 text-center font-display font-bold text-slate-900">{p.totalLbs?.toFixed(2)} lbs</td>
                  <td className="p-3 text-center">
                    {esLeon ? (
                      <button
                        onClick={() => abrirModalAsignacion(p)}
                        className="px-3 py-1.5 bg-brand hover:bg-brand-600 active:scale-95 text-white rounded-lg font-bold text-[11px] transition-all shadow flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Verificar & Asignar Cliente</span>
                      </button>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        En Ruta a León
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Verificación y Asignación */}
      {modalProcesar && proformaSeleccionada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-xs animate-in zoom-in-95 duration-150">
            
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold font-display text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand" /> Recepción y Asignación de Carga #{proformaSeleccionada.numeroProforma}
                </h3>
                <p className="text-[10px] text-slate-400">Verifica los bultos y asigna el cobro al cliente final de León</p>
              </div>
              <button 
                onClick={() => setModalProcesar(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarRecepcionLeon} className="p-5 space-y-4 overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cliente Consignatario (León)</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-3" />
                    <select
                      value={clienteLeonId}
                      onChange={handleCambioCliente}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-9 pr-3 font-semibold text-slate-800 focus:outline-none focus:border-brand cursor-pointer"
                    >
                      {clientesLeon.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.telefono})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Condición de Cobro</label>
                  <div className="relative flex items-center">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3" />
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-9 pr-3 font-semibold text-slate-800 focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="CREDITO">Pendiente de Cobro (Crédito)</option>
                      <option value="EFECTIVO_USD">Efectivo ($ USD)</option>
                      <option value="EFECTIVO_NIO">Efectivo (C$ NIO)</option>
                      <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Bultos Incluidos en la Transferencia ({paquetesEditables.length})
                </label>
                <div className="space-y-2">
                  {paquetesEditables.map((pkg) => (
                    <div key={pkg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-4">
                        <div className="font-mono font-bold text-brand">{pkg.tracking}</div>
                        <div className="text-[10px] text-slate-500">{pkg.label || 'General'} ({pkg.viaEnvio})</div>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[9px] uppercase font-bold text-slate-500">Peso (lbs)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pkg.pesoLbs}
                          onChange={(e) => actualizarPaquete(pkg.id, 'pesoLbs', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-slate-800 text-center"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[9px] uppercase font-bold text-slate-500">Tarifa ($/lb)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pkg.tarifaAplicada}
                          onChange={(e) => actualizarPaquete(pkg.id, 'tarifaAplicada', e.target.value)}
                          className="w-full bg-amber-50 border border-amber-300 rounded-lg p-1.5 font-bold text-amber-900 text-center"
                        />
                      </div>

                      <div className="sm:col-span-2 text-right">
                        <label className="block text-[9px] uppercase font-bold text-slate-500">Subtotal</label>
                        <div className="font-bold font-display text-slate-900">${calcularSubtotalItem(pkg).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cargo Delivery ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cargoDelivery}
                    onChange={(e) => setCargoDelivery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Descuento ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={descuento}
                    onChange={(e) => setDescuento(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Total a Cobrar (Cliente León)</p>
                  <p className="text-xl font-black font-display text-emerald-400">${totalUSD.toFixed(2)} USD</p>
                </div>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-6 py-3 bg-brand hover:bg-brand-600 active:scale-95 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{procesando ? 'Guardando...' : 'Confirmar y Asignar Carga'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}