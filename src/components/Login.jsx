import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, cargando } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await login(username, password);
    if (res.exito) {
      navigate('/');
    } else {
      setError(res.mensaje);
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Luces de fondo ambientales */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-brand-dark/90 border border-slate-700/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-white relative z-10 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-white rounded-2xl p-2 mx-auto flex items-center justify-center shadow-lg">
            <span className="font-display font-black text-brand text-2xl">A</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">ABBA XPRESS</h1>
          <p className="text-xs text-slate-400">Logistics ERP & Billing System v3.0</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">Usuario</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                required
                placeholder="Ingresa tu usuario"
                className="w-full bg-[#10121e] border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-brand transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1.5 uppercase tracking-wider text-[10px]">Contraseña</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-[#10121e] border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-brand transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3.5 bg-brand hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{cargando ? 'Iniciando sesión...' : 'Ingresar al ERP'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-700/60 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-brand" />
          <span>Acceso Seguro Encriptado • Nicaplus Solutions</span>
        </div>

      </div>
    </div>
  );
}