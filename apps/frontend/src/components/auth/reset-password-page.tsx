'use client';

import { useState } from 'react';
import { AuthShell, Button } from '@/components';
import { apiFetch } from '@/lib/api-client';

const INPUT = 'h-10 px-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[13.5px] text-[var(--text)] placeholder:text-[var(--text-3)] outline-none focus:border-[var(--brand)] w-full';
const LABEL = 'text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1.5 block font-medium';

function strength(p: string): { label: string; score: number; color: string } {
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

export function ResetPasswordPage() {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const str = strength(pw);
  const match = pw && pw === pw2;
  const canSubmit = str.score >= 3 && match;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      // TODO: verificar endpoint — typically reads token from URL
      const token = new URLSearchParams(window.location.search).get('token');
      await apiFetch('/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password: pw }) });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar contraseña');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Elegí una contraseña segura. Mínimo 8 caracteres, con mayúscula y número.">
      {done ? (
        <div className="text-center py-4">
          <div className="text-[13px] text-[var(--text)] mb-2">Contraseña actualizada</div>
          <a href="/login" className="inline-block mt-4 text-[13px] text-[var(--brand)] hover:underline">Ir al login</a>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="mb-4">
            <label className={LABEL}>Nueva contraseña</label>
            <input type="password" required className={INPUT} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
            {pw && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                  <div style={{ width: `${(str.score / 4) * 100}%`, background: str.color, height: '100%', transition: 'width .2s' }} />
                </div>
                <span className="text-[11px] mono" style={{ color: str.color }}>{str.label}</span>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className={LABEL}>Confirmar contraseña</label>
            <input type="password" required className={INPUT} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
            {pw2 && !match && <div className="mt-1.5 text-[11.5px] text-[var(--rose)]">Las contraseñas no coinciden</div>}
          </div>
          {error && <div className="text-[12.5px] text-[var(--rose)] mb-4">{error}</div>}
          <Button type="submit" variant="primary" disabled={!canSubmit || submitting} className="w-full">
            {submitting ? 'Guardando…' : 'Actualizar contraseña'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
