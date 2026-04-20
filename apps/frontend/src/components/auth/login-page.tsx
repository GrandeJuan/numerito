'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthShell } from './auth-shell';
import { Button } from '../button';
import { Pill, type PillTone } from '../pill';
import { useAuth } from '@/lib/auth-context';

const DEV_USERS: { email: string; rol: string; tone: PillTone }[] = [
  { email: 'superadmin@numerito.com', rol: 'SUPERADMIN', tone: 'indigo' },
  { email: 'admin@demo.com', rol: 'SOCIO', tone: 'brand' },
  { email: 'responsable@demo.com', rol: 'RESPONSABLE', tone: 'blue' },
  { email: 'empleado@demo.com', rol: 'EMPLEADO', tone: 'amber' },
  { email: 'cliente@demo.com', rol: 'CLIENTE', tone: 'neutral' },
];
const DEV_PASSWORD = 'Admin123!';

const INPUT_BASE =
  'w-full h-[42px] bg-[var(--surface-2)] border border-[var(--border)] rounded-[10px] text-[13.5px] text-[var(--text)] placeholder:text-[var(--text-3)] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_rgba(46,230,168,0.15)]';
const LABEL =
  'block text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1.5 font-medium';

function redirectForRol(rol: string): string {
  if (rol === 'SUPERADMIN') return '/admin';
  if (rol === 'CLIENTE') return '/portal';
  return '/';
}

export function LoginPage() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showDevUsers = process.env.NEXT_PUBLIC_SHOW_DEV_USERS === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  async function doLogin(e: string, p: string) {
    setLoading(true);
    setError(null);
    try {
      const authUser = await login(e, p);
      const redirectParam = searchParams?.get('redirect');
      window.location.href = redirectParam || redirectForRol(authUser.rol);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    doLogin(email, password);
  }

  return (
    <AuthShell
      title="Bienvenido de vuelta"
      subtitle="Ingresá con tu cuenta para acceder al estudio."
      footer={
        <>
          ¿No tenés cuenta?{' '}
          <Link
            href="/signup"
            className="text-[var(--text-2)] hover:text-[var(--text)] font-medium no-underline"
          >
            Probá gratis 30 días
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="email" className={LABEL}>
            Email
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3">
              <MailIcon />
            </div>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@estudio.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className={`${INPUT_BASE} pl-9 pr-3`}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="pw" className={LABEL}>
            Contraseña
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3">
              <LockIcon />
            </div>
            <input
              id="pw"
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className={`${INPUT_BASE} pl-9 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-2.5 p-1 text-[var(--text-3)] hover:text-[var(--text-2)] grid place-items-center"
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-[22px] mt-2">
          <label className="flex items-center gap-2 text-[12.5px] text-[var(--text-2)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(ev) => setRemember(ev.target.checked)}
              className="accent-[var(--brand)] w-[14px] h-[14px]"
            />
            Recordarme
          </label>
          <Link
            href="/forgot-password"
            className="text-[12.5px] text-[var(--text-2)] hover:text-[var(--text)] no-underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 text-[12.5px] text-[var(--rose-ink)] bg-[var(--rose-soft)] border border-[var(--rose)] rounded-[8px] px-3 py-2"
          >
            {error}
          </div>
        )}

        <Button type="submit" variant="brand" disabled={loading} className="w-full h-11">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>

        <div className="flex items-center gap-3 my-[22px] text-[11px] uppercase tracking-[0.1em] text-[var(--text-3)]">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span>o</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <div className="flex gap-2">
          <a
            data-testid="sso-google"
            href={`${apiUrl}/v1/auth/google`}
            className="flex-1 h-10 bg-[var(--surface-2)] border border-[var(--border)] rounded-[10px] text-[var(--text)] text-[12.5px] font-medium cursor-pointer flex items-center justify-center gap-2 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-colors no-underline"
          >
            <GoogleMark />
            Google
          </a>
          <a
            data-testid="sso-microsoft"
            href={`${apiUrl}/v1/auth/microsoft`}
            className="flex-1 h-10 bg-[var(--surface-2)] border border-[var(--border)] rounded-[10px] text-[var(--text)] text-[12.5px] font-medium cursor-pointer flex items-center justify-center gap-2 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-colors no-underline"
          >
            <MicrosoftMark />
            Microsoft
          </a>
        </div>
      </form>

      {showDevUsers && (
        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2 font-medium">
            Dev users · clic para ingresar
          </div>
          <div className="flex flex-col gap-1.5">
            {DEV_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                disabled={loading}
                onClick={() => {
                  setEmail(u.email);
                  setPassword(DEV_PASSWORD);
                  doLogin(u.email, DEV_PASSWORD);
                }}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition text-left disabled:opacity-50"
              >
                <span className="text-[12.5px] text-[var(--text)]">{u.email}</span>
                <Pill tone={u.tone} small>
                  {u.rol}
                </Pill>
              </button>
            ))}
          </div>
          <div className="text-[10.5px] text-[var(--text-4)] mt-2 font-mono">
            password: {DEV_PASSWORD}
          </div>
        </div>
      )}
    </AuthShell>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-[14px] h-[14px] text-[var(--text-3)]"
    >
      <path d="M4 4h16v16H4z" />
      <path d="m4 6 8 7 8-7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-[14px] h-[14px] text-[var(--text-3)]"
    >
      <rect x={4} y={11} width={16} height={10} rx={2} />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-7 0-11-8-11-8a18.4 18.4 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="m1 1 22 22" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3c-2.1 1.5-4.6 2.5-7.3 2.5-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.5l6.3 5.3C41.2 35.2 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 23 23" aria-hidden>
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}
