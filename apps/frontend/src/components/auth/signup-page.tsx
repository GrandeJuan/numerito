'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from './auth-shell';
import { Button } from '../button';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const INPUT_BASE =
  'w-full h-[42px] bg-[var(--surface-2)] border border-[var(--border)] rounded-[10px] text-[13.5px] text-[var(--text)] placeholder:text-[var(--text-3)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_rgba(46,230,168,0.15)] px-3';
const LABEL =
  'block text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1.5 font-medium';

function passwordStrength(p: string): { label: string; score: number; color: string } {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const map = [
    { label: 'Débil', color: 'var(--rose)' },
    { label: 'Débil', color: 'var(--rose)' },
    { label: 'Aceptable', color: 'var(--amber)' },
    { label: 'Buena', color: 'var(--brand)' },
    { label: 'Fuerte', color: 'var(--brand)' },
  ];
  return { score: s, ...map[s] };
}

export function SignupPage() {
  const { login } = useAuth();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const str = passwordStrength(password);
  const canSubmit = nombre.trim() && apellido.trim() && email.trim() && str.score >= 2;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          rol: 'SOCIO',
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error?.message || body?.message || 'Error al crear la cuenta');
      }

      // Auto-login after registration
      await login(email.trim(), password);
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Creá tu cuenta"
      subtitle="Probá Numerito gratis durante 30 días. Sin tarjeta de crédito."
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link
            href="/login"
            className="text-[var(--text-2)] hover:text-[var(--text)] font-medium no-underline"
          >
            Ingresá
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label htmlFor="nombre" className={LABEL}>Nombre</label>
            <input
              id="nombre"
              type="text"
              required
              autoComplete="given-name"
              placeholder="Juan"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={INPUT_BASE}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="apellido" className={LABEL}>Apellido</label>
            <input
              id="apellido"
              type="text"
              required
              autoComplete="family-name"
              placeholder="Pérez"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className={INPUT_BASE}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="email" className={LABEL}>Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@estudio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_BASE}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className={LABEL}>Contraseña</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT_BASE}
          />
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div style={{ width: `${(str.score / 4) * 100}%`, background: str.color, height: '100%', transition: 'width .2s' }} />
              </div>
              <span className="text-[11px] mono" style={{ color: str.color }}>{str.label}</span>
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 text-[12.5px] text-[var(--rose-ink)] bg-[var(--rose-soft)] border border-[var(--rose)] rounded-[8px] px-3 py-2"
          >
            {error}
          </div>
        )}

        <Button type="submit" variant="brand" disabled={!canSubmit || loading} className="w-full h-11">
          {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </Button>

        <p className="mt-4 text-[11px] text-[var(--text-4)] text-center leading-relaxed">
          Al crear tu cuenta aceptás los{' '}
          <Link href="/terms" className="text-[var(--text-3)] hover:text-[var(--text-2)] underline">
            Términos y Condiciones
          </Link>{' '}
          y la{' '}
          <Link href="/privacy" className="text-[var(--text-3)] hover:text-[var(--text-2)] underline">
            Política de Privacidad
          </Link>.
        </p>
      </form>
    </AuthShell>
  );
}
