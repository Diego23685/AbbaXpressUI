import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, Building2, PackageCheck, Box, X } from 'lucide-react';

interface ArriboAnimacionProps {
  proformaNumero?: string;
  clienteNombre?: string;
  cantidadBultos: number;
  sucursal?: string;
  onCompletado: () => void;
}

export default function ArriboAnimacion({
  proformaNumero = 'ABBA-1000',
  clienteNombre,
  cantidadBultos = 1,
  sucursal = 'Sucursal León',
  onCompletado
}: ArriboAnimacionProps) {
  const [fase, setFase] = useState<'FRENANDO' | 'DESCARGANDO' | 'INGRESADO'>('FRENANDO');

  // Sintetizador Web Audio API: Freno de aire suave + Chime de éxito
  const reproducirAudioArribo = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // 1. Freno de aire comprimido al llegar ("Pssssshhhhh")
      const bufferSize = Math.floor(ctx.sampleRate * 0.6);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1500;

      const gainNoise = ctx.createGain();
      gainNoise.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNoise.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      noise.connect(filter);
      filter.connect(gainNoise);
      gainNoise.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.6);

      // 2. Chime armónico de éxito al ingresar a bodega (1.8s)
      setTimeout(() => {
        const notas = [523.25, 659.25, 783.99, 1046.50]; // Acorde C Mayor
        notas.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.5);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.5);
        });
      }, 1800);

    } catch (e) {
      console.warn('Audio no disponible:', e);
    }
  };

  useEffect(() => {
    reproducirAudioArribo();

    const t1 = setTimeout(() => setFase('DESCARGANDO'), 800);
    const t2 = setTimeout(() => setFase('INGRESADO'), 2400);
    const t3 = setTimeout(() => {
      onCompletado();
    }, 3200);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onCompletado();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div 
      onClick={onCompletado}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-300 cursor-pointer"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes animCajaEntrando {
          0% { transform: translateY(15px) scale(0.6); opacity: 0; }
          60% { transform: translateY(-5px) scale(1.1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes suspensionSuave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .anim-caja-descarga {
          animation: animCajaEntrando 0.5s ease-out forwards;
        }
        .anim-auto-suspension {
          animation: suspensionSuave 0.22s ease-in-out infinite;
        }
      `}} />

      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl text-center text-white space-y-6 relative overflow-hidden cursor-default"
      >
        <button
          onClick={onCompletado}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          title="Saltar (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-brand to-amber-400 animate-pulse" />

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recepción y Descarga en Bodega</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
            {fase === 'INGRESADO' ? '¡Carga Ingresada y Asignada con Éxito!' : `Arribo de Carga a ${sucursal}`}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Proforma <strong className="text-brand font-mono">#{proformaNumero}</strong>
            {clienteNombre ? ` • Asignada a: ` : ` • `}
            {clienteNombre && <strong className="text-emerald-400">{clienteNombre}</strong>}
            {` (${cantidadBultos} bultos)`}
          </p>
        </div>

        {/* Escenario de Arribo a Bodega */}
        <div className="relative h-56 sm:h-64 w-full bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-end">
          
          {/* Fachada Bodega */}
          <div className="absolute top-6 right-4 sm:right-8 flex flex-col items-center z-10">
            <div className="bg-slate-800 border-2 border-slate-700 rounded-t-xl px-4 py-1.5 flex items-center gap-2 shadow-lg">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="font-display font-black text-xs text-white">BODEGA LEÓN</span>
            </div>
            <div className="w-28 sm:w-36 h-28 bg-slate-900 border-x-2 border-t-2 border-slate-700 flex flex-col items-center justify-end p-2 relative">
              <div className="w-full h-20 bg-slate-800/80 rounded border border-slate-600 flex flex-col justify-around p-1">
                <div className="h-0.5 bg-slate-700 w-full"></div>
                <div className="h-0.5 bg-slate-700 w-full"></div>
                <div className="h-0.5 bg-slate-700 w-full"></div>
                <div className="h-0.5 bg-slate-700 w-full"></div>
              </div>
              <span className="text-[9px] font-bold text-emerald-400 mt-1 uppercase">Muelle #1</span>
            </div>
          </div>

          {/* Bultos Descargados Dinámicos */}
          {fase !== 'FRENANDO' && (
            <div className="absolute bottom-9 right-36 sm:right-48 z-30 flex items-center gap-1.5 anim-caja-descarga">
              <div className="p-2 bg-amber-500 text-slate-900 rounded-xl font-bold shadow-lg border border-amber-300 flex items-center gap-1">
                <Box className="w-4 h-4" />
                <span className="text-[10px] font-mono">{cantidadBultos} Bulto(s)</span>
              </div>
            </div>
          )}

          {/* Vehículo en Muelle (Imagen PNG) */}
          <div 
            className={`absolute bottom-5 z-20 transition-all duration-[1200ms] ease-out ${
              fase === 'FRENANDO' ? 'left-[2%]' : 'left-[14%] sm:left-[22%]'
            }`}
          >
            <div className="relative anim-auto-suspension">
              
              {/* Haz de luz de los faros */}
              <div 
                className="absolute right-[-85px] bottom-[8px] w-32 h-14 pointer-events-none opacity-45 z-10"
                style={{
                  background: 'linear-gradient(to right, rgba(254, 240, 138, 0.8), transparent)',
                  clipPath: 'polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)'
                }}
              />

              {/* Imagen PNG del auto (public/carro.png) */}
              <img 
                src="/carro.png" 
                alt="Vehículo de Reparto" 
                className="w-48 sm:w-56 h-auto object-contain select-none drop-shadow-[0_10px_14px_rgba(0,0,0,0.65)]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/Logo.png';
                }}
              />
            </div>
          </div>

          <div className="relative w-full h-8 bg-slate-900 border-t-2 border-slate-700 flex items-center shadow-2xl z-10 px-4">
            <div className="w-full h-1 bg-slate-700 rounded-full" />
          </div>
        </div>

        {/* Barra de progreso y confirmación */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold px-1">
            <span className="flex items-center gap-1 text-slate-400">
              🚗 Vehículo en Muelle
            </span>
            <span className="font-mono text-emerald-400 text-[11px]">
              {fase === 'INGRESADO' ? '✅ Disponible para Retiro / Entrega' : '📦 Descargando en Almacén Local...'}
            </span>
            <span className="flex items-center gap-1 text-brand">
              <PackageCheck className="w-3.5 h-3.5" /> Inventario Listo
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-brand via-emerald-400 to-emerald-500 transition-all duration-[2200ms] ease-out rounded-full"
              style={{ width: fase === 'INGRESADO' ? '100%' : '70%' }}
            />
          </div>

          {fase === 'INGRESADO' && (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Procesado exitosamente! Actualizando catálogo de facturación...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}