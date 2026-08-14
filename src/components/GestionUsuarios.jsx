import React, { useState, useEffect } from 'react';
import { 
  UserCog, 
  UserPlus, 
  ShieldCheck, 
  Building, 
  Lock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Power,
  Search,
  KeyRound,
  Edit2,
  X
} from 'lucide-react';
import { usuarioService } from '../services/usuarioService';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);

  // Estados de formulario
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('OPERADOR');
  const [sucursalId, setSucursalId] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listaUsuarios, listaSucursales] = await Promise.all([
        usuarioService.obtenerTodos(),
        usuarioService.obtenerSucursales()
      ]);
      setUsuarios(listaUsuarios || []);
      setSucursales(listaSucursales || []);
      if (listaSucursales.length > 0 && !sucursalId) {
        setSucursalId(listaSucursales[0].id);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const limpiarFormulario = () => {
    setNombre('');
    setUsername('');
    setPassword('');
    setRol('OPERADOR');
    if (sucursales.length > 0) setSucursalId(sucursales[0].id);
    setUsuarioEditandoId(null);
  };

  const abrirModalCrear = () => {
    limpiarFormulario();
    setModalCrear(true);
  };

  const abrirModalEditar = (u) => {
    setUsuarioEditandoId(u.id);
    setNombre(u.nombre);
    setUsername(u.username);
    setPassword(''); // Se deja vacío para que solo se actualice si escribe algo
    setRol(u.rol);
    setSucursalId(u.sucursalId);
    setModalEditar(true);
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      await usuarioService.crear({
        nombre,
        username,
        password,
        rol,
        sucursalId: parseInt(sucursalId)
      });
      setMensaje({ tipo: 'exito', texto: `Usuario "${username}" creado exitosamente.` });
      setModalCrear(false);
      limpiarFormulario();
      cargarDatos();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al crear usuario.'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleActualizarUsuario = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      await usuarioService.actualizar(usuarioEditandoId, {
        nombre,
        rol,
        sucursalId: parseInt(sucursalId),
        password: password.trim() ? password.trim() : null
      });
      setMensaje({ tipo: 'exito', texto: `Usuario "${username}" actualizado exitosamente.` });
      setModalEditar(false);
      limpiarFormulario();
      cargarDatos();
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'Error al actualizar usuario.'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (id) => {
    try {
      await usuarioService.toggleEstado(id);
      cargarDatos();
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo cambiar el estado del usuario');
    }
  };

  const getBadgeRol = (rolName) => {
    switch (rolName) {
      case 'SUPER_ADMIN':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Super Admin</span>;
      case 'ADMIN_SUCURSAL':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Admin Managua (Bolonia/Doral)</span>;
      case 'ADMIN_SUCURSAL_INDEPENDIENTE':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Admin Sucursal León (B2B)</span>;
      case 'OPERADOR':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Operador de Bodega</span>;
      case 'AUDITOR':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">Auditor (Solo Lectura)</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-medium">{rolName}</span>;
    }
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.username.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.sucursalNombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-brand" />
            Control de Usuarios y Accesos
          </h1>
          <p className="text-xs text-slate-500">
            Administración de credenciales, roles operativos y asignación de sucursales
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="px-4 py-2.5 bg-brand hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Nuevo Usuario</span>
        </button>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="w-full md:w-80 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Buscar usuario, nombre o sucursal..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-brand font-medium"
          />
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Nombre Completo</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.username}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {u.nombre}
                    </td>
                    <td className="py-3.5 px-4">
                      {getBadgeRol(u.rol)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.sucursalNombre}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => abrirModalEditar(u)}
                          className="p-1.5 text-slate-400 hover:text-brand hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleToggleEstado(u.id)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              u.activo ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand" />
                Crear Nuevo Usuario ERP
              </h2>
              <button 
                onClick={() => setModalCrear(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Morales"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-brand font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nombre de Usuario (Login)</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    required
                    placeholder="ej. rmorales"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 focus:outline-none focus:border-brand font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Contraseña Inicial</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Rol Operativo</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-brand"
                >
                  <option value="OPERADOR">Operador de Bodega (Pesaje y Etiquetas)</option>
                  <option value="ADMIN_SUCURSAL">Administrador Sede Managua (Bolonia / Doral)</option>
                  <option value="ADMIN_SUCURSAL_INDEPENDIENTE">Administrador Sucursal León (B2B Local)</option>
                  <option value="AUDITOR">Auditor (Solo Lectura)</option>
                  <option value="SUPER_ADMIN">Super Administrador (Control Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sucursal Asignada</label>
                <select
                  value={sucursalId}
                  onChange={(e) => setSucursalId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-brand"
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.ciudad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalCrear(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-1/2 py-3 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand" />
                Modificar Usuario: {username}
              </h2>
              <button 
                onClick={() => setModalEditar(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleActualizarUsuario} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-brand font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Nueva Contraseña <span className="text-[10px] font-normal text-slate-400">(Dejar en blanco para mantener la actual)</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="password"
                    placeholder="Escribir solo si desea cambiarla"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-3 text-slate-800 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Rol Operativo</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-brand"
                >
                  <option value="OPERADOR">Operador de Bodega (Pesaje y Etiquetas)</option>
                  <option value="ADMIN_SUCURSAL">Administrador Sede Managua (Bolonia / Doral)</option>
                  <option value="ADMIN_SUCURSAL_INDEPENDIENTE">Administrador Sucursal León (B2B Local)</option>
                  <option value="AUDITOR">Auditor (Solo Lectura)</option>
                  <option value="SUPER_ADMIN">Super Administrador (Control Total)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sucursal Asignada</label>
                <select
                  value={sucursalId}
                  onChange={(e) => setSucursalId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-brand"
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.ciudad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalEditar(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-1/2 py-3 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}