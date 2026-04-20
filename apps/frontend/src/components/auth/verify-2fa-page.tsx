'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AuthShell, Button } from '@/components';
import { apiFetch } from '@/lib/api-client';

const RESEND_COOLDOWN_S = 30;

export function Verify2FAPage() {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function onChange(i: number, v: string) {
    const digit = v.replace(/\D/g, '').slice(-1);
    setCode((c) => {
      const n = [...c];
      n[i] = digit;
      return n;
    });
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = text.split('').concat(Array(6 - text.length).fill(''));
    setCode(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const full = code.join('');
    if (full.length !== 6) return;
    setVerifying(true);
    setError(null);
    try {
      await apiFetch('/v1/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ code: full }) });
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido');
      setCode(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  const resend = useCallback(async () => {
    if (resendCooldown > 0 || resendStatus === 'sending') return;
    setResendStatus('sending');
    setError(null);
    try {
      await apiFetch('/v1/auth/2fa/resend', { method: 'POST' });
      setResendStatus('sent');
      setResendCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setResendStatus('error');
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código');
    }
  }, [resendCooldown, resendStatus]);

  const resendDisabled = resendCooldown > 0 || resendStatus === 'sending';

  return (
    <AuthShell title="Verificación 2FA" subtitle="Ingresá el código de 6 dígitos de tu app autenticadora.">
      <form onSubmit={submit}>
        <div className="flex justify-center gap-2 mb-6" onPaste={onPaste}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="w-11 h-12 text-center text-[18px] font-semibold mono bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] outline-none focus:border-[var(--brand)]"
            />
          ))}
        </div>
        {error && <div className="text-[12.5px] text-[var(--rose)] mb-4 text-center">{error}</div>}
        <Button type="submit" variant="primary" disabled={verifying || code.join('').length !== 6} className="w-full">
          {verifying ? 'Verificando…' : 'Verificar'}
        </Button>
        <div className="text-center mt-5 text-[12.5px] text-[var(--text-3)]">
          ¿No te llegó?{' '}
          <button
            type="button"
            onClick={resend}
            disabled={resendDisabled}
            className={`${resendDisabled ? 'text-[var(--text-4)] cursor-not-allowed' : 'text-[var(--brand)] hover:underline'}`}
          >
            {resendStatus === 'sending'
              ? 'Reenviando…'
              : resendCooldown > 0
                ? `Reenviar código (${resendCooldown}s)`
                : 'Reenviar código'}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
