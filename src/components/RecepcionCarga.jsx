import React, { useState, useEffect } from 'react';
import { 
  PackagePlus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Building,
  User,
  Plane,
  Ship,
  Box,
  CreditCard,
  Printer,
  MessageCircle,
  X,
  FileSpreadsheet,
  Download,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { useAuth } from '../context/AuthContext';
import { clienteService } from '../services/clienteService';
import { proformaService } from '../services/proformaService';
import api from '../services/api';

export default function RecepcionCarga() {
  const { usuario } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState('');
  const [sucursalDestinoId, setSucursalDestinoId] = useState('');
  const [clienteActual, setClienteActual] = useState(null);

  const [configGlobal, setConfigGlobal] = useState({
    tipoCambioNIO: 36.6243,
    tarifaAereoGeneral: 7.00,
    tarifaMaritimoGeneral: 4.00,
    tarifaCelularFija: 35.00,
    tarifaTvMaritimo: 3.50,
    tarifaTvAereo: 7.50,
  });

  const [acordeonCliente, setAcordeonCliente] = useState(true);
  const [acordeonPaquetes, setAcordeonPaquetes] = useState(true);

  const [cargoDelivery, setCargoDelivery] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [tipoCambio, setTipoCambio] = useState(36.6243);
  const [metodoPago, setMetodoPago] = useState('CREDITO');

  const [paquetes, setPaquetes] = useState([
    {
      id: Date.now(),
      tracking: '',
      label: '',
      pesoLbs: 1,
      viaEnvio: 'AEREO',
      categoria: 'GENERAL',
      tarifaUnitario: 7.00
    }
  ]);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [ticketData, setTicketData] = useState(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const [clientesData, sucursalesRes, configRes] = await Promise.all([
        clienteService.obtenerTodos(),
        api.get('/sucursales'),
        api.get('/configuracion')
      ]);

      setClientes(clientesData);
      setSucursales(sucursalesRes.data || []);

      if (clientesData.length > 0) {
        setClienteSeleccionadoId(clientesData[0].id);
        setClienteActual(clientesData[0]);
        aplicarReglaDestino(clientesData[0], sucursalesRes.data || []);
      }

      if (configRes.data) {
        setConfigGlobal(configRes.data);
        setTipoCambio(configRes.data.tipoCambioNIO || 36.6243);
        setPaquetes(prev => prev.map(p => ({
          ...p,
          tarifaUnitario: configRes.data.tarifaAereoGeneral || 7.00
        })));
      }
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  const aplicarReglaDestino = (cliente, listaSucursales) => {
    if (!cliente || !listaSucursales) return;
    if (cliente.tipoCliente === 'SUCURSAL_B2B') {
      const sucLeon = listaSucursales.find(s => s.id === 3);
      setSucursalDestinoId(sucLeon ? sucLeon.id : 3);
    } else {
      setSucursalDestinoId(usuario?.sucursalId || 1);
    }
  };

  const handleCambioCliente = (e) => {
    const id = parseInt(e.target.value);
    setClienteSeleccionadoId(id);
    const encontrado = clientes.find((c) => c.id === id);
    setClienteActual(encontrado || null);
    aplicarReglaDestino(encontrado, sucursales);

    if (encontrado) {
      setPaquetes(prev => prev.map(p => {
        let nuevaTarifa = p.tarifaUnitario;
        if (p.categoria === 'GENERAL' || p.categoria === 'PALLET') {
          nuevaTarifa = p.viaEnvio === 'MARITIMO' ? encontrado.tarifaMaritimo : encontrado.tarifaAereo;
        }
        return { ...p, tarifaUnitario: nuevaTarifa };
      }));
    }
  };

  // ✅ 1. DESCARGAR PLANTILLA EXCEL DE EJEMPLO
  const descargarPlantillaExcel = () => {
    const dataEjemplo = [
      {
        Tracking: 'TBA1020304050',
        Label: 'Ropa y Zapatos',
        PesoLbs: 4.5,
        ViaEnvio: 'AEREO',
        Categoria: 'GENERAL',
        TarifaUnitario: clienteActual ? clienteActual.tarifaAereo : 7.00
      },
      {
        Tracking: '1Z9999999999',
        Label: 'Smart TV 55"',
        PesoLbs: 32.0,
        ViaEnvio: 'MARITIMO',
        Categoria: 'SMART_TV',
        TarifaUnitario: 3.50
      },
      {
        Tracking: '940011120202',
        Label: 'iPhone 15 Pro',
        PesoLbs: 1.0,
        ViaEnvio: 'AEREO',
        Categoria: 'CELULAR',
        TarifaUnitario: 35.00
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(dataEjemplo);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PlantillaCarga');
    XLSX.writeFile(workbook, 'Plantilla_Ingreso_Carga_AbbaXpress.xlsx');
  };

  // ✅ 2. LEER E IMPORTAR EXCEL MASIVO
  const handleImportarExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          alert('El archivo Excel no contiene datos válidos.');
          return;
        }

        const paquetesCargados = json.map((row, idx) => {
          const via = (row.ViaEnvio || row.viaEnvio || 'AEREO').toString().toUpperCase().trim();
          const cat = (row.Categoria || row.categoria || 'GENERAL').toString().toUpperCase().trim();
          
          let tarifaSugerida = parseFloat(row.TarifaUnitario || row.tarifaUnitario);
          if (isNaN(tarifaSugerida) || tarifaSugerida <= 0) {
            tarifaSugerida = clienteActual 
              ? (via === 'MARITIMO' ? clienteActual.tarifaMaritimo : clienteActual.tarifaAereo)
              : (via === 'MARITIMO' ? configGlobal.tarifaMaritimoGeneral : configGlobal.tarifaAereoGeneral);
          }

          return {
            id: Date.now() + idx,
            tracking: (row.Tracking || row.tracking || '').toString().trim(),
            label: (row.Label || row.label || '').toString().trim(),
            pesoLbs: parseFloat(row.PesoLbs || row.pesoLbs) || 1,
            viaEnvio: via === 'MARITIMO' ? 'MARITIMO' : 'AEREO',
            categoria: ['GENERAL', 'SMART_TV', 'CELULAR', 'PALLET'].includes(cat) ? cat : 'GENERAL',
            tarifaUnitario: tarifaSugerida
          };
        });

        setPaquetes(paquetesCargados);
        setMensaje({ tipo: 'exito', texto: `Se importaron ${paquetesCargados.length} paquetes desde el archivo Excel.` });
      } catch (err) {
        console.error('Error al procesar Excel:', err);
        alert('Ocurrió un error al leer el archivo de Excel. Asegúrate de usar la plantilla estándar.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // Resetear input
  };

  const agregarPaquete = () => {
    let tarifaSugerida = configGlobal.tarifaAereoGeneral;
    if (clienteActual) {
      tarifaSugerida = clienteActual.tarifaAereo;
    }

    setPaquetes([
      ...paquetes,
      {
        id: Date.now(),
        tracking: '',
        label: '',
        pesoLbs: 1,
        viaEnvio: 'AEREO',
        categoria: 'GENERAL',
        tarifaUnitario: tarifaSugerida
      }
    ]);
  };

  const eliminarPaquete = (id) => {
    if (paquetes.length === 1) return;
    setPaquetes(paquetes.filter((p) => p.id !== id));
  };

  const actualizarPaquete = (id, campo, valor) => {
    setPaquetes(
      paquetes.map((p) => {
        if (p.id !== id) return p;

        const actualizado = { ...p, [campo]: valor };

        if (campo === 'categoria' || campo === 'viaEnvio') {
          if (actualizado.categoria === 'CELULAR') {
            actualizado.tarifaUnitario = configGlobal.tarifaCelularFija;
          } else if (actualizado.categoria === 'SMART_TV') {
            actualizado.tarifaUnitario = actualizado.viaEnvio === 'MARITIMO' ? configGlobal.tarifaTvMaritimo : configGlobal.tarifaTvAereo;
          } else {
            actualizado.tarifaUnitario = clienteActual
              ? (actualizado.viaEnvio === 'MARITIMO' ? clienteActual.tarifaMaritimo : clienteActual.tarifaAereo)
              : (actualizado.viaEnvio === 'MARITIMO' ? configGlobal.tarifaMaritimoGeneral : configGlobal.tarifaAereoGeneral);
          }
        }

        return actualizado;
      })
    );
  };

  const calcularSubtotalPaquete = (pkg) => {
    const peso = parseFloat(pkg.pesoLbs) || 0;
    const tarifa = parseFloat(pkg.tarifaUnitario) || 0;
    if (pkg.categoria === 'CELULAR') return tarifa;
    return peso * tarifa;
  };

  const subtotalPaquetesUSD = paquetes.reduce((acc, p) => acc + calcularSubtotalPaquete(p), 0);
  const totalLibras = paquetes.reduce((acc, p) => acc + (parseFloat(p.pesoLbs) || 0), 0);
  const totalCobradoUSD = Math.max(0, subtotalPaquetesUSD + (parseFloat(cargoDelivery) || 0) - (parseFloat(descuento) || 0));
  const totalCobradoNIO = totalCobradoUSD * (parseFloat(tipoCambio) || 36.6243);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    const payload = {
      clienteId: parseInt(clienteSeleccionadoId),
      sucursalDestinoId: clienteActual?.tipoCliente === 'SUCURSAL_B2B' ? parseInt(sucursalDestinoId) : (usuario?.sucursalId || 3),
      cargoDeliveryUSD: parseFloat(cargoDelivery) || 0,
      descuentoUSD: parseFloat(descuento) || 0,
      tipoCambio: parseFloat(tipoCambio) || configGlobal.tipoCambioNIO,
      metodoPago: metodoPago,
      paquetes: paquetes.map((p) => ({
        tracking: p.tracking || `TRK-${Date.now().toString().slice(-6)}`,
        label: p.label,
        pesoLbs: parseFloat(p.pesoLbs) || 0,
        viaEnvio: p.viaEnvio,
        categoria: p.categoria,
        tarifaManual: parseFloat(p.tarifaUnitario) || 0
      }))
    };

    try {
      const res = await proformaService.crear(payload);
      const numeroGenerado = res?.numero || res?.data?.numero || 'ABBA-1007';

      setTicketData({
        numeroProforma: numeroGenerado,
        fecha: new Date().toLocaleString(),
        clienteNombre: clienteActual?.nombre || 'Cliente General',
        clienteTelefono: clienteActual?.telefono || '',
        usuarioNombre: usuario?.nombre || 'Operador',
        sucursalNombre: usuario?.sucursalNombre || 'Sede Central',
        metodoPago: metodoPago,
        cargoDelivery: parseFloat(cargoDelivery) || 0,
        descuento: parseFloat(descuento) || 0,
        tipoCambioAplicado: parseFloat(tipoCambio) || configGlobal.tipoCambioNIO,
        totalLibras,
        totalUSD: totalCobradoUSD,
        totalNIO: totalCobradoNIO,
        paquetes: paquetes.map(p => ({
          ...p,
          subtotal: calcularSubtotalPaquete(p)
        }))
      });

      setMensaje({ tipo: 'exito', texto: `Carga procesada con éxito. Proforma: ${numeroGenerado}` });
      setPaquetes([
        {
          id: Date.now(),
          tracking: '',
          label: '',
          pesoLbs: 1,
          viaEnvio: 'AEREO',
          categoria: 'GENERAL',
          tarifaUnitario: clienteActual ? clienteActual.tarifaAereo : configGlobal.tarifaAereoGeneral
        }
      ]);
      setCargoDelivery(0);
      setDescuento(0);
    } catch (error) {
      console.error('Error detallado:', error);
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || error.message || 'Error al guardar la carga'
      });
    } finally {
      setGuardando(false);
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
      link.download = `Proforma_${ticketData.numeroProforma}.png`;
      link.href = dataUrl;
      link.click();

      const codigoPais = clienteActual?.codigoPais || '+505';
      const telefonoSolo = (ticketData.clienteTelefono || '').replace(/[^0-9]/g, '');
      const telefonoLimpio = `${codigoPais.replace(/[^0-9]/g, '')}${telefonoSolo}`;
      const texto = encodeURIComponent(`Hola *${ticketData.clienteNombre}*, adjunto la imagen del comprobante de su carga #${ticketData.numeroProforma} por un valor total de $${ticketData.totalUSD.toFixed(2)} USD (C$ ${ticketData.totalNIO.toFixed(2)} NIO). Gracias por su preferencia.`);
      
      window.open(`https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${texto}`, '_blank');
    } catch (err) {
      console.error('Error al generar la imagen para WhatsApp:', err);
      alert('No se pudo generar la imagen del ticket automáticamente.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-brand" />
            Recepción e Ingreso de Carga
          </h1>
          <p className="text-xs text-slate-500">
            Registro multipaquete, carga masiva desde Excel y liquidación
          </p>
        </div>

        {/* Botones de Excel */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={descargarPlantillaExcel}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Descargar archivo modelo .xlsx"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Plantilla Excel</span>
          </button>

          <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm">
            <Upload className="w-4 h-4" />
            <span>Cargar Excel</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleImportarExcel}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Acordeón 1: Cliente y Configuración Base */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setAcordeonCliente(!acordeonCliente)}
            className="w-full flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 transition border-b border-slate-100 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-display">1</span>
              <span>Información del Cliente y Liquidación</span>
            </div>
            {acordeonCliente ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {acordeonCliente && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              
              <div className={clienteActual?.tipoCliente === 'SUCURSAL_B2B' ? '' : 'lg:col-span-2'}>
                <label className="block text-slate-600 font-semibold mb-1">Cliente Consignatario</label>
                <div className="relative flex items-center">
                  {clienteActual?.tipoCliente === 'SUCURSAL_B2B' ? (
                    <Building className="w-4 h-4 text-slate-400 absolute left-3" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400 absolute left-3" />
                  )}
                  <select
                    value={clienteSeleccionadoId}
                    onChange={handleCambioCliente}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 font-medium text-slate-800 focus:outline-none focus:border-brand"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.tipoCliente === 'SUCURSAL_B2B' ? 'Mayorista B2B' : 'Cliente Final'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {clienteActual?.tipoCliente === 'SUCURSAL_B2B' && (
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Sucursal Destino (B2B)</label>
                  <div className="relative flex items-center">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3" />
                    <select
                      value={sucursalDestinoId}
                      onChange={(e) => setSucursalDestinoId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 font-bold text-slate-800 focus:outline-none focus:border-brand"
                    >
                      {sucursales.filter(s => s.id === 3).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({s.ciudad})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Método de Facturación</label>
                <div className="relative flex items-center">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3" />
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 font-medium text-slate-800 focus:outline-none focus:border-brand"
                  >
                    <option value="CREDITO">Pendiente de Cobro (Crédito)</option>
                    <option value="EFECTIVO_USD">Efectivo ($ USD)</option>
                    <option value="EFECTIVO_NIO">Efectivo (C$ NIO)</option>
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="POS">Tarjeta / POS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Cargo Delivery ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cargoDelivery}
                  onChange={(e) => setCargoDelivery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-brand"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </div>

        {/* Acordeón 2: Paquetes Dinámicos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setAcordeonPaquetes(!acordeonPaquetes)}
            className="w-full flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 transition border-b border-slate-100 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-display">2</span>
              <span>Detalle Multipaquete ({paquetes.length} {paquetes.length === 1 ? 'ítem' : 'ítems'})</span>
            </div>
            {acordeonPaquetes ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {acordeonPaquetes && (
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                {paquetes.map((pkg) => (
                  <div 
                    key={pkg.id} 
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center text-xs"
                  >
                    <div className="lg:col-span-3">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tracking #</label>
                      <input
                        type="text"
                        placeholder="Ej. TBA123456789"
                        value={pkg.tracking}
                        onChange={(e) => actualizarPaquete(pkg.id, 'tracking', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-semibold text-slate-800"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Rótulo / Label</label>
                      <input
                        type="text"
                        placeholder="Ej. Zapatos, Ropa"
                        value={pkg.label}
                        onChange={(e) => actualizarPaquete(pkg.id, 'label', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Categoría</label>
                      <div className="relative flex items-center">
                        <Box className="w-4 h-4 text-slate-400 absolute left-2" />
                        <select
                          value={pkg.categoria}
                          onChange={(e) => actualizarPaquete(pkg.id, 'categoria', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-8 pr-2 font-medium text-slate-800"
                        >
                          <option value="GENERAL">Paquete General</option>
                          <option value="SMART_TV">Smart TV</option>
                          <option value="CELULAR">Celular</option>
                          <option value="PALLET">Pallet Especial</option>
                        </select>
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Vía</label>
                      <div className="relative flex items-center">
                        {pkg.viaEnvio === 'AEREO' ? <Plane className="w-4 h-4 text-slate-400 absolute left-2" /> : <Ship className="w-4 h-4 text-slate-400 absolute left-2" />}
                        <select
                          value={pkg.viaEnvio}
                          onChange={(e) => actualizarPaquete(pkg.id, 'viaEnvio', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-8 pr-2 font-medium text-slate-800"
                        >
                          <option value="AEREO">Aéreo</option>
                          <option value="MARITIMO">Marítimo</option>
                        </select>
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Peso (Lbs)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={pkg.pesoLbs}
                        onChange={(e) => actualizarPaquete(pkg.id, 'pesoLbs', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800 text-center"
                      />
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tarifa ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pkg.tarifaUnitario}
                        onChange={(e) => actualizarPaquete(pkg.id, 'tarifaUnitario', e.target.value)}
                        className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 font-bold text-amber-900 text-center"
                      />
                    </div>

                    <div className="lg:col-span-1 text-right">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Subtotal</label>
                      <div className="text-xs font-bold font-display text-slate-900">
                        ${calcularSubtotalPaquete(pkg).toFixed(2)}
                      </div>
                    </div>

                    <div className="lg:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => eliminarPaquete(pkg.id)}
                        disabled={paquetes.length === 1}
                        className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 transition cursor-pointer"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={agregarPaquete}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-brand text-slate-600 hover:text-brand rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Agregar Otro Paquete a esta Carga</span>
              </button>
            </div>
          )}
        </div>

        {/* Resumen Multimoneda y Botón de Procesamiento */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-center md:text-left">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Peso</p>
              <p className="text-2xl font-black font-display text-white">{totalLibras.toFixed(2)} <span className="text-sm font-normal text-slate-400">lbs</span></p>
            </div>
            <div className="border-l border-slate-700 pl-6 sm:pl-10">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Dólares</p>
              <p className="text-2xl font-black font-display text-emerald-400">${totalCobradoUSD.toFixed(2)} <span className="text-sm font-normal text-slate-400">USD</span></p>
            </div>
            <div className="border-l border-slate-700 pl-6 sm:pl-10">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Córdobas</p>
              <p className="text-2xl font-black font-display text-brand-300">C$ {totalCobradoNIO.toFixed(2)} <span className="text-sm font-normal text-slate-400">NIO</span></p>
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full md:w-auto px-8 py-4 bg-brand hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{guardando ? 'Guardando...' : 'Guardar y Procesar Carga'}</span>
          </button>
        </div>

      </form>

      {/* Modal Ticket */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body * { visibility: hidden; }
              #ticket-termico-impresion, #ticket-termico-impresion * {
                visibility: visible; color: #000 !important; font-family: 'Courier New', monospace !important; font-weight: 700 !important;
              }
              #ticket-termico-impresion { position: absolute; left: 0; top: 0; width: 74mm; padding: 1mm 2mm; background: #fff !important; font-size: 12px !important; display: block !important; }
              #ticket-digital-pantalla, .no-print { display: none !important; }
            }
            @media screen { #ticket-termico-impresion { display: none !important; } }
          `}} />

          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print">
              <h3 className="font-bold font-display text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-brand" /> Ticket Generado con Éxito
              </h3>
              <button onClick={() => setTicketData(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-800 space-y-3 bg-slate-50" id="ticket-digital-pantalla">
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
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
              </div>

              <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                <p className="font-bold text-[10px] uppercase text-slate-500">Detalle de Paquetes ({ticketData.paquetes.length})</p>
                {ticketData.paquetes.map((p, idx) => (
                  <div key={idx} className="text-[11px] space-y-0.5 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{p.tracking || 'TRK-GEN'}</span>
                      <span className="text-emerald-600">${p.subtotal.toFixed(2)} USD</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-right bg-slate-900 text-white p-3 rounded-xl">
                <p className="text-sm font-black font-display text-emerald-400">TOTAL: ${ticketData.totalUSD.toFixed(2)} USD</p>
                <p className="text-xs font-black font-display text-brand-300">TOTAL NIO: C$ {ticketData.totalNIO.toFixed(2)} NIO</p>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex gap-2 no-print">
              <button onClick={() => setTicketData(null)} className="w-1/3 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">Cerrar</button>
              <button onClick={enviarWhatsAppImagen} className="w-1/3 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
              <button onClick={imprimirTicket} className="w-1/3 py-2.5 bg-brand text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"><Printer className="w-4 h-4" /> Imprimir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}