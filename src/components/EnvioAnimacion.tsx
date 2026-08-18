import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, MapPin } from 'lucide-react';

interface EnvioAnimacionProps {
  origen?: string;
  destino?: string;
  cantidadBultos: number;
  onCompletado: () => void;
}

export default function EnvioAnimacion({
  origen = 'Managua (Bolonia)',
  destino = 'León (Central)',
  cantidadBultos,
  onCompletado
}: EnvioAnimacionProps) {
  const [fase, setFase] = useState<'INICIANDO' | 'EN_RUTA' | 'LLEGADO'>('INICIANDO');

  // Sintetizador Web Audio API: Motor diésel pesado + Claxon de aire comprimido + Freno de aire
  const reproducirAudioCinematico = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // 1. Motor Diésel Pesado (Sonido grave y vibrante)
      const oscMotor = ctx.createOscillator();
      const gainMotor = ctx.createGain();

      oscMotor.type = 'sawtooth';
      oscMotor.frequency.setValueAtTime(38, ctx.currentTime);
      oscMotor.frequency.exponentialRampToValueAtTime(85, ctx.currentTime + 1.2);
      oscMotor.frequency.linearRampToValueAtTime(70, ctx.currentTime + 2.8);

      gainMotor.gain.setValueAtTime(0.09, ctx.currentTime);
      gainMotor.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3.2);

      oscMotor.connect(gainMotor);
      gainMotor.connect(ctx.destination);

      oscMotor.start(ctx.currentTime);
      oscMotor.stop(ctx.currentTime + 3.2);

      // 2. Bocina doble de aire comprimido (Camión de carga en ruta) a los 0.5s
      setTimeout(() => {
        const oscClaxon1 = ctx.createOscillator();
        const oscClaxon2 = ctx.createOscillator();
        const gainClaxon = ctx.createGain();

        oscClaxon1.type = 'sawtooth';
        oscClaxon2.type = 'triangle';
        oscClaxon1.frequency.setValueAtTime(260, ctx.currentTime);
        oscClaxon2.frequency.setValueAtTime(329, ctx.currentTime);

        gainClaxon.gain.setValueAtTime(0.12, ctx.currentTime);
        gainClaxon.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

        oscClaxon1.connect(gainClaxon);
        oscClaxon2.connect(gainClaxon);
        gainClaxon.connect(ctx.destination);

        oscClaxon1.start();
        oscClaxon2.start();
        oscClaxon1.stop(ctx.currentTime + 0.55);
        oscClaxon2.stop(ctx.currentTime + 0.55);
      }, 500);

      // 3. Freno de aire comprimido al detenerse ("Psssshh") a los 2.6s
      setTimeout(() => {
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1; // Ruido blanco
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;

        const gainNoise = ctx.createGain();
        gainNoise.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNoise.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        noise.connect(filter);
        filter.connect(gainNoise);
        gainNoise.connect(ctx.destination);

        noise.start();
        noise.stop(ctx.currentTime + 0.4);
      }, 2600);

    } catch (e) {
      console.warn('Audio no disponible:', e);
    }
  };

  useEffect(() => {
    reproducirAudioCinematico();

    const t1 = setTimeout(() => setFase('EN_RUTA'), 300);
    const t2 = setTimeout(() => setFase('LLEGADO'), 2700);
    const t3 = setTimeout(() => {
      onCompletado();
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      
      {/* Estilos para animación de parallax, rotación de rines y suspensión */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes moverFondoNubes {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes moverCarretera {
          0% { background-position: 0 0; }
          100% { background-position: -80px 0; }
        }
        @keyframes girarRuedas {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes suspensionBus {
          0%, 100% { transform: translateY(0px); }
          25% { transform: translateY(-3px); }
          75% { transform: translateY(1px); }
        }
        @keyframes humoEscape {
          0% { opacity: 0.8; transform: translate(0, 0) scale(0.6); }
          50% { opacity: 0.4; }
          100% { opacity: 0; transform: translate(-35px, -15px) scale(1.8); }
        }
        .anim-nubes {
          animation: moverFondoNubes 18s linear infinite;
        }
        .anim-carretera-cinematica {
          background: repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 30px, transparent 30px, transparent 60px);
          animation: moverCarretera 0.3s linear infinite;
        }
        .anim-rueda-girando {
          animation: girarRuedas 0.35s linear infinite;
          transform-origin: center;
        }
        .anim-suspension {
          animation: suspensionBus 0.22s ease-in-out infinite;
        }
        .anim-humo {
          animation: humoEscape 0.6s ease-out infinite;
        }
      `}} />

      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl text-center text-white space-y-6 relative overflow-hidden">
        
        {/* Línea de brillo superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-brand to-emerald-400 animate-pulse" />

        {/* Encabezado */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Despacho Inter-Sucursal en Ruta</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
            {fase === 'LLEGADO' ? '¡Arribo Confirmado en Sucursal León!' : 'Camión de Carga en Tránsito (Carretera Nueva a León)'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Custodia oficial de <strong className="text-emerald-400">{cantidadBultos} bulto(s)</strong> desde {origen} hacia {destino}
          </p>
        </div>

        {/* ESCENARIO CINEMÁTICO VECTORIAL */}
        <div className="relative h-56 sm:h-64 w-full bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-end">
          
          {/* Nubes y cielo en Parallax */}
          <div className="absolute top-3 left-0 w-[200%] flex justify-around opacity-25 anim-nubes">
            <div className="w-24 h-6 bg-white rounded-full blur-[1px]"></div>
            <div className="w-36 h-8 bg-white rounded-full blur-[1px]"></div>
            <div className="w-20 h-5 bg-white rounded-full blur-[1px]"></div>
            <div className="w-32 h-7 bg-white rounded-full blur-[1px]"></div>
          </div>

          {/* Cordillera / Volcanes de Fondo (Momotombo & Maribios) */}
          <svg className="absolute bottom-16 left-0 w-full h-28 opacity-40" viewBox="0 0 800 120" preserveAspectRatio="none">
            <polygon points="0,120 120,40 240,120" fill="#1e293b" />
            <polygon points="180,120 320,15 460,120" fill="#0f172a" />
            <polygon points="400,120 540,35 680,120" fill="#1e293b" />
            <polygon points="620,120 740,50 800,120" fill="#0f172a" />
          </svg>

          {/* Postes de tendido eléctrico pasando */}
          <div className="absolute bottom-14 left-0 w-[200%] flex justify-around opacity-30 anim-nubes" style={{ animationDuration: '4s' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-8 h-0.5 bg-slate-400"></div>
                <div className="w-1 h-20 bg-slate-500"></div>
              </div>
            ))}
          </div>

          {/* CAMIÓN DE CARGA VECTORIAL REALISTA (COLORES ABBA XPRESS) */}
          <div 
            className={`absolute bottom-6 z-20 transition-all duration-[2400ms] ease-in-out ${
              fase === 'INICIANDO' ? 'left-[4%]' :
              fase === 'EN_RUTA' ? 'left-[46%]' : 'left-[55%]'
            }`}
          >
            {/* Animación de suspensión */}
            <div className="relative anim-suspension">
              
              {/* Humo de escape */}
              <div className="absolute left-[-12px] bottom-3 w-4 h-4 bg-slate-400/60 rounded-full blur-[2px] anim-humo" />
              <div className="absolute left-[-18px] bottom-4 w-3 h-3 bg-slate-300/50 rounded-full blur-[2px] anim-humo" style={{ animationDelay: '0.2s' }} />

              {/* HAZ DE LUZ DELANTERO (Faro encendido) */}
              <div 
                className="absolute right-[-140px] bottom-[-4px] w-36 h-16 pointer-events-none opacity-45"
                style={{
                    background: 'linear-gradient(to right, rgba(254, 240, 138, 0.8), transparent)',
                    clipPath: 'polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)'
                }}
              >
                <div className="w-full h-full bg-gradient-to-r from-amber-200/50 via-amber-100/20 to-transparent transform -skew-x-12 rounded-r-full blur-[1px]"></div>
              </div>

              {/* SVG DEL CAMIÓN CORPORATIVO ABBA XPRESS */}
              <svg width="185" height="95" viewBox="0 0 220 115" fill="none" xmlns="http://www.w3.org/2000/svg">
                
                {/* 1. CAJA DE CARGA / CONTENEDOR (Colores Abba Dark & Brand 700) */}
                <rect x="5" y="12" width="135" height="72" rx="5" fill="#1e2038" stroke="#424698" strokeWidth="2"/>
                {/* Rayas reflectivas corporativas de marca */}
                <rect x="5" y="58" width="135" height="6" fill="#656cc5"/>
                <rect x="5" y="64" width="135" height="3" fill="#ababeb"/>
                {/* Puerta trasera y bisagras */}
                <line x1="8" y1="14" x2="8" y2="82" stroke="#313364" strokeWidth="2"/>
                <line x1="138" y1="14" x2="138" y2="82" stroke="#313364" strokeWidth="2"/>
                
                {/* Recuadro contenedor con Logo Oficial de Abba Xpress */}
                <rect x="16" y="20" width="112" height="32" rx="4" fill="#ffffff" stroke="#cecef2" strokeWidth="1" />
                <image 
                  href="/Logo.png" 
                  x="20" 
                  y="22" 
                  width="104" 
                  height="28" 
                  preserveAspectRatio="xMidYMid meet" 
                />

                {/* 2. CABINA DEL CONDUCTOR (Color Brand DEFAULT #656cc5) */}
                <path d="M140 28 L170 28 L195 55 L205 60 L205 84 L140 84 Z" fill="#656cc5" stroke="#5157b5" strokeWidth="2"/>
                {/* Techo aerodinámico */}
                <path d="M140 18 L165 18 L175 28 L140 28 Z" fill="#5157b5"/>
                {/* Parabrisas polarizado con tinte de marca */}
                <path d="M168 32 L190 54 L168 54 Z" fill="#e5e6f8" opacity="0.85" stroke="#cecef2" strokeWidth="1.5"/>
                {/* Ventana lateral */}
                <rect x="145" y="34" width="20" height="20" rx="2" fill="#e5e6f8" opacity="0.85" stroke="#cecef2" strokeWidth="1.5"/>
                {/* Retrovisor */}
                <rect x="166" y="42" width="3.5" height="10" rx="1.5" fill="#313364"/>
                {/* Manija */}
                <rect x="150" y="60" width="6" height="2" rx="1" fill="#f2f3fc"/>
                {/* Faro frontal */}
                <path d="M202 68 L206 68 L206 78 L202 78 Z" fill="#fef08a"/>
                {/* Parachoques delantero */}
                <rect x="195" y="80" width="14" height="6" rx="2" fill="#313364"/>

                {/* Chasis inferior y tanque de combustible */}
                <rect x="12" y="82" width="180" height="4" fill="#141625"/>
                <rect x="75" y="78" width="28" height="7" rx="1" fill="#5157b5" stroke="#424698" strokeWidth="1"/>

                {/* 3. RUEDAS DELANTERAS Y TRASERAS CON RINES METALIZADOS EN GIRO */}
                {/* Rueda Trasera 1 */}
                <g transform="translate(38, 86)">
                  <circle cx="0" cy="0" r="14" fill="#141625" stroke="#313364" strokeWidth="2"/>
                  <circle cx="0" cy="0" r="8" fill="#cecef2" />
                  <g className="anim-rueda-girando">
                    <circle cx="0" cy="0" r="3" fill="#656cc5" />
                    <line x1="-7" y1="0" x2="7" y2="0" stroke="#424698" strokeWidth="2"/>
                    <line x1="0" y1="-7" x2="0" y2="7" stroke="#424698" strokeWidth="2"/>
                  </g>
                </g>

                {/* Rueda Trasera 2 */}
                <g transform="translate(70, 86)">
                  <circle cx="0" cy="0" r="14" fill="#141625" stroke="#313364" strokeWidth="2"/>
                  <circle cx="0" cy="0" r="8" fill="#cecef2" />
                  <g className="anim-rueda-girando">
                    <circle cx="0" cy="0" r="3" fill="#656cc5" />
                    <line x1="-7" y1="0" x2="7" y2="0" stroke="#424698" strokeWidth="2"/>
                    <line x1="0" y1="-7" x2="0" y2="7" stroke="#424698" strokeWidth="2"/>
                  </g>
                </g>

                {/* Rueda Delantera */}
                <g transform="translate(175, 86)">
                  <circle cx="0" cy="0" r="14" fill="#141625" stroke="#313364" strokeWidth="2"/>
                  <circle cx="0" cy="0" r="8" fill="#cecef2" />
                  <g className="anim-rueda-girando">
                    <circle cx="0" cy="0" r="3" fill="#656cc5" />
                    <line x1="-7" y1="0" x2="7" y2="0" stroke="#424698" strokeWidth="2"/>
                    <line x1="0" y1="-7" x2="0" y2="7" stroke="#424698" strokeWidth="2"/>
                  </g>
                </g>

              </svg>
            </div>
          </div>

          {/* CARRETERA DE ASFALTO REAL */}
          <div className="relative w-full h-8 bg-slate-900 border-t-2 border-slate-700 flex items-center shadow-2xl z-10">
            {/* Líneas divisorias amarillas animadas */}
            <div className="w-full h-1.5 anim-carretera-cinematica" />
          </div>

        </div>

        {/* Estado y barra de progreso */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold px-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <MapPin className="w-3.5 h-3.5" /> {origen}
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              {fase === 'LLEGADO' ? '✅ Transferencia Completada' : '🚚 Velocidad de Crucero: 75 km/h'}
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <MapPin className="w-3.5 h-3.5" /> {destino}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-brand via-amber-400 to-emerald-400 transition-all duration-[2600ms] ease-out rounded-full"
              style={{ width: fase === 'LLEGADO' ? '100%' : '75%' }}
            />
          </div>

          {fase === 'LLEGADO' && (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Manifiesto despachado con éxito! Redirigiendo a bodega...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}