'use client';

import { useState, useRef } from 'react';

export default function Verify2FAPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Ingresá los 6 dígitos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Código inválido');
      }

      const data = await res.json();
      document.cookie = `access_token=${data.accessToken}; path=/; max-age=900`;
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de verificación');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
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
          <header className="space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131b2e]">Verificá tu identidad</h1>
            <p className="text-[#45474c] font-medium leading-relaxed text-sm sm:text-base">
              Ingresá el código de 6 dígitos que enviamos a tu dispositivo vinculado.
            </p>
          </header>

          {error && (
            <div className="rounded-lg bg-[#ffdad6] p-3 text-sm text-[#93000a] font-medium">
              {error}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* 6-digit code input */}
            <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold border-0 border-b-[2px] border-[#c5c6cd] bg-transparent focus:outline-none focus:border-[#00a472] transition-colors"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              className="w-full py-3.5 bg-[#091426] text-white font-bold rounded-xl shadow-lg shadow-[#091426]/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Verificando...' : 'Verificar Código'}</span>
              {!loading && (
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              )}
            </button>
          </form>

          {/* Secondary actions */}
          <div className="space-y-3">
            <button className="flex items-center gap-2 text-sm font-semibold text-[#00a472] hover:underline w-full">
              <span className="material-symbols-outlined text-base">forward_to_inbox</span>
              Reenviar código por email
            </button>
            <button className="flex items-center gap-2 text-sm font-semibold text-[#45474c] hover:text-[#131b2e] transition-colors w-full">
              <span className="material-symbols-outlined text-base">phonelink_setup</span>
              Usar otro método de validación
            </button>
          </div>

          <div className="border-t border-[#c5c6cd]/20 pt-5">
            <p className="text-xs text-[#45474c]">
              ¿Tuviste problemas con el código?{' '}
              <a className="font-bold text-[#091426] hover:underline" href="#">
                Contactá a nuestro equipo de soporte
              </a>
            </p>
          </div>
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
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(78,222,163,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          <div className="w-24 h-24 bg-white/5 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 mb-10">
            <span className="material-symbols-outlined text-[#4edea3] text-5xl">security</span>
          </div>
          <h2 className="text-white text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight mb-6">
            Verificando tu <br /> conexión segura
          </h2>
          <p className="text-white/70 text-lg xl:text-xl font-medium mb-8">
            Mantenemos tus activos protegidos mediante validación de múltiples factores en tiempo real.
          </p>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
            <span className="material-symbols-outlined text-[#4edea3] text-sm">lock</span>
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Sesión Encriptada AES-256</p>
          </div>
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
