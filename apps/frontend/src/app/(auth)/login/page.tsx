'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Credenciales inválidas');
      }

      const data = await res.json();
      document.cookie = `access_token=${data.accessToken}; path=/; max-age=900`;
      document.cookie = `refresh_token=${data.refreshToken}; path=/; max-age=604800`;

      const rol = data.usuario.rol;
      window.location.href = rol === 'CLIENTE' ? '/portal' : '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-[#faf8ff] font-[Inter] text-[#131b2e] antialiased">
      {/* Left Section: Login Form */}
      <div className="w-full lg:w-[40%] flex flex-col p-6 sm:p-8 md:p-12 lg:p-16 justify-between relative z-10">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#091426] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[#4edea3]" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance
            </span>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#091426]">Numerito</span>
        </div>

        <div className="max-w-sm w-full mx-auto space-y-8 sm:space-y-10">
          <header className="space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131b2e]">Bienvenido</h1>
            <p className="text-[#45474c] font-medium leading-relaxed text-sm sm:text-base">
              Gestión contable inteligente y sincronizada para su estudio.
            </p>
          </header>

          {error && (
            <div className="rounded-lg bg-[#ffdad6] p-3 text-sm text-[#93000a] font-medium">
              {error}
            </div>
          )}

          {/* SSO Section */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-white border-[#c5c6cd]/30 border rounded-xl hover:bg-[#f2f3ff] transition-all duration-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-semibold">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-white border-[#c5c6cd]/30 border rounded-xl hover:bg-[#f2f3ff] transition-all duration-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="#f25022" />
                <path d="M24 24H12.6V12.6H24V24z" fill="#00a4ef" />
                <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#7fba00" />
                <path d="M24 11.4H12.6V0H24v11.4z" fill="#ffb900" />
                <path d="M11.4 24H0V12.6h11.4V24z" fill="#f25022" />
              </svg>
              <span className="text-sm font-semibold">Microsoft</span>
            </button>
          </div>

          <div className="relative flex items-center gap-4">
            <div className="flex-grow h-[1px] bg-[#c5c6cd]/20" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#75777d]">o vía email</span>
            <div className="flex-grow h-[1px] bg-[#c5c6cd]/20" />
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#45474c]" htmlFor="email">
                  Email
                </label>
                <input
                  className="border-0 border-b-[1.5px] border-[#c5c6cd] bg-transparent py-2 text-[#131b2e] placeholder:text-[#75777d]/30 text-sm focus:outline-none focus:border-[#00a472] transition-colors"
                  id="email"
                  placeholder="estudio@numerito.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#45474c]" htmlFor="password">
                  Contraseña
                </label>
                <input
                  className="border-0 border-b-[1.5px] border-[#c5c6cd] bg-transparent py-2 text-[#131b2e] placeholder:text-[#75777d]/30 text-sm focus:outline-none focus:border-[#00a472] transition-colors"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  className="w-3.5 h-3.5 rounded text-[#091426] border-[#c5c6cd] focus:ring-[#091426]"
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label className="text-xs font-medium text-[#45474c]" htmlFor="remember">
                  Recordarme
                </label>
              </div>
              <Link className="text-xs font-semibold text-[#00a472] hover:underline" href="/forgot-password">
                ¿Olvidó su clave?
              </Link>
            </div>

            <button
              className="w-full py-3.5 bg-[#091426] text-white font-bold rounded-xl shadow-lg shadow-[#091426]/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Ingresando...' : 'Ingresar al Sistema'}</span>
              {!loading && (
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#45474c]">
            ¿Aún no tiene cuenta?{' '}
            <Link className="font-bold text-[#091426] hover:underline" href="/register">
              Solicitar Demo
            </Link>
          </p>
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold text-[#75777d] mt-8 lg:mt-0">
          <span>© {new Date().getFullYear()} Numerito</span>
          <div className="flex gap-4">
            <a className="hover:text-[#131b2e] transition-colors" href="#">Privacidad</a>
            <a className="hover:text-[#131b2e] transition-colors" href="#">Soporte</a>
          </div>
        </footer>
      </div>

      {/* Right Section: Visual - hidden on mobile */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden items-center justify-center" style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #091426 100%)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col items-center w-full max-w-2xl text-center px-12">
          <div className="relative mb-16 w-full aspect-[4/3] flex items-center justify-center">
            <svg className="w-full h-full max-h-[400px]" fill="none" viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg">
              <path className="dash-animation" d="M120 225 C 200 225, 250 120, 300 120" stroke="#4edea3" strokeOpacity="0.3" strokeWidth="2" />
              <path className="dash-animation" d="M120 225 C 200 225, 250 330, 300 330" stroke="#4edea3" strokeOpacity="0.3" strokeWidth="2" />
              <path className="dash-animation" d="M480 225 C 400 225, 350 120, 300 120" stroke="#4edea3" strokeOpacity="0.3" strokeWidth="2" />
              <path className="dash-animation" d="M480 225 C 400 225, 350 330, 300 330" stroke="#4edea3" strokeOpacity="0.3" strokeWidth="2" />
              <line className="dash-animation" stroke="#4edea3" strokeOpacity="0.3" strokeWidth="2" x1="120" x2="480" y1="225" y2="225" />

              {/* Estudio */}
              <circle className="node-pulse" cx="120" cy="225" fill="#4edea3" fillOpacity="0.1" r="50" />
              <circle cx="120" cy="225" fill="#091426" r="32" stroke="#4edea3" strokeWidth="1" />
              <text fill="white" fontFamily="Inter" fontSize="10" fontWeight="700" letterSpacing="1" textAnchor="middle" x="120" y="275">ESTUDIO</text>
              <path d="M112 217H128V233H112V217Z" stroke="#4edea3" strokeWidth="1.5" />
              <path d="M115 220H125" stroke="#4edea3" strokeWidth="1" />
              <path d="M115 224H125" stroke="#4edea3" strokeWidth="1" />
              <path d="M115 228H125" stroke="#4edea3" strokeWidth="1" />

              {/* Cliente */}
              <circle className="node-pulse" cx="480" cy="225" fill="#4edea3" fillOpacity="0.1" r="50" />
              <circle cx="480" cy="225" fill="#091426" r="32" stroke="#4edea3" strokeWidth="1" />
              <text fill="white" fontFamily="Inter" fontSize="10" fontWeight="700" letterSpacing="1" textAnchor="middle" x="480" y="275">CLIENTE</text>
              <circle cx="480" cy="222" r="5" stroke="#4edea3" strokeWidth="1.5" />
              <path d="M472 234C472 229 475.582 228 480 228C484.418 228 488 229 488 234" stroke="#4edea3" strokeWidth="1.5" />

              {/* ARCA */}
              <circle className="node-pulse" cx="300" cy="120" fill="#4edea3" fillOpacity="0.1" r="40" />
              <circle cx="300" cy="120" fill="#091426" r="28" stroke="#4edea3" strokeWidth="1" />
              <text fill="white" fontFamily="Inter" fontSize="10" fontWeight="700" letterSpacing="1" textAnchor="middle" x="300" y="165">ARCA</text>
              <path d="M292 122L300 114L308 122V128H292V122Z" stroke="#4edea3" strokeWidth="1.5" />
              <rect height="3" stroke="#4edea3" strokeWidth="1.5" width="20" x="290" y="128" />

              {/* Hub Central */}
              <circle cx="300" cy="225" fill="url(#hubGradient)" r="40" />
              <circle cx="300" cy="225" fill="#4edea3" r="4" />

              <defs>
                <radialGradient cx="50%" cy="50%" id="hubGradient" r="50%">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#091426" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          <div className="space-y-6">
            <h2 className="text-white text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
              Conectando tu estudio <br /> con el futuro contable
            </h2>
            <p className="text-white/70 text-lg xl:text-xl font-medium max-w-md mx-auto">
              Gestión inteligente y sincronizada con ARCA para potenciar la eficiencia de su firma.
            </p>
          </div>
        </div>

        {/* Connection Indicator */}
        <div className="absolute bottom-12 right-12 flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.6)] animate-pulse" />
          <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Sincronización con ARCA: Activa</p>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .dash-animation {
          stroke-dasharray: 8;
          animation: dash 30s linear infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: -1000; }
        }
        .node-pulse {
          animation: pulse 4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </main>
  );
}
