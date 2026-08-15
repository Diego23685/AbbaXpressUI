import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TutorialTour from './TutorialTour';
import { 
  PackagePlus, 
  Receipt, 
  TrendingUp, 
  Globe, 
  Users, 
  UserCog, 
  Settings, 
  LogOut, 
  Building2,
  Tag,
  Truck,
  HelpCircle,
  BarChart3,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [runTour, setRunTour] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Verificar si ya vio el tutorial por primera vez
    const tourVisto = localStorage.getItem('abba_tutorial_visto');
    if (!tourVisto) {
      // Pequeño delay para que cargue la interfaz antes de lanzar el tour
      const timer = setTimeout(() => setRunTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { nombre: 'Recepción de Carga', ruta: '/', icono: PackagePlus },
    { nombre: 'Cuentas & Facturación', ruta: '/facturacion', icono: Receipt },
    { nombre: 'Gastos & Utilidades', ruta: '/finanzas', icono: TrendingUp },
    { nombre: 'Exportación USA (FedEx)', ruta: '/exportacion', icono: Globe },
    { nombre: 'Directorio Clientes', ruta: '/clientes', icono: Users },
    { nombre: 'Rótulos & Manifiestos', ruta: '/rotulos', icono: Tag },
    { nombre: 'Carga en Tránsito', ruta: '/transito', icono: Truck },
    { nombre: 'Reportes & Utilidades', ruta: '/reportes', icono: BarChart3 },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      
      {/* Componente de Tour Guiado */}
      <TutorialTour run={runTour} setRun={setRunTour} />

      {/* Topbar para Pantallas Móviles (< md) */}
      <header className="md:hidden bg-brand-dark flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0 z-30 select-none print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow">
            <img src="/Logo.png" alt="Abba Xpress Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-sm tracking-tight">ABBA XPRESS</h1>
            <p className="text-[9px] text-slate-400 font-mono">ERP Logístico</p>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white transition cursor-pointer focus:outline-none"
          aria-label="Abrir menú"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Backdrop Traslúcido para Móviles */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Corporativo (Plegable en Móvil / Fijo en Escritorio) */}
      <aside 
        className={`fixed md:static top-0 left-0 bottom-0 z-50 w-64 bg-brand-darker text-slate-300 flex flex-col border-r border-slate-800 select-none print:hidden transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        
        {/* Logo & Marca (Visible en Sidebar) */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800/80 bg-brand-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg overflow-hidden">
              <img src="/Logo.png" alt="Abba Xpress Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-base tracking-tight">ABBA XPRESS</h1>
              <p className="text-[10px] text-slate-400 font-mono">ERP Logístico</p>
            </div>
          </div>

          {/* Botón Cerrar exclusivo para móvil dentro del Sidebar */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Usuario & Sede */}
        <div className="p-4 mx-3 my-3 bg-[#10121e] rounded-2xl border border-slate-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand/20 text-brand text-xs font-bold flex items-center justify-center shrink-0">
            {usuario?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{usuario?.nombre}</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-brand shrink-0" />
              <span className="truncate">{usuario?.sucursalNombre || 'Sede Central'}</span>
            </p>
          </div>
        </div>

        {/* Links de Navegación */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icono;
            return (
              <NavLink
                key={item.ruta}
                to={item.ruta}
                end={item.ruta === '/'}
                onClick={() => setSidebarOpen(false)} // Cierra el menú al hacer clic en un ítem en celular
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.nombre}</span>
              </NavLink>
            );
          })}

          {/* Opciones para Administradores */}
          {(usuario?.rol === 'SUPER_ADMIN' || usuario?.rol === 'ADMIN_SUCURSAL_INDEPENDIENTE') && (
            <>
              <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Administración
              </div>
              <NavLink
                to="/usuarios"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`
                }
              >
                <UserCog className="w-4 h-4 shrink-0" />
                <span>Gestión de Usuarios</span>
              </NavLink>
              <NavLink
                to="/configuracion"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`
                }
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Tarifas de Sucursal</span>
              </NavLink>

              <NavLink
                to="/auditoria"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`
                }
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Bitácora de Auditoría</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Botones inferiores: Ver Tutorial & Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => {
              setSidebarOpen(false);
              setRunTour(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-brand" />
            <span>Ver Tutorial del Sistema</span>
          </button>

          <button
            onClick={() => {
              setSidebarOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <main className="flex-1 overflow-y-auto bg-slate-100">
        <Outlet />
      </main>

    </div>
  );
}