import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Search, 
  Tag, 
  CheckSquare, 
  Square, 
  FileSpreadsheet, 
  PackageCheck
} from 'lucide-react';
import Barcode from 'react-barcode';
import { proformaService } from '../services/proformaService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface Paquete {
  id: number | string;
  tracking: string;
  label?: string;
  viaEnvio: string;
  pesoLbs: number;
}

export interface Proforma {
  id: number | string;
  numeroProforma: string;
  clienteNombre: string;
  clienteTelefono: string;
  sucursalDestino: string;
  fechaRegistro: string;
  estado: string;
  paquetes: Paquete[];
}

export interface PaquetePlano extends Paquete {
  proformaNumero: string;
  proformaId: number | string;
  clienteNombre: string;
  clienteTelefono: string;
  sucursalDestino: string;
  fecha: string;
}

export default function ImpresionRotulos() {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [seleccionados, setSeleccionados] = useState<(number | string)[]>([]);
  const [vistaManifiesto, setVistaManifiesto] = useState<boolean>(false);
  const [despachando, setDespachando] = useState<boolean>(false);
  const { usuario } = useAuth();

  const esLeon = usuario?.sucursalId === 3;

  useEffect(() => {
    cargarCargas();
  }, []);

  const cargarCargas = async () => {
    setCargando(true);
    try {
      const data = await proformaService.obtenerTodas({ 
        busqueda,
        estado: 'PENDIENTE_PAGO',
        sucursalOrigenId: usuario?.sucursalId 
      });
      setProformas(data || []);
    } catch (e) {
      console.error('Error al cargar cargas:', e);
    } finally {
      setCargando(false);
    }
  };

  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    cargarCargas();
  };

  const todosLosPaquetes: PaquetePlano[] = proformas.flatMap((p) =>
    p.paquetes.map((pkg) => ({
      ...pkg,
      proformaId: p.id,
      proformaNumero: p.numeroProforma,
      clienteNombre: p.clienteNombre,
      clienteTelefono: p.clienteTelefono,
      sucursalDestino: p.sucursalDestino,
      fecha: p.fechaRegistro
    }))
  );

  const paquetesFiltrados = todosLosPaquetes.filter((pkg) => {
    const coincideBusqueda = 
      pkg.tracking.toLowerCase().includes(busqueda.toLowerCase()) ||
      pkg.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      pkg.proformaNumero.toLowerCase().includes(busqueda.toLowerCase()) ||
      (pkg.label && pkg.label.toLowerCase().includes(busqueda.toLowerCase()));

    if (vistaManifiesto && !esLeon) {
      return coincideBusqueda && pkg.sucursalDestino.toLowerCase().includes('león');
    }

    return coincideBusqueda;
  });

  const toggleSeleccion = (id: number | string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const seleccionarTodos = () => {
    if (seleccionados.length === paquetesFiltrados.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(paquetesFiltrados.map((p) => p.id));
    }
  };

  const paquetesParaImprimir = paquetesFiltrados.filter((p) =>
    seleccionados.includes(p.id)
  );

  const handleImprimir = () => {
    window.print();
  };

  const handleDespacharRutaLeon = async () => {
    if (esLeon) return;

    const proformasIdsADespachar = [
      ...new Set(
        paquetesFiltrados
          .filter((pkg) => seleccionados.includes(pkg.id) && pkg.sucursalDestino.toLowerCase().includes('león'))
          .map((pkg) => pkg.proformaId)
      )
    ];

    if (proformasIdsADespachar.length === 0) {
      alert('Debe seleccionar al menos un paquete con destino a la Sucursal de León para despachar.');
      return;
    }

    setDespachando(true);
    try {
      await api.put('/proformas/despachar-lote', proformasIdsADespachar);
      alert('Manifiesto despachado con éxito.');
      setSeleccionados([]);
      await cargarCargas();
    } catch (e) {
      alert('Error al procesar el despacho de manifiesto.');
    } finally {
      setDespachando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Estilos CSS estrictos para aislar la impresión térmica */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 100mm 150mm; /* Formato estándar de viñeta térmica 4x6" */
            margin: 0;
          }
          body {
            background: #ffffff !important;
          }
          .seccion-impresion-termica {
            display: block !important;
          }
        }
      `}} />

      {/* SECCIÓN PANTALLA: Filtros y Acciones */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
              <Tag className="w-6 h-6 text-brand" />
              Impresión de Rótulos & Manifiestos
            </h1>
            <p className="text-xs text-slate-500">
              {esLeon 
                ? 'Generación de viñetas térmicas por bulto para entregas locales' 
                : 'Generación de viñetas térmicas por bulto y despacho inter-sucursal'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!esLeon && (
              <button
                onClick={() => {
                  setVistaManifiesto(!vistaManifiesto);
                  setSeleccionados([]);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  vistaManifiesto
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{vistaManifiesto ? 'Modo Viñetas' : 'Modo Hoja de Manifiesto (León)'}</span>
              </button>
            )}

            <button
              disabled={seleccionados.length === 0}
              onClick={handleImprimir}
              className="px-5 py-2 bg-brand hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Seleccionados ({seleccionados.length})</span>
            </button>
          </div>
        </div>

        {/* Buscador y Selección Rápida */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <button
            onClick={seleccionarTodos}
            className="flex items-center gap-2 font-bold text-slate-700 hover:text-brand cursor-pointer"
          >
            {seleccionados.length === paquetesFiltrados.length && paquetesFiltrados.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-brand" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Seleccionar Todo el Lote ({paquetesFiltrados.length})</span>
          </button>

          <form onSubmit={handleBuscar} className="w-full md:w-80 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Buscar tracking, cliente o proforma..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-brand font-medium"
            />
          </form>
        </div>

        {/* Tabla Operativa */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">Sel.</th>
                <th className="py-3 px-4">Tracking / Viñeta</th>
                <th className="py-3 px-4">Cliente Consignatario</th>
                <th className="py-3 px-4">Rótulo / Descripción</th>
                <th className="py-3 px-4 text-center">Vía</th>
                <th className="py-3 px-4 text-center">Peso</th>
                <th className="py-3 px-4">Destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Cargando paquetes en bodega...
                  </td>
                </tr>
              ) : paquetesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No hay paquetes pendientes de despacho o rotulación.
                  </td>
                </tr>
              ) : (
                paquetesFiltrados.map((pkg) => (
                  <tr 
                    key={pkg.id} 
                    onClick={() => toggleSeleccion(pkg.id)}
                    className={`hover:bg-slate-50/80 transition cursor-pointer ${
                      seleccionados.includes(pkg.id) ? 'bg-brand/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      {seleccionados.includes(pkg.id) ? (
                        <CheckSquare className="w-4 h-4 text-brand mx-auto" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-brand">
                      {pkg.tracking}
                      <div className="text-[10px] text-slate-400 font-sans">{pkg.proformaNumero}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {pkg.clienteNombre}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {pkg.label || 'Paquete General'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pkg.viaEnvio === 'AEREO' ? 'bg-blue-100 text-blue-700' : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {pkg.viaEnvio}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-display text-slate-900">
                      {pkg.pesoLbs.toFixed(2)} lbs
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {pkg.sucursalDestino}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN IMPRESIÓN */}
      {vistaManifiesto && !esLeon ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-300 shadow-sm space-y-6 text-xs text-slate-900 print:border-none print:shadow-none print:p-0">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <img src="/Logo.png" alt="Logo" className="w-12 h-auto object-contain" />
              <div>
                <h2 className="text-xl font-black font-display tracking-tight">ABBA XPRESS - MANIFIESTO DE DESPACHO EN RUTA</h2>
                <p className="text-[11px] text-slate-500 font-medium">Control de Custodia y Traslado Inter-Sucursal (Managua - León)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold">FECHA: {new Date().toLocaleDateString()}</p>
              <p className="font-mono text-slate-500">TOTAL BULTOS: {paquetesParaImprimir.length}</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">#</th>
                <th className="p-2 border-r border-slate-300">Proforma</th>
                <th className="p-2 border-r border-slate-300">Tracking</th>
                <th className="p-2 border-r border-slate-300">Cliente</th>
                <th className="p-2 border-r border-slate-300">Rótulo</th>
                <th className="p-2 border-r border-slate-300 text-center">Vía</th>
                <th className="p-2 border-r border-slate-300 text-center">Peso (lbs)</th>
                <th className="p-2 text-center">Firma Recibido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paquetesParaImprimir.map((pkg, i) => (
                <tr key={pkg.id}>
                  <td className="p-2 border-r border-slate-200 font-mono">{i + 1}</td>
                  <td className="p-2 border-r border-slate-200 font-mono font-bold">{pkg.proformaNumero}</td>
                  <td className="p-2 border-r border-slate-200 font-mono">{pkg.tracking}</td>
                  <td className="p-2 border-r border-slate-200 font-bold">{pkg.clienteNombre}</td>
                  <td className="p-2 border-r border-slate-200">{pkg.label || '-'}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-bold">{pkg.viaEnvio}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-bold">{pkg.pesoLbs.toFixed(2)}</td>
                  <td className="p-2 border-slate-200 text-center w-28"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-12 pt-12 text-center text-xs">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">Despachado por (Bodega Managua)</p>
              <p className="text-[10px] text-slate-500">Nombre, Firma y Sello</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">Recibido Conforme (Sucursal Destino León)</p>
              <p className="text-[10px] text-slate-500">Nombre, Firma y Sello</p>
            </div>
          </div>

          <div className="print:hidden pt-4 flex justify-end">
            <button
              disabled={despachando || paquetesParaImprimir.length === 0}
              onClick={handleDespacharRutaLeon}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{despachando ? 'Procesando...' : 'Confirmar Salida en Ruta (Cambiar Estado)'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* VIÑETAS TÉRMICAS PROFESIONALES CON CÓDIGO DE BARRAS */
        <div className="hidden seccion-impresion-termica print:block">
          {paquetesParaImprimir.map((pkg) => (
            <div 
              key={pkg.id} 
              className="w-full max-w-[95mm] mx-auto p-4 border border-black rounded-xl bg-white space-y-3 text-black font-sans"
              style={{ pageBreakAfter: 'always', margin: '0 auto', boxSizing: 'border-box' }}
            >
              {/* Header de Viñeta */}
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <div className="flex items-center gap-2">
                  <img src="/Logo.png" alt="Logo" className="w-8 h-auto object-contain" />
                  <span className="font-display font-black text-base">ABBA XPRESS</span>
                </div>
                <span className="px-2 py-0.5 border border-black font-black text-xs uppercase">
                  {pkg.viaEnvio}
                </span>
              </div>

              {/* Destino y Cliente */}
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-600 block">Destino:</span>
                <div className="text-lg font-black leading-tight">{pkg.sucursalDestino}</div>
                <div className="text-xs font-bold pt-1">{pkg.clienteNombre}</div>
                <div className="text-[11px] font-mono">{pkg.clienteTelefono}</div>
              </div>

              {/* Datos de Carga */}
              <div className="p-2 border border-black rounded-lg grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold block text-slate-600">Rótulo / Contenido</span>
                  <span className="font-bold truncate block">{pkg.label || 'GENERAL'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold block text-slate-600">Peso</span>
                  <span className="font-black text-sm">{pkg.pesoLbs.toFixed(2)} lbs</span>
                </div>
              </div>

              {/* Código de Barras Real y Tracking */}
              <div className="text-center pt-1 border-t-2 border-black flex flex-col items-center justify-center">
                <Barcode 
                  value={pkg.tracking} 
                  format="CODE128" 
                  width={1.6} 
                  height={45} 
                  fontSize={12}
                  margin={4}
                  displayValue={true}
                />
                <div className="text-[9px] font-mono mt-0.5">
                  Proforma: #{pkg.proformaNumero} • {new Date(pkg.fecha).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}