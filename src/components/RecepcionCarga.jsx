import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search,
  Library,
  X,
  PackagePlus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Building,
  Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clienteService } from '../services/clienteService';
import { proformaService } from '../services/proformaService';
import api from '../services/api';

const normalizar = (t) =>
  (t ?? '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const LIMITE_RESULTADOS = 50;
const POR_PAGINA = 20;
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

const coincideBusqueda = (c, terminos) => {
  if (terminos.length === 0) return true;
  const telefonoSoloDigitos = (c.telefono ?? '').toString().replace(/\D/g, '');
  const texto = `${normalizar(c.nombre)} ${normalizar(c.tipoCliente)} ${normalizar(c.telefono)} ${telefonoSoloDigitos}`;
  return terminos.every((t) => texto.includes(t));
};

const inicialDe = (c) => {
  const l = normalizar(c.nombre).trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(l) ? l : '#';
};

function BibliotecaClientes({ clientes, clienteActual, onSelect, onClose }) {
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('TODOS');
  const [letra, setLetra] = useState('');
  const [pagina, setPagina] = useState(0);

  const ordenados = useMemo(
    () => [...clientes].sort((a, b) => normalizar(a.nombre).localeCompare(normalizar(b.nombre))),
    [clientes]
  );
  const tipos = useMemo(
    () => [...new Set(clientes.map((c) => c.tipoCliente).filter(Boolean))].sort(),
    [clientes]
  );
  const letrasDisponibles = useMemo(() => new Set(clientes.map(inicialDe)), [clientes]);

  const filtrados = useMemo(() => {
    const terminos = normalizar(busqueda).split(/\s+/).filter(Boolean);
    return ordenados.filter(
      (c) =>
        (tipo === 'TODOS' || c.tipoCliente === tipo) &&
        (!letra || inicialDe(c) === letra) &&
        coincideBusqueda(c, terminos)
    );
  }, [ordenados, busqueda, tipo, letra]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = filtrados.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const chip = (activo) =>
    `px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
      activo
        ? 'bg-brand text-white border-brand'
        : 'bg-white text-slate-600 border-slate-300 hover:border-brand'
    }`;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-xs">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
            <Library className="w-5 h-5 text-brand" />
            Biblioteca de clientes
            <span className="text-[11px] font-normal text-slate-500">({clientes.length})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-slate-100">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Filtrar por nombre, teléfono o tipo..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(0); }}
              className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-9 pr-3 font-semibold text-slate-800 focus:outline-none focus:border-brand"
            />
          </div>

          {tipos.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className={chip(tipo === 'TODOS')} onClick={() => { setTipo('TODOS'); setPagina(0); }}>
                Todos
              </button>
              {tipos.map((t) => (
                <button key={t} type="button" className={chip(tipo === t)} onClick={() => { setTipo(t); setPagina(0); }}>
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            <button type="button" className={chip(!letra)} onClick={() => { setLetra(''); setPagina(0); }}>
              A-Z
            </button>
            {LETRAS.map((l) => (
              <button
                key={l}
                type="button"
                disabled={!letrasDisponibles.has(l)}
                className={`${chip(letra === l)} disabled:opacity-30 disabled:cursor-not-allowed`}
                onClick={() => { setLetra(l); setPagina(0); }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visibles.length === 0 ? (
            <p className="p-6 text-center text-slate-500">No hay clientes con esos filtros.</p>
          ) : (
            visibles.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => onSelect(c)}
                className={`w-full text-left px-4 py-2.5 border-b border-slate-100 hover:bg-brand/10 flex items-center justify-between gap-3 cursor-pointer ${
                  c.id === clienteActual?.id ? 'bg-brand/5' : 'bg-white'
                }`}
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-800 truncate">{c.nombre}</span>
                  <span className="block text-[10px] text-slate-500">
                    {c.tipoCliente}{c.telefono ? ` · Tel: ${c.telefono}` : ''}
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 text-right shrink-0">
                  {c.tarifaAereo != null && <span className="block">Aéreo ${c.tarifaAereo}</span>}
                  {c.tarifaMaritimo != null && <span className="block">Marítimo ${c.tarifaMaritimo}</span>}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between p-3 border-t border-slate-100 text-[11px] text-slate-500">
          <span>{filtrados.length} {filtrados.length === 1 ? 'cliente' : 'clientes'}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={paginaActual === 0}
              onClick={() => setPagina(paginaActual - 1)}
              className="px-3 py-1 rounded-lg border border-slate-300 font-bold disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span>Página {paginaActual + 1} de {totalPaginas}</span>
            <button
              type="button"
              disabled={paginaActual >= totalPaginas - 1}
              onClick={() => setPagina(paginaActual + 1)}
              className="px-3 py-1 rounded-lg border border-slate-300 font-bold disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectorCliente({ clientes, clienteActual, onSelect }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [bibliotecaAbierta, setBibliotecaAbierta] = useState(false);
  const contenedorRef = useRef(null);
  const itemActivoRef = useRef(null);

  const filtrados = useMemo(() => {
    const terminos = normalizar(busqueda).split(/\s+/).filter(Boolean);
    if (terminos.length === 0) return clientes;
    return clientes.filter((c) => coincideBusqueda(c, terminos));
  }, [clientes, busqueda]);

  const visibles = filtrados.slice(0, LIMITE_RESULTADOS);

  useEffect(() => {
    const handler = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
        setBusqueda('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (abierto && itemActivoRef.current) {
      itemActivoRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [indiceActivo, abierto]);

  const abrir = () => {
    setAbierto(true);
    const idx = visibles.findIndex((c) => c.id === clienteActual?.id);
    setIndiceActivo(idx >= 0 ? idx : 0);
  };

  const elegir = (cliente) => {
    onSelect(cliente);
    setAbierto(false);
    setBusqueda('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!abierto) return abrir();
      setIndiceActivo((i) => Math.min(i + 1, visibles.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (abierto && visibles[indiceActivo]) elegir(visibles[indiceActivo]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
      setBusqueda('');
    }
  };

  return (
    <div ref={contenedorRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex items-center flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            role="combobox"
            aria-expanded={abierto}
            placeholder="Buscar cliente por nombre o teléfono..."
            value={abierto ? busqueda : (clienteActual?.nombre || '')}
            onFocus={abrir}
            onClick={() => !abierto && abrir()}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setIndiceActivo(0);
              setAbierto(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-9 font-semibold text-slate-800 focus:outline-none focus:border-brand"
          />
          <ChevronDown className={`w-4 h-4 text-slate-400 absolute right-3 pointer-events-none transition ${abierto ? 'rotate-180' : ''}`} />
        </div>

        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setBusqueda('');
            setBibliotecaAbierta(true);
          }}
          className="shrink-0 px-3 rounded-xl border border-slate-300 bg-white hover:border-brand hover:text-brand text-slate-600 font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Library className="w-4 h-4" />
          <span className="hidden sm:inline">Biblioteca</span>
        </button>
      </div>

      {bibliotecaAbierta && (
        <BibliotecaClientes
          clientes={clientes}
          clienteActual={clienteActual}
          onSelect={(c) => {
            onSelect(c);
            setBibliotecaAbierta(false);
          }}
          onClose={() => setBibliotecaAbierta(false)}
        />
      )}

      {abierto && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {visibles.length === 0 ? (
            <p className="p-3 text-slate-500">Sin resultados para "{busqueda}"</p>
          ) : (
            <>
              {visibles.map((c, idx) => (
                <button
                  type="button"
                  key={c.id}
                  ref={idx === indiceActivo ? itemActivoRef : null}
                  onClick={() => elegir(c)}
                  onMouseEnter={() => setIndiceActivo(idx)}
                  className={`w-full text-left px-3 py-2 border-b border-slate-100 last:border-b-0 cursor-pointer ${
                    idx === indiceActivo ? 'bg-brand/10' : 'bg-white'
                  } ${c.id === clienteActual?.id ? 'font-bold' : ''}`}
                >
                  <span className="block text-slate-800 font-semibold">{c.nombre}</span>
                  <span className="block text-[10px] text-slate-500">
                    {c.tipoCliente}{c.telefono ? ` · Tel: ${c.telefono}` : ''}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecepcionCarga() {
  const { usuario } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
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

  const [paquetes, setPaquetes] = useState([
    {
      id: Date.now(),
      tracking: '',
      pesoLbs: 1,
      viaEnvio: 'AEREO',
      categoria: 'GENERAL',
      proveedorId: '',
      tarifaUnitario: 7.00
    }
  ]);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [ticketData, setTicketData] = useState(null);

  // Verificación dinámica de subagencia B2B
  const esClienteSubagencia = (cliente) => {
    return cliente?.tipoCliente === 'SUBAGENCIA' || cliente?.tipoCliente === 'SUCURSAL_B2B';
  };

  const aplicarReglaDestino = (cliente, listaSucursales = sucursales) => {
    if (!cliente) return;
    
    // Si el cliente es una subagencia B2B, buscar si coincide con el nombre de alguna sucursal B2B
    if (esClienteSubagencia(cliente)) {
      const match = listaSucursales.find(s => 
        s.tipoSucursal === 'FRANQUICIA_B2B' && 
        (cliente.nombre.toLowerCase().includes(s.nombre.toLowerCase()) || cliente.nombre.toLowerCase().includes(s.ciudad.toLowerCase()))
      );
      if (match) {
        setSucursalDestinoId(match.id);
        return;
      }
    }

    setSucursalDestinoId(usuario?.sucursalId || 1);
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const [clientesData, sucursalesRes, configRes, provRes] = await Promise.all([
        clienteService.obtenerTodos(),
        api.get('/sucursales'),
        api.get('/configuracion'),
        api.get('/proveedores').catch(() => ({ data: [] }))
      ]);

      const listaClientes = clientesData || [];
      const listaSucursales = sucursalesRes.data || [];
      const listaProveedores = provRes.data || [];

      setClientes(listaClientes);
      setSucursales(listaSucursales);
      setProveedores(listaProveedores);

      if (listaClientes.length > 0) {
        const primerCliente = listaClientes[0];
        setClienteSeleccionadoId(primerCliente.id);
        setClienteActual(primerCliente);
        aplicarReglaDestino(primerCliente, listaSucursales);
      }

      if (configRes.data) {
        setConfigGlobal(configRes.data);
        const provDefault = listaProveedores.length > 0 ? listaProveedores[0].id : '';
        setPaquetes(prev => prev.map(p => ({
          ...p,
          proveedorId: provDefault,
          tarifaUnitario: configRes.data.tarifaAereoGeneral || 7.00
        })));
      }
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  const handleCambioCliente = (encontrado) => {
    setClienteSeleccionadoId(encontrado ? encontrado.id : '');
    setClienteActual(encontrado || null);
    aplicarReglaDestino(encontrado);

    if (encontrado) {
      setPaquetes(prev => prev.map(p => {
        let nuevaTarifa = p.tarifaUnitario;
        if (p.categoria === 'GENERAL' || p.categoria === 'PALLET') {
          nuevaTarifa = p.viaEnvio === 'MARITIMO' ? encontrado.tarifaMaritimo : encontrado.tarifaAereo;
        } else if (p.categoria === 'CELULAR') {
          nuevaTarifa = encontrado.tarifaCelularFija || configGlobal.tarifaCelularFija;
        } else if (p.categoria === 'SMART_TV') {
          nuevaTarifa = p.viaEnvio === 'MARITIMO' 
            ? (encontrado.tarifaTvMaritimo || configGlobal.tarifaTvMaritimo) 
            : (encontrado.tarifaTvAereo || configGlobal.tarifaTvAereo);
        }
        return { ...p, tarifaUnitario: nuevaTarifa };
      }));
    }
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
        pesoLbs: 1,
        viaEnvio: 'AEREO',
        categoria: 'GENERAL',
        proveedorId: proveedores[0]?.id || '',
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
            actualizado.tarifaUnitario = clienteActual?.tarifaCelularFija || configGlobal.tarifaCelularFija;
          } else if (actualizado.categoria === 'SMART_TV') {
            actualizado.tarifaUnitario = actualizado.viaEnvio === 'MARITIMO'
              ? (clienteActual?.tarifaTvMaritimo || configGlobal.tarifaTvMaritimo)
              : (clienteActual?.tarifaTvAereo || configGlobal.tarifaTvAereo);
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
    if (pkg.categoria === 'CELULAR' || pkg.categoria === 'PALLET') return tarifa;
    return peso * tarifa;
  };

  const subtotalPaquetesUSD = paquetes.reduce((acc, p) => acc + calcularSubtotalPaquete(p), 0);
  const totalLibras = paquetes.reduce((acc, p) => acc + (parseFloat(p.pesoLbs) || 0), 0);
  const totalCobradoNIO = subtotalPaquetesUSD * (configGlobal.tipoCambioNIO || 36.6243);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    const destinoFinal = parseInt(sucursalDestinoId) || usuario?.sucursalId || 1;

    const payload = {
      clienteId: parseInt(clienteSeleccionadoId),
      sucursalDestinoId: destinoFinal,
      paquetes: paquetes.map((p) => ({
        tracking: p.tracking || `TRK-${Date.now().toString().slice(-6)}`,
        pesoLbs: parseFloat(p.pesoLbs) || 0,
        viaEnvio: p.viaEnvio,
        categoria: p.categoria,
        proveedorId: p.proveedorId ? parseInt(p.proveedorId) : null,
        tarifaManual: parseFloat(p.tarifaUnitario) || 0
      }))
    };

    try {
      const res = await proformaService.crear(payload);
      const numeroGenerado = res?.numeroProforma || res?.numero || 'ABBA-1001';
      const sucursalDestinoObj = sucursales.find(s => s.id === destinoFinal);

      setTicketData({
        numeroProforma: numeroGenerado,
        fecha: new Date().toLocaleString(),
        clienteNombre: clienteActual?.nombre || 'Cliente General',
        clienteTelefono: clienteActual?.telefono || '',
        usuarioNombre: usuario?.nombre || 'Operador',
        sucursalNombre: usuario?.sucursalNombre || 'Sede Central',
        totalLibras,
        totalUSD: subtotalPaquetesUSD,
        totalNIO: totalCobradoNIO,
        tipoCambioAplicado: configGlobal.tipoCambioNIO,
        paquetes: paquetes.map(p => ({
          ...p,
          subtotal: calcularSubtotalPaquete(p)
        }))
      });

      setMensaje({ 
        tipo: 'exito', 
        texto: `Recepción ingresada con éxito. Proforma: ${numeroGenerado} (Destino: ${sucursalDestinoObj?.nombre || 'Local'})` 
      });

      setPaquetes([
        {
          id: Date.now(),
          tracking: '',
          pesoLbs: 1,
          viaEnvio: 'AEREO',
          categoria: 'GENERAL',
          proveedorId: proveedores[0]?.id || '',
          tarifaUnitario: clienteActual ? clienteActual.tarifaAereo : configGlobal.tarifaAereoGeneral
        }
      ]);
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || error.message || 'Error al guardar la carga'
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-brand" />
            Recepción e Ingreso de Carga en Bodega
          </h1>
          <p className="text-xs text-slate-500">
            Ingreso oficial de bultos a crédito hacia sedes propias o franquicias B2B
          </p>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setAcordeonCliente(!acordeonCliente)}
            className="w-full flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 transition border-b border-slate-100 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-display">1</span>
              <span>Cliente y Sucursal de Destino</span>
            </div>
            {acordeonCliente ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {acordeonCliente && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="lg:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Cliente / Cuenta</label>
                <SelectorCliente
                  clientes={clientes}
                  clienteActual={clienteActual}
                  onSelect={handleCambioCliente}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sucursal Destino</label>
                <div className="relative flex items-center">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3" />
                  <select
                    value={sucursalDestinoId}
                    onChange={(e) => setSucursalDestinoId(e.target.value)}
                    className="w-full border rounded-xl py-2.5 pl-9 pr-3 font-bold text-xs focus:outline-none bg-white border-slate-300 text-slate-800"
                  >
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({s.ciudad}) {s.tipoSucursal === 'FRANQUICIA_B2B' ? '• B2B' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acordeón Paquetes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setAcordeonPaquetes(!acordeonPaquetes)}
            className="w-full flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 transition border-b border-slate-100 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-display">2</span>
              <span>Paquetes y Proveedores ({paquetes.length} {paquetes.length === 1 ? 'bulto' : 'bultos'})</span>
            </div>
            {acordeonPaquetes ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {acordeonPaquetes && (
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                {paquetes.map((pkg) => (
                  <div 
                    key={pkg.id} 
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center text-xs"
                  >
                    <div className="lg:col-span-3">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">N° Tracking / Guía</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. TBA123456789"
                        value={pkg.tracking}
                        onChange={(e) => actualizarPaquete(pkg.id, 'tracking', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Proveedor</label>
                      <select
                        value={pkg.proveedorId}
                        onChange={(e) => actualizarPaquete(pkg.id, 'proveedorId', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 text-xs truncate"
                      >
                        {proveedores.map((prov) => (
                          <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Categoría</label>
                      <select
                        value={pkg.categoria}
                        onChange={(e) => actualizarPaquete(pkg.id, 'categoria', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 text-xs"
                      >
                        <option value="GENERAL">General</option>
                        <option value="SMART_TV">Smart TV</option>
                        <option value="CELULAR">Celular</option>
                        <option value="PALLET">Pallet</option>
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Vía</label>
                      <select
                        value={pkg.viaEnvio}
                        onChange={(e) => actualizarPaquete(pkg.id, 'viaEnvio', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-800 text-xs"
                      >
                        <option value="AEREO">AÉREO</option>
                        <option value="MARITIMO">MARÍTIMO</option>
                      </select>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Peso (lb)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={pkg.pesoLbs}
                        onChange={(e) => actualizarPaquete(pkg.id, 'pesoLbs', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800 text-center"
                      />
                    </div>

                    <div className="lg:col-span-1 text-right">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Subtotal</label>
                      <div className="text-xs font-bold font-display text-slate-900 pt-1">
                        ${calcularSubtotalPaquete(pkg).toFixed(2)}
                      </div>
                    </div>

                    <div className="lg:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => eliminarPaquete(pkg.id)}
                        disabled={paquetes.length === 1}
                        className="p-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg shadow-sm disabled:opacity-30 disabled:bg-slate-300 transition cursor-pointer"
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
                <span>Agregar Bulto Adicional</span>
              </button>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-center md:text-left">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Peso Total</p>
              <p className="text-2xl font-black font-display text-white">{totalLibras.toFixed(2)} lbs</p>
            </div>
            <div className="border-l border-slate-700 pl-6 sm:pl-10">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Flete USD (A Crédito)</p>
              <p className="text-2xl font-black font-display text-emerald-400">${subtotalPaquetesUSD.toFixed(2)} USD</p>
            </div>
            <div className="border-l border-slate-700 pl-6 sm:pl-10">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Equivalente Córdobas</p>
              <p className="text-2xl font-black font-display text-brand-300">C$ {totalCobradoNIO.toFixed(2)} NIO</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full md:w-auto px-8 py-4 bg-brand hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{guardando ? 'Ingresando...' : 'Guardar Recepción (A Crédito)'}</span>
          </button>
        </div>
      </form>

      {/* Ticket */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs font-mono">
            <div className="text-center border-b pb-3 space-y-1">
              <h3 className="font-bold font-sans text-base text-slate-900">ABBA XPRESS</h3>
              <p className="text-[10px] text-slate-500">COMPROBANTE DE RECEPCIÓN EN BODEGA</p>
              <p className="text-xs font-bold text-brand">#{ticketData.numeroProforma}</p>
            </div>

            <div className="space-y-1 text-[11px]">
              <p><strong>Cliente:</strong> {ticketData.clienteNombre}</p>
              <p><strong>Teléfono:</strong> {ticketData.clienteTelefono || 'N/A'}</p>
              <p><strong>Condición:</strong> PENDIENTE DE COBRO</p>
              <p><strong>Fecha:</strong> {ticketData.fecha}</p>
            </div>

            <div className="border-t border-b py-2 space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-500">Bultos Recepcionados ({ticketData.paquetes.length})</p>
              {ticketData.paquetes.map((p, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span className="font-bold">{p.tracking} ({p.pesoLbs} lb)</span>
                  <span>${p.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="text-right space-y-0.5">
              <p className="text-sm font-black font-sans text-slate-900">TOTAL FLETE: ${ticketData.totalUSD.toFixed(2)} USD</p>
              <p className="text-xs font-sans text-slate-500">C$ {ticketData.totalNIO.toFixed(2)} NIO</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setTicketData(null)}
                className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
              <button 
                onClick={() => window.print()}
                className="w-1/2 py-2 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
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