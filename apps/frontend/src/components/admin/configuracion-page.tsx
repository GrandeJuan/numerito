'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Card, Section, Button } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';

interface PlatformConfig {
  nombreProducto: string;
  urlPublica: string;
  soporteEmail: string;
  trialDias: number;
  mfaRequerido: boolean;
}

const INPUT = 'h-9 px-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] outline-none focus:border-[var(--brand)] w-full';
const LABEL = 'text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1.5 block font-medium';

export function ConfiguracionAdminPage() {
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<PlatformConfig>('/v1/admin/config');
  const [form, setForm] = useState<PlatformConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await apiFetch('/v1/admin/config', { method: 'PUT', body: JSON.stringify(form) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Configuración" subtitle="Parámetros globales de la plataforma" />
      <PageStateGuard loading={loading} error={error}>
        {form && (
          <form onSubmit={save}>
            <Card>
              <Section title="General">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Nombre del producto</label>
                    <input className={INPUT} value={form.nombreProducto} onChange={(e) => setForm({ ...form, nombreProducto: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>URL pública</label>
                    <input className={INPUT} value={form.urlPublica} onChange={(e) => setForm({ ...form, urlPublica: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Email de soporte</label>
                    <input type="email" className={INPUT} value={form.soporteEmail} onChange={(e) => setForm({ ...form, soporteEmail: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Días de trial</label>
                    <input type="number" className={`${INPUT} mono`} value={form.trialDias} onChange={(e) => setForm({ ...form, trialDias: Number(e.target.value) })} />
                  </div>
                </div>
              </Section>
              <Section title="Seguridad">
                <label className="flex items-center gap-2 text-[13px] text-[var(--text)] cursor-pointer">
                  <input type="checkbox" checked={form.mfaRequerido} onChange={(e) => setForm({ ...form, mfaRequerido: e.target.checked })} className="accent-[var(--brand)] w-4 h-4" />
                  Requerir MFA para todos los usuarios
                </label>
              </Section>
            </Card>
            <div className="flex justify-end mt-5">
              <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
            </div>
          </form>
        )}
      </PageStateGuard>
    </>
  );
}
