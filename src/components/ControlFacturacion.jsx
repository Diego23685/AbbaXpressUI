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
  ChevronLeft, 
  ChevronRight,
  Check
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
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('EFECTIVO_NIO');
  const [proformaExpandida, setProformaExpandida] = useState(null);

  // Parámetros de cobro en ventanilla
  const [cargoDeliveryCobro, setCargoDeliveryCobro] = useState(0);
  const [montoEfectivoRecibido, setMontoEfectivoRecibido] = useState('');
  const [comisionPOS, setComisionPOS] = useState(4.5);
  const [monedaCobro, setMonedaCobro] = useState('NIO');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const REGISTROS_POR_PAGINA = 10;

  // Estado para el ticket / comprobante
  const [ticketData, setTicketData] = useState(null);

  const esLeon = usuario?.sucursalId === 3;

  // Cálculos dinámicos de caja
  const totalBaseUSD = modalLiquidacion ? modalLiquidacion.totalCobradoUSD : 0;
  const totalFinalUSD = totalBaseUSD + (parseFloat(cargoDeliveryCobro) || 0);
  const totalPagarNIO = totalFinalUSD * tipoCambioOficial;

  const totalEsperadoMoneda = monedaCobro === 'NIO' ? totalPagarNIO : totalFinalUSD;
  const vueltoCalculado = (parseFloat(montoEfectivoRecibido) || 0) - totalEsperadoMoneda;

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEstado, busqueda]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const estadoConsulta = filtroEstado === 'PENDIENTE_PAGO' 
        ? 'PENDIENTE_PAGO,RECIBIDO_BODEGA_LOCAL' 
        : filtroEstado;

      const [listado, datosResumen, configRes] = await Promise.all([
        proformaService.obtenerTodas({ estado: estadoConsulta, busqueda }),
        proformaService.obtenerResumenCobros(),
        api.get('/configuracion')
      ]);
      setProformas(listado || []);
      setResumen(datosResumen || { totalPorCobrarUSD: 0, totalFacturadoUSD: 0, totalLibrasPendientes: 0, cantidadPendientes: 0 });
      if (configRes.data?.tipoCambioNIO) {
        setTipoCambioOficial(configRes.data.tipoCambioNIO);
      }
    } catch (error) {
      console.error('Error al cargar datos de facturación:', error);
    } finally {
      setTimeout(() => setCargando(false), 120);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const totalPaginas = Math.ceil(proformas.length / REGISTROS_POR_PAGINA) || 1;
  const proformasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    return proformas.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [proformas, paginaActual]);

  const toggleExpandir = (id) => {
    setProformaExpandida(proformaExpandida === id ? null : id);
  };

  const dispararWhatsApp = (p) => {
    const telefonoLimpio = (p.clienteTelefono || '').replace(/[^0-9]/g, '');
    const esCargaLeon = p.sucursalDestino?.toLowerCase().includes('león') || usuario?.sucursalId === 3;

    const direccionSucursal = esCargaLeon 
      ? `🏢 *LEÓN:* De la estatua de la madre 1c y media al norte.`
      : `🏢 *MANAGUA – BOLONIA:* Rotonda El Güegüense, 4 cuadras abajo, 1 cuadra al norte y media cuadra arriba. Plaza Kamelu, módulo número 2.\n🏢 *CIUDAD EL DORAL:* Avenida 15, calle 4, módulo P-14.`;

    const mensaje = 
`📦 *¡Tu paquete ya está listo para entrega!*
¡Hola, *${p.clienteNombre}*! 👋🏼
Nos complace informarte que tu envío ya se encuentra disponible para retiro en ABBA Xpress. 📦✈️🚢

💳 *MÉTODOS DE PAGO*
Puedes realizar tu pago en efectivo o mediante transferencia bancaria a nuestras cuentas:
🏦 BAC: 367477320
🏦 LAFISE: 131238556
👤 Titular de ambas cuentas: Junior Evaristo Ramírez
⚠️ Si realizas una transferencia, presenta tu comprobante de pago al momento de retirar tu paquete.

📍 *NUESTRAS SUCURSALES*
${direccionSucursal}

🚚 *SERVICIO DE DELIVERY*
También contamos con servicio de entrega a domicilio en Managua y envíos hacia los departamentos, con costo adicional.

📌 *NOTAS IMPORTANTES*
* Si tu proveedor dividió tu pedido en varios paquetes, cada uno se registrará según su número de guía y peso correspondiente.
* Te recomendamos retirar tus paquetes oportunamente para evitar inconvenientes con su almacenamiento.
Nota: El cliente dispondrá de 5 días hábiles a partir de esta notificación para retirar su paquete sin cargos por almacenamiento. A partir del sexto día hábil, se aplicará un cargo de US$0.50 por día por cada paquete que permanezca sin retirar.

💙 *¡Gracias por confiar en ABBA Xpress!*
✈️🚢 Tu carga, en buenas manos. Rápido, seguro y sin estrés.`;

    window.open(`https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const abrirTicketExistente = (p) => {
    setTicketData({
      numeroProforma: p.numeroProforma,
      fecha: new Date(p.fechaRegistro).toLocaleString('es-NI', { dateStyle: 'full', timeStyle: 'short' }),
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
      const payload = {
        metodoPago: metodoSeleccionado,
        cargoDeliveryUSD: parseFloat(cargoDeliveryCobro) || 0,
        descuentoUSD: 0,
        porcentajeComisionPOS: metodoSeleccionado === 'POS' ? parseFloat(comisionPOS) || 0 : 0,
        montoRecibidoEfectivo: metodoSeleccionado.startsWith('EFECTIVO') ? parseFloat(montoEfectivoRecibido) || 0 : 0,
        monedaPagoEfectivo: monedaCobro
      };

      await api.put(`/proformas/${modalLiquidacion.id}/liquidar`, payload);
      
      const proformaCobrada = modalLiquidacion;
      setModalLiquidacion(null);
      setCargoDeliveryCobro(0);
      setMontoEfectivoRecibido('');

      setTicketData({
        numeroProforma: proformaCobrada.numeroProforma,
        fecha: new Date().toLocaleString('es-NI', { dateStyle: 'full', timeStyle: 'short' }),
        clienteNombre: proformaCobrada.clienteNombre,
        clienteTelefono: proformaCobrada.clienteTelefono || '',
        usuarioNombre: usuario?.nombre || 'Operador',
        sucursalNombre: usuario?.sucursalNombre || 'Sede Central',
        metodoPago: metodoSeleccionado,
        cargoDelivery: parseFloat(cargoDeliveryCobro) || 0,
        descuento: 0,
        tipoCambioAplicado: tipoCambioOficial,
        totalLbs: proformaCobrada.totalLbs,
        totalUSD: totalFinalUSD,
        totalNIO: totalPagarNIO,
        paquetes: proformaCobrada.paquetes || []
      });

      cargarDatos();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al liquidar la proforma');
    }
  };

  const imprimirTicket = () => {
    window.print();
  };

  const enviarWhatsAppImagen = async () => {
    const ticketElement = document.getElementById('ticket-digital-pantalla');
    if (!ticketElement) return;

    try {
      const dataUrl = await toPng(ticketElement, { cacheBust: true, pixelRatio: 3, backgroundColor: 'transparent' });
      const link = document.createElement('a');
      link.download = `Comprobante_${ticketData.numeroProforma}.png`;
      link.href = dataUrl;
      link.click();

      const telefonoLimpio = (ticketData.clienteTelefono || '').replace(/[^0-9]/g, '');
      const texto = encodeURIComponent(`Hola *${ticketData.clienteNombre}*, adjunto el comprobante oficial de su carga #${ticketData.numeroProforma} por un valor de $${ticketData.totalUSD.toFixed(2)} USD (C$ ${ticketData.totalNIO.toFixed(2)} NIO). ¡Gracias por su preferencia!`);
      
      window.open(`https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${texto}`, '_blank');
    } catch (err) {
      console.error('Error al generar la imagen para WhatsApp:', err);
      alert('No se pudo generar la imagen del comprobante.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900">
              Cuentas por Cobrar y Facturación
            </h1>
            <p className="text-xs text-slate-500">
              {esLeon 
                ? 'Control de inventario recibido desde Managua y facturación local a clientes de León'
                : 'Control de saldos a crédito, cobros en mostrador y notificaciones por WhatsApp'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
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
          <p className="text-[10px] text-emerald-700/80 mt-1 font-medium">Ingresos liquidados</p>
        </div>

        <div className="bg-brand/10 border border-brand/30 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-brand-700 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Libras en Bodega</span>
            <Truck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black font-display text-brand-900">
            {resumen.totalLibrasPendientes.toFixed(2)} <span className="text-xs font-normal">lbs</span>
          </p>
          <p className="text-[10px] text-brand-700/80 mt-1 font-medium">Carga en inventario local</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">T/C Oficial</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black font-display text-white">
            C$ {tipoCambioOficial.toFixed(4)} <span className="text-xs font-normal text-slate-400">NIO</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">Multimoneda Sincronizada</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFiltroEstado('PENDIENTE_PAGO')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs ${
              filtroEstado === 'PENDIENTE_PAGO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📦 Pendientes & En Bodega
          </button>
          <button
            onClick={() => setFiltroEstado('EN_TRANSITO')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs ${
              filtroEstado === 'EN_TRANSITO' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🚚 En Ruta
          </button>
          <button
            onClick={() => setFiltroEstado('FACTURADO')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs ${
              filtroEstado === 'FACTURADO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Facturados
          </button>
          <button
            onClick={() => setFiltroEstado('')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs ${
              filtroEstado === '' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todos
          </button>
        </div>

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
                <th className="py-3 px-4 text-right">Total ($USD / C$ NIO)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 rounded w-28 ml-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                    <td className="py-4 px-4 text-center"><div className="h-7 bg-slate-200 rounded-xl w-24 mx-auto"></div></td>
                  </tr>
                ))
              ) : proformasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No se encontraron proformas en este estado.
                  </td>
                </tr>
              ) : (
                proformasPaginadas.map((p) => {
                  const esRemisionMayoristaManagua = esLeon && p.sucursalOrigen !== 'Sucursal León';

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-brand">
                          <button
                            onClick={() => toggleExpandir(p.id)}
                            className="flex items-center gap-1.5 hover:underline cursor-pointer text-left group"
                          >
                            <span className="p-0.5 rounded group-hover:bg-brand/10 transition">
                              {proformaExpandida === p.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </span>
                            <span>{p.numeroProforma}</span>
                          </button>
                          <div className="text-[10px] font-normal text-slate-400 font-sans pl-5">
                            {new Date(p.fechaRegistro).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            {p.clienteNombre.includes('León') ? (
                              <Building2 className="w-3.5 h-3.5 text-brand shrink-0" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span>{p.clienteNombre}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{p.clienteTelefono}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">{p.paquetes.length} paquetes</span>
                          <div className="text-[10px] font-bold text-slate-500 font-display">
                            {p.totalLbs.toFixed(2)} lbs
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">{p.sucursalDestino}</td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold font-display text-slate-900">${p.totalCobradoUSD.toFixed(2)} USD</div>
                          <div className="text-[10px] text-slate-400 font-display">C$ {p.totalCobradoNIO.toFixed(2)} NIO</div>
                        </td>

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

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => dispararWhatsApp(p)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 rounded-xl transition cursor-pointer"
                              title="Enviar Notificación por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => abrirTicketExistente(p)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl transition cursor-pointer"
                              title="Ver y Re-imprimir Comprobante"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {(!esLeon || !esRemisionMayoristaManagua) && (
                              p.estado === 'PENDIENTE_PAGO' || p.estado === 'EN_TRANSITO' || p.estado === 'RECIBIDO_BODEGA_LOCAL'
                            ) && (
                              <button
                                onClick={() => setModalLiquidacion(p)}
                                className="px-3.5 py-1.5 bg-brand hover:bg-brand-600 active:scale-95 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer shadow"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Cobrar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {proformaExpandida === p.id && (
                        <tr className="bg-slate-50/90 border-b border-slate-200 animate-in fade-in duration-150">
                          <td colSpan="7" className="p-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
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
                                  <span>Esta carga ingresó por mayoreo desde Managua. Los bultos están listos para facturar a su cliente local de León.</span>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                                {p.paquetes.map((pkg, idx) => (
                                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-mono font-bold text-slate-800">{pkg.tracking}</span>
                                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                                        {pkg.viaEnvio}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 font-medium">
                                      <span className="text-slate-600">{pkg.pesoLbs.toFixed(2)} lb</span>
                                      <span className="font-bold font-display text-slate-900">${pkg.subtotalUSD.toFixed(2)} USD</span>
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

        {/* Paginación */}
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

      {/* Modal de Liquidación */}
      {modalLiquidacion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-sans">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Cobro y Entrega #{modalLiquidacion.numeroProforma}
            </h2>

            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1 border border-slate-200">
              <p className="text-slate-500">Cliente: <strong className="text-slate-800">{modalLiquidacion.clienteNombre}</strong></p>
              <p className="text-slate-500">Subtotal Flete: <strong className="text-slate-900">${totalBaseUSD.toFixed(2)} USD</strong></p>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Cargo de Delivery Final ($ USD):</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={cargoDeliveryCobro}
                onChange={(e) => setCargoDeliveryCobro(e.target.value)}
                placeholder="0.00 (0 si retira en sucursal)"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center font-display">
              <span className="font-bold text-emerald-900 text-xs uppercase">Total Final:</span>
              <span className="text-base font-black text-emerald-800">
                ${totalFinalUSD.toFixed(2)} USD / C$ {totalPagarNIO.toFixed(2)} NIO
              </span>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Método de Pago:</label>
              <select
                value={metodoSeleccionado}
                onChange={(e) => setMetodoSeleccionado(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="EFECTIVO_NIO">🇳🇮 Efectivo Córdobas (C$ NIO)</option>
                <option value="EFECTIVO_USD">💵 Efectivo Dólares ($ USD)</option>
                <option value="TRANSFERENCIA">🏦 Transferencia Bancaria (BAC / LAFISE)</option>
                <option value="POS">💳 Terminal POS (Tarjeta)</option>
              </select>
            </div>

            {metodoSeleccionado.startsWith('EFECTIVO') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-amber-900">Monto Recibido del Cliente:</label>
                  <span className="text-[10px] font-bold text-amber-700 font-mono">
                    {metodoSeleccionado === 'EFECTIVO_NIO' ? 'Córdobas C$' : 'Dólares $'}
                  </span>
                </div>
                <input
                  type="number"
                  step="1"
                  value={montoEfectivoRecibido}
                  onChange={(e) => {
                    setMontoEfectivoRecibido(e.target.value);
                    setMonedaCobro(metodoSeleccionado === 'EFECTIVO_NIO' ? 'NIO' : 'USD');
                  }}
                  placeholder={metodoSeleccionado === 'EFECTIVO_NIO' ? `Ej. ${Math.ceil(totalPagarNIO / 100) * 100}` : `Ej. ${Math.ceil(totalFinalUSD)}`}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 font-bold font-display text-slate-900 focus:outline-none"
                />
                {vueltoCalculado >= 0 && (
                  <div className="flex justify-between items-center text-xs pt-1 font-bold">
                    <span className="text-slate-600">Vuelto a devolver:</span>
                    <span className="text-emerald-700 font-display text-sm font-black">
                      {monedaCobro === 'NIO' ? `C$ ${vueltoCalculado.toFixed(2)} NIO` : `$ ${vueltoCalculado.toFixed(2)} USD`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {metodoSeleccionado === 'POS' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <label className="block text-blue-900 font-bold">Comisión Terminal POS (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={comisionPOS}
                  onChange={(e) => setComisionPOS(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg p-2 font-bold text-blue-900"
                />
                <p className="text-[10px] text-blue-600">Retención banco: ${(totalFinalUSD * (comisionPOS / 100)).toFixed(2)} USD</p>
              </div>
            )}

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
                disabled={metodoSeleccionado.startsWith('EFECTIVO') && vueltoCalculado < 0}
                className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl transition shadow-lg cursor-pointer"
              >
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ticket Digital */}
      {ticketData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-[390px] flex flex-col my-auto max-h-[95vh] overflow-y-auto rounded-[32px] shadow-2xl">
            <div 
              id="ticket-digital-pantalla"
              className="w-full text-white relative font-sans"
              style={{
                background: 'linear-gradient(180deg, #424698 0%, #5157b5 30%, #656cc5 100%)',
                padding: '24px 18px 0px 18px'
              }}
            >
              <div className="flex flex-col items-center justify-center text-center space-y-1 pb-5">
                <h3 className="font-display font-black tracking-wider text-base text-white">ABBA XPRESS</h3>
                <p className="text-[11px] text-brand-100 font-medium">{ticketData.sucursalNombre}</p>
              </div>

              <div className="bg-white rounded-t-[28px] text-slate-800 pt-7 pb-6 px-5 relative shadow-xl">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                  <Check className="w-6 h-6 text-white stroke-[3]" />
                </div>

                <div className="text-center space-y-1 pt-1">
                  <p className="text-[11px] text-slate-400 capitalize font-medium">{ticketData.fecha}</p>
                  <h4 className="text-base font-black text-slate-900 tracking-tight">{ticketData.clienteNombre}</h4>
                  <p className="text-[11px] font-semibold text-slate-500">Comprobante de Entrega & Cobro</p>
                </div>

                <div className="flex items-center justify-center gap-2 py-3.5 my-2 border-y border-slate-100">
                  <span className="px-2 py-0.5 bg-brand-50 text-brand font-black rounded-lg text-xs">$ USD</span>
                  <span className="text-3xl font-black font-sans text-slate-900">{ticketData.totalUSD.toFixed(2)}</span>
                </div>

                <div className="text-center pb-3">
                  <span className="text-[11px] font-bold text-brand bg-brand-50 px-3 py-1 rounded-full border border-brand-100 inline-block">
                    C$ {ticketData.totalNIO.toFixed(2)} NIO (T/C: {ticketData.tipoCambioAplicado.toFixed(4)})
                  </span>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Proforma / Factura:</span>
                    <span className="font-mono font-bold text-brand text-xs">#{ticketData.numeroProforma}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Método de Pago:</span>
                    <span className="font-semibold text-slate-800">{ticketData.metodoPago}</span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                      <span>Bultos ({ticketData.paquetes.length})</span>
                      <span>{ticketData.totalLbs.toFixed(2)} lbs</span>
                    </div>

                    <div className="space-y-1.5">
                      {ticketData.paquetes.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-[11px]">
                          <span className="font-mono font-bold text-slate-900">{p.tracking}</span>
                          <span className="font-black text-slate-900">${(p.subtotalUSD || p.subtotal || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {ticketData.cargoDelivery > 0 && (
                    <div className="flex justify-between items-center text-slate-600 text-[11px] pt-1">
                      <span>Delivery:</span>
                      <span className="font-bold text-slate-900">+${ticketData.cargoDelivery.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 flex gap-2">
              <button
                onClick={() => setTicketData(null)}
                className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={enviarWhatsAppImagen}
                className="w-1/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button
                onClick={imprimirTicket}
                className="w-1/3 py-2.5 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer"
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