'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Silent — don't reveal if email exists
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen bg-[#faf8ff] font-[Inter] text-[#131b2e] antialiased">
      {/* Left Section: Form */}
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
          {!sent ? (
            <>
              <header className="space-y-3 sm:space-y-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131b2e]">Recuperar Acceso</h1>
                <p className="text-[#45474c] font-medium leading-relaxed text-sm sm:text-base">
                  Ingresá tu correo electrónico para recibir un enlace de recuperación.
                </p>
              </header>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#45474c]" htmlFor="email">
                    Correo de identidad
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

                <button
                  className="w-full py-3.5 bg-[#091426] text-white font-bold rounded-xl shadow-lg shadow-[#091426]/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? 'Enviando...' : 'Enviar enlace de recuperación'}</span>
                  {!loading && (
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  )}
                </button>
              </form>

              <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-[#45474c] hover:text-[#131b2e] transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Volver al Inicio de Sesión
              </Link>
            </>
          ) : (
            <>
              <header className="space-y-3 sm:space-y-4">
                <div className="w-16 h-16 bg-[#00301e] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#4edea3] text-3xl">mark_email_read</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131b2e] text-center">Enlace enviado</h1>
                <p className="text-[#45474c] font-medium leading-relaxed text-sm sm:text-base text-center">
                  Si el correo está registrado, vas a recibir instrucciones para recuperar tu acceso.
                </p>
              </header>

              <Link href="/login" className="block">
                <button className="w-full py-3.5 bg-[#091426] text-white font-bold rounded-xl shadow-lg shadow-[#091426]/20 hover:opacity-90 transition-all">
                  Volver al Inicio de Sesión
                </button>
              </Link>
            </>
          )}

          {/* Security info */}
          <div className="bg-[#f2f3ff] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#091426] text-lg">verified_user</span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#091426]">Protección en cada paso</h2>
            </div>
            <p className="text-xs text-[#45474c] leading-relaxed">
              Utilizamos estándares de seguridad bancaria para garantizar que solo vos puedas acceder a tu información.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00a472]">
              <span className="material-symbols-outlined text-xs">lock</span>
              Sesión Encriptada de Extremo a Extremo
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold text-[#75777d] mt-8 lg:mt-0">
          <span>© {new Date().getFullYear()} Numerito</span>
          <div className="flex gap-4">
            <a className="hover:text-[#131b2e] transition-colors" href="/privacy">Privacidad</a>
            <a className="hover:text-[#131b2e] transition-colors" href="/support">Soporte</a>
          </div>
        </footer>
      </div>

      {/* Right Section: Visual - hidden on mobile */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden items-center justify-center" style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #091426 100%)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(78,222,163,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          <div className="w-24 h-24 bg-white/5 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 mb-10">
            <span className="material-symbols-outlined text-[#4edea3] text-5xl">shield_lock</span>
          </div>
          <h2 className="text-white text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight mb-6">
            Tu seguridad es <br /> nuestra prioridad
          </h2>
          <p className="text-white/70 text-lg xl:text-xl font-medium">
            Recuperá el acceso a tu cuenta de forma segura y verificada.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
    </main>
  );
}
