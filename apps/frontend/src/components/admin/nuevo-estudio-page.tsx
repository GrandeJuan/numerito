'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button } from '@/components';
import { apiFetch } from '@/lib/api-client';

interface FormState {
  nombre: string;
  cuit: string;
  planCodigo: string;
  trialDias: number;
  adminEmail: string;
}

const PLANES = [
  { codigo: 'FREE', label: 'Free' },
  { codigo: 'PROFESIONAL', label: 'Profesional' },
  { codigo: 'ENTERPRISE', label: 'Enterprise' },
];

export function NuevoEstudioPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    nombre: '',
    cuit: '',
    planCodigo: 'PROFESIONAL',
    trialDias: 30,
    adminEmail: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/v1/admin/estudios', {
        method: 'POST',
        body: JSON.stringify({
          nombre: form.nombre,
          cuit: form.cuit,
          planCodigo: form.planCodigo,
          trialDias: form.trialDias,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${res.status}`);
      }

      const { data } = await res.json();
      router.push(`/admin/estudios/${data.id}`);
    } catch (err: any) {
      setError(err.message ?? 'Error al crear el estudio');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full h-9 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 text-[13px] text-[var(--text)] outline-none focus:border-[var(--brand)] transition-colors';
  const labelClass = 'block text-[12px] font-medium text-[var(--text-2)] mb-1.5';

  return (
    <>
      <PageHeader
        title="Nuevo estudio"
        subtitle="Alta manual de tenant (onboarding asistido)"
        actions={
          <Button variant="ghost" onClick={() => router.push('/admin/estudios')}>
            Cancelar
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="text-[13px] font-semibold text-[var(--text)]">Datos del estudio</h3>

          <div>
            <label htmlFor="nombre" className={labelClass}>Razón social</label>
            <input
              id="nombre"
              type="text"
              required
              minLength={3}
              value={form.nombre}
              onChange={(e) => updateField('nombre', e.target.value)}
              className={inputClass}
              placeholder="Estudio Contable García & Asociados"
            />
          </div>

          <div>
            <label htmlFor="cuit" className={labelClass}>CUIT</label>
            <input
              id="cuit"
              type="text"
              required
              value={form.cuit}
              onChange={(e) => updateField('cuit', e.target.value)}
              className={inputClass}
              placeholder="20-12345678-6"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="text-[13px] font-semibold text-[var(--text)]">Plan y trial</h3>

          <div>
            <label htmlFor="plan" className={labelClass}>Plan</label>
            <select
              id="plan"
              value={form.planCodigo}
              onChange={(e) => updateField('planCodigo', e.target.value)}
              className={inputClass}
            >
              {PLANES.map((p) => (
                <option key={p.codigo} value={p.codigo}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="trial" className={labelClass}>Días de trial</label>
            <input
              id="trial"
              type="number"
              min={0}
              max={365}
              value={form.trialDias}
              onChange={(e) => updateField('trialDias', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            type="button"
            onClick={() => router.push('/admin/estudios')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creando…' : 'Crear estudio'}
          </Button>
        </div>
      </form>
    </>
  );
}
