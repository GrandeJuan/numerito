'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Token inválido o expirado');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al resetear contraseña');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8ff]">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold text-[#131b2e] mb-2">Contraseña actualizada</h1>
          <p className="text-gray-600 mb-4">Su contraseña fue cambiada exitosamente.</p>
          <a href="/login" className="text-[#00a472] font-semibold hover:underline">
            Ir al login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8ff]">
      <div className="max-w-sm w-full p-8">
        <h1 className="text-2xl font-bold text-[#131b2e] mb-6">Nueva Contraseña</h1>

        {error && (
          <div className="rounded-lg bg-[#ffdad6] p-3 text-sm text-[#93000a] font-medium mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-[#45474c]">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-b-[1.5px] border-[#c5c6cd] bg-transparent py-2 text-sm focus:outline-none focus:border-[#00a472]"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="text-xs font-bold uppercase tracking-widest text-[#45474c]">
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border-b-[1.5px] border-[#c5c6cd] bg-transparent py-2 text-sm focus:outline-none focus:border-[#00a472]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#091426] text-white font-bold rounded-xl disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
