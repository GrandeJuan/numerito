'use client';

import { useState } from 'react';
import { AuthShell, Button } from '@/components/redesign';
import { apiFetch } from '@/lib/api-client';

const INPUT = 'h-10 px-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[13.5px] text-[var(--text)] placeholder:text-[var(--text-3)] outline-none focus:border-[var(--brand)] w-full';
const LABEL = 'text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1.5 block font-medium';

export function ForgotPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      // TODO: verificar endpoint
      await apiFetch('/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el link');
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviamos un link para que puedas volver a entrar.">
      {sent ? (
        <div className="text-center py-4">
          <div className="text-[13px] text-[var(--text)] mb-2">Revisá tu correo</div>
          <div className="text-[12.5px] text-[var(--text-3)]">Enviamos un link a <span className="mono">{email}</span>.</div>
          <a href="/login" className="inline-block mt-5 text-[13px] text-[var(--brand)] hover:underline">Volver al login</a>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="mb-4">
            <label className={LABEL}>Email</label>
            <input type="email" required className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tu@email.com" />
          </div>
          {error && <div className="text-[12.5px] text-[var(--rose)] mb-4">{error}</div>}
          <Button type="submit" variant="primary" disabled={sending} className="w-full">
            {sending ? 'Enviando…' : 'Enviar link de recuperación'}
          </Button>
          <div className="text-center mt-5 text-[12.5px] text-[var(--text-3)]">
            <a href="/login" className="text-[var(--text-2)] hover:text-[var(--text)]">← Volver al login</a>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
