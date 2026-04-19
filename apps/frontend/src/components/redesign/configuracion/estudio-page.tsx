'use client';

import { useState, useEffect } from 'react';
import { Card, Section, Button } from '@/components/redesign';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';

interface EstudioData {
  razonSocial: string;
  cuit: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  email: string;
  telefono: string;
}

const INPUT = 'h-9 px-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] outline-none focus:border-[var(--brand)] w-full';
const LABEL = 'text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1.5 block font-medium';

export function EstudioConfigPage() {
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<EstudioData>('/v1/estudio/config');
  const [form, setForm] = useState<EstudioData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      // TODO: verificar endpoint
      await apiFetch('/v1/estudio/config', { method: 'PUT', body: JSON.stringify(form) });
    } finally {
      setSaving(false);
    }
  }

  const update = (k: keyof EstudioData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  return (
    <PageStateGuard loading={loading} error={error}>
      {form && (
        <form onSubmit={handleSave}>
          <Card>
            <Section title="Identificación" subtitle="Datos fiscales del estudio">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Razón social</label>
                  <input className={INPUT} value={form.razonSocial} onChange={update('razonSocial')} />
                </div>
                <div>
                  <label className={LABEL}>CUIT</label>
                  <input className={`${INPUT} mono`} value={form.cuit} onChange={update('cuit')} />
                </div>
              </div>
            </Section>

            <Section title="Dirección">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className={LABEL}>Dirección</label>
                  <input className={INPUT} value={form.direccion} onChange={update('direccion')} />
                </div>
                <div>
                  <label className={LABEL}>Ciudad</label>
                  <input className={INPUT} value={form.ciudad} onChange={update('ciudad')} />
                </div>
                <div>
                  <label className={LABEL}>Provincia</label>
                  <input className={INPUT} value={form.provincia} onChange={update('provincia')} />
                </div>
              </div>
            </Section>

            <Section title="Contacto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Email</label>
                  <input type="email" className={INPUT} value={form.email} onChange={update('email')} />
                </div>
                <div>
                  <label className={LABEL}>Teléfono</label>
                  <input className={INPUT} value={form.telefono} onChange={update('telefono')} />
                </div>
              </div>
            </Section>
          </Card>

          <div className="flex justify-end gap-3 mt-5">
            <Button variant="ghost" type="button">Cancelar</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      )}
    </PageStateGuard>
  );
}
