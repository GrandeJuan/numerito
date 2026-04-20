'use client';

import { useState } from 'react';
import { PageHeader, Pill, type Column, DataTable } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';
import { apiFetch } from '@/lib/api-client';

interface ReglaPropuesta {
  id: number;
  tipoObligacion: string;
  jurisdiccion: string;
  regimen: string;
  terminacionCuit: string;
  diaVencimiento: number;
  mesSiguiente: boolean;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  origen: string;
  estado: string;
  reglaActivaId: number | null;
  reglaActivaDiaVencimiento: number | null;
  reglaActivaMesSiguiente: boolean | null;
  reglaActivaVigenciaDesde: string | null;
  reglaActivaVigenciaHasta: string | null;
  tipoDiff: 'NUEVA' | 'MODIFICADA';
}

export function ReglasPropuestasPage() {
  const { data, loading, error, refetch } = useFetch<ReglaPropuesta[]>(
    '/v1/admin/reglas/propuestas',
  );
  const [actionInProgress, setActionInProgress] = useState<number | 'bloque' | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  async function aprobar(id: number) {
    setActionInProgress(id);
    try {
      await apiFetch(`/v1/admin/reglas/propuestas/${id}/aprobar`, { method: 'PATCH' });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refetch();
    } finally {
      setActionInProgress(null);
    }
  }

  async function rechazar(id: number) {
    setActionInProgress(id);
    try {
      await apiFetch(`/v1/admin/reglas/propuestas/${id}/rechazar`, { method: 'PATCH' });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refetch();
    } finally {
      setActionInProgress(null);
    }
  }

  async function aprobarBloque() {
    if (selected.size === 0) return;
    setActionInProgress('bloque');
    try {
      await apiFetch('/v1/admin/reglas/propuestas/aprobar-bloque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reglaIds: Array.from(selected).map(String) }),
      });
      setSelected(new Set());
      refetch();
    } finally {
      setActionInProgress(null);
    }
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!data) return;
    if (selected.size === data.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.map((r) => r.id)));
    }
  }

  const columns: Column<ReglaPropuesta>[] = [
    {
      header: (
        <input
          type="checkbox"
          checked={!!data?.length && selected.size === data.length}
          onChange={toggleSelectAll}
          className="accent-[var(--brand)]"
        />
      ) as unknown as string,
      render: (r) => (
        <input
          type="checkbox"
          checked={selected.has(r.id)}
          onChange={() => toggleSelect(r.id)}
          className="accent-[var(--brand)]"
        />
      ),
    },
    {
      header: 'Tipo',
      render: (r) => (
        <span className="font-medium text-[var(--text)]">{r.tipoObligacion}</span>
      ),
    },
    {
      header: 'Jurisdicción',
      render: (r) => <span className="text-[var(--text-2)]">{r.jurisdiccion}</span>,
    },
    {
      header: 'Term.',
      render: (r) => (
        <span className="font-mono text-[12px] text-[var(--text-2)]">{r.terminacionCuit}</span>
      ),
    },
    {
      header: 'Día Vto.',
      render: (r) => (
        <DiffCell
          proposed={r.diaVencimiento}
          active={r.reglaActivaDiaVencimiento}
          tipoDiff={r.tipoDiff}
        />
      ),
    },
    {
      header: 'Mes Sig.',
      render: (r) => (
        <DiffCell
          proposed={r.mesSiguiente ? 'Sí' : 'No'}
          active={r.reglaActivaMesSiguiente != null ? (r.reglaActivaMesSiguiente ? 'Sí' : 'No') : null}
          tipoDiff={r.tipoDiff}
        />
      ),
    },
    {
      header: 'Diff',
      render: (r) => (
        <Pill tone={r.tipoDiff === 'NUEVA' ? 'brand' : 'amber'} dot>
          {r.tipoDiff}
        </Pill>
      ),
    },
    {
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={actionInProgress === r.id}
            onClick={() => aprobar(r.id)}
            className="text-[11.5px] px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40"
          >
            {actionInProgress === r.id ? '...' : 'Aprobar'}
          </button>
          <button
            type="button"
            disabled={actionInProgress === r.id}
            onClick={() => rechazar(r.id)}
            className="text-[11.5px] px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-40"
          >
            {actionInProgress === r.id ? '...' : 'Rechazar'}
          </button>
        </div>
      ),
    },
  ];

  const propuestas = data ?? [];

  return (
    <>
      <PageHeader
        title="Reglas Propuestas"
        subtitle="Reglas scrapeadas pendientes de aprobación — revisar diff contra activas"
        actions={
          selected.size > 0 ? (
            <button
              type="button"
              disabled={actionInProgress === 'bloque'}
              onClick={aprobarBloque}
              className="text-[12px] px-3 py-1.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40"
            >
              {actionInProgress === 'bloque'
                ? 'Aprobando...'
                : `Aprobar seleccionadas (${selected.size})`}
            </button>
          ) : undefined
        }
      />
      <PageStateGuard loading={loading} error={error}>
        {propuestas.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-3)]">
            No hay reglas propuestas pendientes de revisión.
          </div>
        ) : (
          <DataTable columns={columns} rows={propuestas} rowKey={(r) => r.id} />
        )}
      </PageStateGuard>
    </>
  );
}

function DiffCell({
  proposed,
  active,
  tipoDiff,
}: {
  proposed: string | number;
  active: string | number | null;
  tipoDiff: 'NUEVA' | 'MODIFICADA';
}) {
  if (tipoDiff === 'NUEVA' || active == null) {
    return (
      <span className="font-mono text-[12px] text-emerald-400">{String(proposed)}</span>
    );
  }
  const changed = String(proposed) !== String(active);
  if (!changed) {
    return <span className="font-mono text-[12px] text-[var(--text-2)]">{String(proposed)}</span>;
  }
  return (
    <span className="font-mono text-[12px]">
      <span className="text-rose-400 line-through mr-1">{String(active)}</span>
      <span className="text-emerald-400">{String(proposed)}</span>
    </span>
  );
}
