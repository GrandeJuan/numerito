'use client';

import { useState } from 'react';
import { PageHeader, Pill, type Column, DataTable } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';
import { apiFetch } from '@/lib/api-client';

interface ConfiguracionIngesta {
  id: string;
  fuente: string;
  habilitado: boolean;
  cadenciaDias: number;
  proximaEjecucion: string | null;
  ultimaEjecucion: string | null;
  ultimoResultado: string | null;
}

const FUENTE_LABEL: Record<string, string> = {
  ARCA: 'ARCA (AFIP)',
  ARBA: 'ARBA (Buenos Aires)',
  AGIP: 'AGIP (CABA)',
  BCRA_FERIADOS: 'BCRA Feriados',
};

export function IntegracionesAdminPage() {
  const { data, loading, error, refetch } = useFetch<ConfiguracionIngesta[]>(
    '/v1/admin/ingesta/configuraciones',
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function toggleHabilitado(config: ConfiguracionIngesta) {
    setSaving(config.id);
    try {
      await apiFetch(`/v1/admin/ingesta/configuraciones/${config.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habilitado: !config.habilitado }),
      });
      refetch();
    } finally {
      setSaving(null);
    }
  }

  async function updateCadencia(config: ConfiguracionIngesta, cadenciaDias: number) {
    if (cadenciaDias < 1 || cadenciaDias === config.cadenciaDias) return;
    setSaving(config.id);
    try {
      await apiFetch(`/v1/admin/ingesta/configuraciones/${config.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadenciaDias }),
      });
      refetch();
    } finally {
      setSaving(null);
    }
  }

  const columns: Column<ConfiguracionIngesta>[] = [
    {
      header: 'Fuente',
      render: (r) => (
        <span className="font-medium text-[var(--text)]">
          {FUENTE_LABEL[r.fuente] ?? r.fuente}
        </span>
      ),
    },
    {
      header: 'Estado',
      render: (r) => (
        <Pill tone={r.habilitado ? 'brand' : 'neutral'} dot>
          {r.habilitado ? 'Habilitada' : 'Deshabilitada'}
        </Pill>
      ),
    },
    {
      header: 'Cadencia (días)',
      render: (r) => (
        <CadenciaInput
          value={r.cadenciaDias}
          disabled={saving === r.id}
          onCommit={(v) => updateCadencia(r, v)}
        />
      ),
    },
    {
      header: 'Última ejecución',
      render: (r) =>
        r.ultimaEjecucion ? (
          <span className="font-mono text-[11.5px] text-[var(--text-2)]">
            {new Date(r.ultimaEjecucion).toLocaleString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ) : (
          <span className="text-[11.5px] text-[var(--text-3)]">—</span>
        ),
    },
    {
      header: 'Resultado',
      render: (r) =>
        r.ultimoResultado ? (
          <span className="text-[11.5px] text-[var(--text-2)]">{r.ultimoResultado}</span>
        ) : (
          <span className="text-[11.5px] text-[var(--text-3)]">—</span>
        ),
    },
    {
      header: '',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          disabled={saving === r.id}
          onClick={() => toggleHabilitado(r)}
          className="text-[12px] px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving === r.id ? '...' : r.habilitado ? 'Deshabilitar' : 'Habilitar'}
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Configuración de Ingesta"
        subtitle="Fuentes de scraping del calendario oficial — habilitar, cadencia, estado"
      />
      <PageStateGuard loading={loading} error={error}>
        <DataTable columns={columns} rows={data ?? []} rowKey={(r) => r.id} />
      </PageStateGuard>
    </>
  );
}

function CadenciaInput({
  value,
  disabled,
  onCommit,
}: {
  value: number;
  disabled: boolean;
  onCommit: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (!editing) {
    return (
      <button
        type="button"
        className="font-mono text-[12px] text-[var(--text-2)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-none"
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
      >
        {value}d
      </button>
    );
  }

  return (
    <input
      type="number"
      min={1}
      value={draft}
      disabled={disabled}
      autoFocus
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        const n = parseInt(draft, 10);
        if (!isNaN(n) && n >= 1) onCommit(n);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === 'Escape') {
          setEditing(false);
        }
      }}
      className="w-14 h-6 font-mono text-[12px] text-[var(--text)] bg-[var(--surface)] border border-[var(--brand)] rounded px-1.5 outline-none text-center"
    />
  );
}
