import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Truck, 
  CreditCard,
  Building2,
  UserCheck,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  ShieldAlert,
  Printer,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { useAuth } from '../context/AuthContext';
import { proformaService } from '../services/proformaService';
import api from '../services/api';

export default function ControlFacturacion() {
  const { usuario } = useAuth();
  const [proformas, setProformas] = useState([]);
  const [resumen, setResumen] = useState({
    totalPorCobrarUSD: 0,
    totalFacturadoUSD: 0,
    totalLibrasPendientes: 0,
    cantidadPendientes: 0
  });
  const [tipoCambioOficial, setTipoCambioOficial] = useState(36.6243);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE_PAGO');
  const [modalLiquidacion, setModalLiquidacion] = useState(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('EFECTIVO_USD');
  const [proformaExpandida, setProformaExpandida] = useState(null);

  // Estado para la Paginación (10 registros por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const REGISTROS_POR_PAGINA = 10;

  // Estado para el ticket / comprobante
  const [ticketData, setTicketData] = useState(null);

  const esLeon = usuario?.sucursalId === 3;

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  // Reiniciar la página a 1 cuando cambie el filtro de estado o la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEstado, busqueda]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listado, datosResumen, configRes] = await Promise.all([
        proformaService.obtenerTodas({ estado: filtroEstado, busqueda }),
        proformaService.obtenerResumenCobros(),
        api.get('/configuracion')
      ]);
      setProformas(listado);
      setResumen(datosResumen);
      if (configRes.data?.tipoCambioNIO) {
        setTipoCambioOficial(configRes.data.tipoCambioNIO);
      }
    } catch (error) {
      console.error('Error al cargar datos de facturación:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  // Cálculo dinámico para la paginación
  const totalPaginas = Math.ceil(proformas.length / REGISTROS_POR_PAGINA) || 1;
  const proformasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    return proformas.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [proformas, paginaActual]);

  const toggleExpandir = (id) => {
    setProformaExpandida(proformaExpandida === id ? null : id);
  };

  const dispararWhatsApp = async (id) => {
    try {
      const data = await proformaService.obtenerPlantillaWhatsApp(id);
      window.open(data.enlaceDirecto, '_blank');
    } catch (error) {
      alert('Error al generar enlace de WhatsApp');
    }
  };

  const abrirTicketExistente = (p) => {
    setTicketData({
      numeroProforma: p.numeroProforma,
      fecha: new Date(p.fechaRegistro).toLocaleString(),
      clienteNombre: p.clienteNombre,
      clienteTelefono: p.clienteTelefono || '',
      usuarioNombre: usuario?.nombre || 'Operador',
      sucursalNombre: p.sucursalOrigen || usuario?.sucursalNombre || 'Sede Central',
      metodoPago: p.metodoPago || 'EFECTIVO_USD',
      cargoDelivery: p.cargoDeliveryUSD || 0,
      descuento: p.descuentoUSD || 0,
      tipoCambioAplicado: p.tipoCambioAplicado || tipoCambioOficial,
      totalLbs: p.totalLbs,
      totalUSD: p.totalCobradoUSD,
      totalNIO: p.totalCobradoNIO || (p.totalCobradoUSD * (p.tipoCambioAplicado || tipoCambioOficial)),
      paquetes: p.paquetes || []
    });
  };

  const ejecutarLiquidacion = async () => {
    if (!modalLiquidacion) return;
    try {
      await proformaService.liquidar(modalLiquidacion.id, metodoSeleccionado);
      
      const proformaCobrada = modalLiquidacion;
      setModalLiquidacion(null);

      setTicketData({
        numeroProforma: proformaCobrada.numeroProforma,
        fecha: new Date().toLocaleString(),
        clienteNombre: proformaCobrada.clienteNombre,
        clienteTelefono: proformaCobrada.clienteTelefono || '',
        usuarioNombre: usuario?.nombre || 'Operador',
        sucursalNombre: usuario?.sucursalNombre || 'Sede Central',
        metodoPago: metodoSeleccionado,
        cargoDelivery: proformaCobrada.cargoDeliveryUSD || 0,
        descuento: proformaCobrada.descuentoUSD || 0,
        tipoCambioAplicado: proformaCobrada.tipoCambioAplicado || tipoCambioOficial,
        totalLbs: proformaCobrada.totalLbs,
        totalUSD: proformaCobrada.totalCobradoUSD,
        totalNIO: proformaCobrada.totalCobradoUSD * (proformaCobrada.tipoCambioAplicado || tipoCambioOficial),
        paquetes: proformaCobrada.paquetes || []
      });

      cargarDatos();
    } catch (error) {
      alert('Error al liquidar la proforma');
    }
  };

  const imprimirTicket = () => {
    window.print();
  };

  const enviarWhatsAppImagen = async () => {
    const ticketElement = document.getElementById('ticket-digital-pantalla');
    if (!ticketElement) return;

    try {
      const dataUrl = await toPng(ticketElement, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
      
      const link = document.createElement('a');
      link.download = `Comprobante_${ticketData.numeroProforma}.png`;
      link.href = dataUrl;
      link.click();

      const telefonoLimpio = (ticketData.clienteTelefono || '').replace(/[^0-9]/g, '');
      const texto = encodeURIComponent(`Hola *${ticketData.clienteNombre}*, adjunto el comprobante de su carga #${ticketData.numeroProforma} por un total de $${ticketData.totalUSD.toFixed(2)} USD (C$ ${ticketData.totalNIO.toFixed(2)} NIO). ¡Gracias por su preferencia!`);
      
      window.open(`https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${texto}`, '_blank');
    } catch (err) {
      console.error('Error al generar la imagen para WhatsApp:', err);
      alert('No se pudo generar la imagen del ticket automáticamente.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand" />
            Cuentas por Cobrar y Facturación
          </h1>
          <p className="text-xs text-slate-500">
            {esLeon 
              ? 'Control de inventario recibido desde Managua y facturación local a clientes de León'
              : 'Control de saldos a crédito, cobros en mostrador y notificaciones por WhatsApp'}
          </p>
        </div>
      </div>

      {/* KPI Cards Dinámicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Por Cobrar (Crédito)</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black font-display text-amber-900">
            ${resumen.totalPorCobrarUSD.toFixed(2)} <span className="text-xs font-normal">USD</span>
          </p>
          <p className="text-[10px] text-amber-700/80 mt-1 font-medium">
            {resumen.cantidadPendientes} proformas pendientes
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Cobrado / Facturado</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black font-display text-emerald-900">
            ${resumen.totalFacturadoUSD.toFixed(2)} <span className="text-xs font-normal">USD</span>
          </p>
          <p className="text-[10px] text-emerald-700/80 mt-1 font-medium">
            Ingresos liquidados
          </p>
        </div>

        <div className="bg-brand/10 border border-brand/30 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-brand-700 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Libras en Bodega</span>
            <Truck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black font-display text-brand-900">
            {resumen.totalLibrasPendientes.toFixed(2)} <span className="text-xs font-normal">lbs</span>
          </p>
          <p className="text-[10px] text-brand-700/80 mt-1 font-medium">
            Carga en inventario local
          </p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">T/C Oficial</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black font-display text-white">
            C$ {tipoCambioOficial.toFixed(4)} <span className="text-xs font-normal text-slate-400">NIO</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">
            Multimoneda Sincronizada
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        
        {/* Toggle de Estados */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFiltroEstado('PENDIENTE_PAGO')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
              filtroEstado === 'PENDIENTE_PAGO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📦 Pendientes & En Bodega
          </button>
          <button
            onClick={() => setFiltroEstado('EN_TRANSITO')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
              filtroEstado === 'EN_TRANSITO' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🚚 En Ruta
          </button>
          <button
            onClick={() => setFiltroEstado('FACTURADO')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
              filtroEstado === 'FACTURADO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Facturados
          </button>
          <button
            onClick={() => setFiltroEstado('')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
              filtroEstado === '' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todos
          </button>
        </div>

        {/* Buscador */}
        <form onSubmit={handleBuscar} className="w-full md:w-80 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Buscar por proforma, cliente o tracking..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-brand font-medium"
          />
        </form>
      </div>

      {/* Tabla de Proformas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Proforma</th>
                <th className="py-3 px-4">Cliente / Consignatario</th>
                <th className="py-3 px-4">Paquetes / Peso</th>
                <th className="py-3 px-4">Sede Destino</th>
                <th className="py-3 px-4 text-right">Total ($ USD / C$ NIO)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    Cargando registros contables...
                  </td>
                </tr>
              ) : proformasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No se encontraron proformas en este estado.
                  </td>
                </tr>
              ) : (
                proformasPaginadas.map((p) => {
                  const esRemisionMayoristaManagua = esLeon && p.sucursalOrigen !== 'Sucursal León';

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-50/70 transition">
                        
                        {/* Proforma */}
                        <td className="py-3.5 px-4 font-mono font-bold text-brand">
                          <button
                            onClick={() => toggleExpandir(p.id)}
                            className="flex items-center gap-1.5 hover:underline cursor-pointer text-left"
                          >
                            {proformaExpandida === p.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{p.numeroProforma}</span>
                          </button>
                          <div className="text-[10px] font-normal text-slate-400 font-sans pl-5">
                            {new Date(p.fechaRegistro).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Cliente */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            {p.clienteNombre.includes('León') ? (
                              <Building2 className="w-3.5 h-3.5 text-brand" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>{p.clienteNombre}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{p.clienteTelefono}</div>
                        </td>

                        {/* Paquetes / Peso */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">{p.paquetes.length} paquetes</span>
                          <div className="text-[10px] font-bold text-slate-500 font-display">
                            {p.totalLbs.toFixed(2)} lbs
                          </div>
                        </td>

                        {/* Sucursal */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {p.sucursalDestino}
                        </td>

                        {/* Total Multimoneda */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold font-display text-slate-900">
                            ${p.totalCobradoUSD.toFixed(2)} USD
                          </div>
                          <div className="text-[10px] text-slate-400 font-display">
                            C$ {p.totalCobradoNIO.toFixed(2)} NIO
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.estado === 'FACTURADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.estado === 'RECIBIDO_BODEGA_LOCAL'
                              ? 'bg-purple-100 text-purple-800'
                              : p.estado === 'EN_TRANSITO'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {p.estado === 'FACTURADO'
                              ? 'Facturado'
                              : p.estado === 'RECIBIDO_BODEGA_LOCAL'
                              ? (esLeon ? '🏢 Remisión B2B Managua' : '📦 Recibido en Destino')
                              : p.estado === 'EN_TRANSITO'
                              ? '🚚 En Ruta'
                              : 'Pendiente'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => dispararWhatsApp(p.id)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition cursor-pointer"
                              title="Enviar Notificación por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>

                            {/* Botón para Re-generar / Ver Comprobante */}
                            <button
                              onClick={() => abrirTicketExistente(p)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                              title="Ver y Re-imprimir Comprobante"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Cobrar */}
                            {(!esLeon || !esRemisionMayoristaManagua) && (
                              p.estado === 'PENDIENTE_PAGO' || p.estado === 'EN_TRANSITO' || p.estado === 'RECIBIDO_BODEGA_LOCAL'
                            ) && (
                              <button
                                onClick={() => setModalLiquidacion(p)}
                                className="px-3 py-1.5 bg-brand hover:bg-brand-600 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Cobrar</span>
                              </button>
                            )}

                            {esRemisionMayoristaManagua && (
                              <span className="text-[10px] text-slate-400 italic bg-slate-100 px-2 py-1 rounded-lg" title="Carga mayoreo recibida de Managua.">
                                B2B
                              </span>
                            )}
                          </div>
                        </td>

                      </tr>

                      {/* Desglose Detallado */}
                      {proformaExpandida === p.id && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan="7" className="p-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-inner space-y-2">
                              <div className="flex items-center justify-between text-slate-600 font-bold border-b border-slate-100 pb-2">
                                <span className="flex items-center gap-1.5">
                                  <PackageCheck className="w-4 h-4 text-brand" />
                                  Desglose de Paquetes en #{p.numeroProforma}
                                </span>
                                <span className="font-mono text-[11px] text-slate-400">
                                  T/C Aplicado: C$ {p.tipoCambioAplicado?.toFixed(4)}
                                </span>
                              </div>

                              {esRemisionMayoristaManagua && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                                  <span>Esta carga ingresó por mayoreo desde Managua. Los bultos están listos en su bodega para ser re-facturados a su cliente final local con sus tarifas de León.</span>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                {p.paquetes.map((pkg, idx) => (
                                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-mono font-bold text-slate-800">{pkg.tracking}</span>
                                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                                        {pkg.viaEnvio}
                                      </span>
                                    </div>
                                    <div className="text-slate-500 text-[11px]">{pkg.label || 'Paquete General'}</div>
                                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 font-medium">
                                      <span className="text-slate-600">
                                        {pkg.pesoLbs.toFixed(2)} lb
                                      </span>
                                      <span className="font-bold font-display text-slate-900">
                                        ${pkg.subtotalUSD.toFixed(2)} USD
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación de 10 registros por página */}
        {!cargando && proformas.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500 text-xs">
            <span>
              Mostrando {((paginaActual - 1) * REGISTROS_POR_PAGINA) + 1} - {Math.min(paginaActual * REGISTROS_POR_PAGINA, proformas.length)} de {proformas.length} proformas
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 font-semibold text-slate-700">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Liquidación / Cobro */}
      {modalLiquidacion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-sans">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Liquidar y Entregar #{modalLiquidacion.numeroProforma}
            </h2>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <p className="text-slate-500">Cliente: <strong className="text-slate-800">{modalLiquidacion.clienteNombre}</strong></p>
              <p className="text-slate-500">Total a Pagar: <strong className="text-emerald-700 text-sm font-display">${modalLiquidacion.totalCobradoUSD.toFixed(2)} USD (C$ {modalLiquidacion.totalCobradoNIO.toFixed(2)})</strong></p>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Método de Pago Recibido:</label>
              <select
                value={metodoSeleccionado}
                onChange={(e) => setMetodoSeleccionado(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:border-brand"
              >
                <option value="EFECTIVO_USD">💵 Efectivo Dólares ($ USD)</option>
                <option value="EFECTIVO_NIO">🇳🇮 Efectivo Córdobas (C$ NIO)</option>
                <option value="TRANSFERENCIA">🏦 Transferencia Bancaria (BAC / LAFISE / Banpro)</option>
                <option value="POS">💳 Tarjeta / Terminal POS</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setModalLiquidacion(null)}
                className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarLiquidacion}
                className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-lg cursor-pointer"
              >
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprobante / Ticket Dual (Digital a Color & Térmico B&N) */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body * {
                visibility: hidden;
              }
              #ticket-termico-impresion, #ticket-termico-impresion * {
                visibility: visible;
                color: #000000 !important;
                font-family: 'Courier New', Courier, monospace !important;
                font-weight: 700 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              #ticket-termico-impresion {
                position: absolute;
                left: 0;
                top: 0;
                width: 74mm;
                margin: 0;
                padding: 1mm 2mm;
                background: #ffffff !important;
                font-size: 12px !important;
                display: block !important;
              }
              #ticket-digital-pantalla {
                display: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
            @media screen {
              #ticket-termico-impresion {
                display: none !important;
              }
            }
          `}} />

          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print">
              <h3 className="font-bold font-display text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-brand" /> Comprobante / Factura #{ticketData.numeroProforma}
              </h3>
              <button 
                onClick={() => setTicketData(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. TICKET DIGITAL (A color para pantalla y WhatsApp) */}
            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-800 space-y-3 bg-slate-50 select-text" id="ticket-digital-pantalla">
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <img 
                  src="/Logo.png" 
                  alt="Abba Xpress Logo" 
                  className="w-24 h-auto mx-auto mb-1 object-contain" 
                />
                <h4 className="font-bold text-base font-display text-slate-900">ABBA XPRESS</h4>
                <p className="text-[10px] text-slate-500 font-semibold">ERP Logístico Multimoneda</p>
                <p className="text-[11px] font-bold text-brand">{ticketData.sucursalNombre}</p>
                <p className="text-[10px] text-slate-400">{ticketData.fecha}</p>
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 text-[11px] bg-white p-3 rounded-xl border">
                <p><strong>Proforma:</strong> <span className="text-brand">#{ticketData.numeroProforma}</span></p>
                <p><strong>Cliente:</strong> {ticketData.clienteNombre}</p>
                <p><strong>Teléfono:</strong> {ticketData.clienteTelefono || 'N/A'}</p>
                <p><strong>Atendido por:</strong> {ticketData.usuarioNombre}</p>
                <p><strong>Condición:</strong> <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${ticketData.metodoPago === 'CREDITO' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {ticketData.metodoPago === 'CREDITO' ? '📦 CREDITO (PENDIENTE)' : `💵 PAGADO (${ticketData.metodoPago})`}
                </span></p>
              </div>

              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                <p className="font-bold text-[10px] uppercase text-slate-500">Detalle de Paquetes ({ticketData.paquetes.length})</p>
                {ticketData.paquetes.map((p, idx) => (
                  <div key={idx} className="text-[11px] space-y-0.5 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{p.tracking || 'TRK-GEN'}</span>
                      <span className="text-emerald-600">${(p.subtotalUSD !== undefined ? p.subtotalUSD : p.subtotal)?.toFixed(2) || '0.00'} USD</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>{p.label || 'General'} ({p.pesoLbs} lbs - {p.viaEnvio})</span>
                    </div>
                  </div>
                ))}
              </div>

              {ticketData.cargoDelivery > 0 && (
                <div className="flex justify-between text-[11px] px-1">
                  <span>Cargo Delivery:</span>
                  <span className="font-bold">${ticketData.cargoDelivery.toFixed(2)} USD</span>
                </div>
              )}

              {ticketData.descuento > 0 && (
                <div className="flex justify-between text-[11px] px-1 text-red-600">
                  <span>Descuento Aplicado:</span>
                  <span className="font-bold">-${ticketData.descuento.toFixed(2)} USD</span>
                </div>
              )}

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-right bg-slate-900 text-white p-3 rounded-xl">
                <p className="text-[10px] text-slate-400">T/C Oficial: C$ {ticketData.tipoCambioAplicado.toFixed(4)}</p>
                <p className="text-sm font-black font-display text-emerald-400">
                  TOTAL: ${ticketData.totalUSD.toFixed(2)} USD
                </p>
                <p className="text-xs font-black font-display text-brand-300">
                  TOTAL NIO: C$ {ticketData.totalNIO.toFixed(2)} NIO
                </p>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-1">
                <p>¡Gracias por preferir Abba Xpress!</p>
                <p>Comprobante Oficial.</p>
              </div>
            </div>

            {/* 2. TICKET TÉRMICO OCULTO (Impresión física 80mm B&N) */}
            <div className="hidden" id="ticket-termico-impresion">
              <div className="text-center space-y-0.5 border-b border-dashed border-black pb-2.5">
                <img src="/Logo.png" alt="Logo" className="w-28 h-auto mx-auto mb-1 filter grayscale contrast-125" />
                <h4 className="text-base font-black tracking-wider">ABBA XPRESS</h4>
                <p className="text-[10px] uppercase">ERP LOGISTICO MULTIMONEDA</p>
                <p className="text-[11px]">{ticketData.sucursalNombre}</p>
                <p className="text-[10px]">{ticketData.fecha}</p>
              </div>

              <div className="space-y-1 border-b border-dashed border-black pb-2.5 text-[11px]">
                <p><strong>Proforma:</strong> #{ticketData.numeroProforma}</p>
                <p><strong>Cliente:</strong> {ticketData.clienteNombre}</p>
                <p><strong>Teléfono:</strong> {ticketData.clienteTelefono || 'N/A'}</p>
                <p><strong>Atendido:</strong> {ticketData.usuarioNombre}</p>
                <p><strong>Condición:</strong> {ticketData.metodoPago}</p>
              </div>

              <div className="space-y-2 border-b border-dashed border-black pb-2.5">
                <p className="text-[10px] uppercase">DETALLE DE PAQUETES ({ticketData.paquetes.length})</p>
                {ticketData.paquetes.map((p, idx) => (
                  <div key={idx} className="text-[11px] py-1 border-b border-slate-300 last:border-0 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="truncate max-w-[130px]">{p.tracking || 'TRK-GEN'}</span>
                      <span>${(p.subtotalUSD !== undefined ? p.subtotalUSD : p.subtotal)?.toFixed(2) || '0.00'} USD</span>
                    </div>
                  </div>
                ))}
              </div>

              {ticketData.cargoDelivery > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>Cargo Delivery:</span>
                  <span>${ticketData.cargoDelivery.toFixed(2)} USD</span>
                </div>
              )}

              {ticketData.descuento > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>Descuento:</span>
                  <span>-${ticketData.descuento.toFixed(2)} USD</span>
                </div>
              )}

              <div className="border-t border-dashed border-black pt-2 space-y-1 text-right">
                <p className="text-[10px]">T/C Oficial: C$ {ticketData.tipoCambioAplicado.toFixed(4)}</p>
                <p className="text-sm font-black">
                  TOTAL: ${ticketData.totalUSD.toFixed(2)} USD
                </p>
                <p className="text-xs font-black">
                  TOTAL NIO: C$ {ticketData.totalNIO.toFixed(2)} NIO
                </p>
              </div>

              <div className="text-center text-[10px] pt-2 border-t border-dashed border-black space-y-0.5">
                <p>¡Gracias por preferir Abba Xpress!</p>
                <p>Comprobante Oficial.</p>
              </div>
            </div>

            {/* Footer de Acciones */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-2 no-print">
              <button
                onClick={() => setTicketData(null)}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={enviarWhatsAppImagen}
                className="w-1/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                title="Enviar imagen por WhatsApp"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button
                onClick={imprimirTicket}
                className="w-1/3 py-2.5 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}