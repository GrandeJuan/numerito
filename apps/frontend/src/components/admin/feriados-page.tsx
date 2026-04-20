'use client';

import { useState } from 'react';
import { PageHeader, Pill, type Column, DataTable } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';
import { apiFetch } from '@/lib/api-client';

interface Feriado {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  jurisdiccionAfectada: string | null;
}

const TIPO_LABEL: Record<string, string> = {
  NACIONAL: 'Nacional',
  BANCARIO: 'Bancario',
  PROVINCIAL: 'Provincial',
  MUNICIPAL: 'Municipal',
};

const TIPO_TONE: Record<string, 'brand' | 'neutral' | 'warning' | 'danger'> = {
  NACIONAL: 'brand',
  BANCARIO: 'warning',
  PROVINCIAL: 'neutral',
  MUNICIPAL: 'neutral',
};

const TIPOS = ['NACIONAL', 'BANCARIO', 'PROVINCIAL', 'MUNICIPAL'] as const;
const JURISDICCIONES = ['ARCA', 'ARBA', 'AGIP', 'COMISION_ARBITRAL'] as const;

export function FeriadosAdminPage() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);
  const [tipoFilter, setTipoFilter] = useState('');
  const { data, loading, error, refetch } = useFetch<Feriado[]>(
    `/v1/admin/feriados?anio=${anio}${tipoFilter ? `&tipo=${tipoFilter}` : ''}`,
  );

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formFecha, setFormFecha] = useState('');
  const [formTipo, setFormTipo] = useState<string>('NACIONAL');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formJurisdiccion, setFormJurisdiccion] = useState<string>('');

  function resetForm() {
    setFormFecha('');
    setFormTipo('NACIONAL');
    setFormDescripcion('');
    setFormJurisdiccion('');
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(f: Feriado) {
    setFormFecha(f.fecha);
    setFormTipo(f.tipo);
    setFormDescripcion(f.descripcion);
    setFormJurisdiccion(f.jurisdiccionAfectada ?? '');
    setEditingId(f.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formFecha || !formDescripcion) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        fecha: formFecha,
        tipo: formTipo,
        descripcion: formDescripcion,
        jurisdiccionAfectada: formJurisdiccion || null,
      };

      if (editingId) {
        await apiFetch(`/v1/admin/feriados/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/v1/admin/feriados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      resetForm();
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await apiFetch(`/v1/admin/feriados/${id}`, { method: 'DELETE' });
      refetch();
    } finally {
      setDeleting(null);
    }
  }

  const columns: Column<Feriado>[] = [
    {
      header: 'Fecha',
      render: (r) => (
        <span className="font-mono text-[12px] text-[var(--text)]">
          {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Tipo',
      render: (r) => (
        <Pill tone={TIPO_TONE[r.tipo] ?? 'neutral'} dot>
          {TIPO_LABEL[r.tipo] ?? r.tipo}
        </Pill>
      ),
    },
    {
      header: 'Descripcion',
      render: (r) => (
        <span className="text-[12px] text-[var(--text)]">{r.descripcion}</span>
      ),
    },
    {
      header: 'Jurisdiccion',
      render: (r) => (
        <span className="text-[11.5px] text-[var(--text-2)]">
          {r.jurisdiccionAfectada ?? 'Todas'}
        </span>
      ),
    },
    {
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => startEdit(r)}
            className="text-[11.5px] px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Editar
          </button>
          <button
            type="button"
            disabled={deleting === r.id}
            onClick={() => handleDelete(r.id)}
            className="text-[11.5px] px-2 py-0.5 rounded border border-[var(--rose)]/30 bg-[var(--rose)]/10 text-[var(--rose)] hover:bg-[var(--rose)]/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting === r.id ? '...' : 'Eliminar'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Feriados"
        subtitle="Calendario de feriados nacionales, bancarios y provinciales"
        actions={
          <button
            type="button"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="text-[12px] px-3 py-1.5 rounded border border-[var(--brand)]/30 bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)]/20 no-underline"
          >
            + Agregar feriado
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="text-[12px] px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
        >
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="text-[12px] px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{TIPO_LABEL[t]}</option>
          ))}
        </select>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="mb-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="text-[13px] font-medium text-[var(--text)] mb-3">
            {editingId ? 'Editar feriado' : 'Nuevo feriado'}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] text-[var(--text-2)] mb-1 block">Fecha</label>
              <input
                type="date"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
                className="w-full text-[12px] px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--text-2)] mb-1 block">Tipo</label>
              <select
                value={formTipo}
                onChange={(e) => setFormTipo(e.target.value)}
                className="w-full text-[12px] px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{TIPO_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[var(--text-2)] mb-1 block">Descripcion</label>
              <input
                type="text"
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Ej: Dia del Trabajador"
                className="w-full text-[12px] px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--text-2)] mb-1 block">
                Jurisdiccion (solo provincial/municipal)
              </label>
              <select
                value={formJurisdiccion}
                onChange={(e) => setFormJurisdiccion(e.target.value)}
                disabled={formTipo === 'NACIONAL' || formTipo === 'BANCARIO'}
                className="w-full text-[12px] px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] disabled:opacity-40"
              >
                <option value="">Todas</option>
                {JURISDICCIONES.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving || !formFecha || !formDescripcion}
              onClick={handleSave}
              className="text-[12px] px-3 py-1.5 rounded bg-[var(--brand)] text-[var(--brand-on)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="text-[12px] px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <PageStateGuard loading={loading} error={error}>
        <DataTable columns={columns} rows={data ?? []} rowKey={(r) => r.id} />
        {data && data.length === 0 && (
          <div className="text-center text-[12px] text-[var(--text-3)] py-8">
            No hay feriados cargados para {anio}.
          </div>
        )}
      </PageStateGuard>
    </>
  );
}
