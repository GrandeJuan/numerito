'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from './auth-shell';
import { Button } from '../button';
import { useAuth } from '@/lib/auth-context';

export function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Iniciá sesión"
      subtitle="Accedé a tu estudio con tu email y contraseña."
      footer={
        <>
          ¿Problemas para ingresar?{' '}
          <Link
            href="/support"
            className="text-[var(--brand-ink)] font-medium no-underline hover:underline"
          >
            Contactá soporte
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@estudio.com"
            className={inputCls}
            autoComplete="email"
          />
        </Field>

        <Field
          label="Contraseña"
          right={
            <Link
              href="/forgot-password"
              className="text-[11.5px] text-[var(--brand-ink)] no-underline hover:underline"
            >
              ¿Olvidaste?
            </Link>
          }
        >
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
            autoComplete="current-password"
          />
        </Field>

        {error && (
          <div
            role="alert"
            className="text-[12px] text-[var(--rose-ink)] bg-[var(--rose-soft)] border border-[var(--rose)] rounded-[8px] px-3 py-2"
          >
            {error}
          </div>
        )}

        <Button type="submit" variant="brand" disabled={loading} className="mt-2">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </AuthShell>
  );
}

const inputCls =
  'w-full px-3 py-2.5 text-[13px] bg-[var(--surface)] border border-[var(--border)] rounded-[8px] text-[var(--text)] outline-none transition ' +
  'focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-softer)] ' +
  'placeholder:text-[var(--text-4)]';

function Field({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[12px] font-medium text-[var(--text-2)]">{label}</span>
        {right}
      </div>
      {children}
    </label>
  );
}
