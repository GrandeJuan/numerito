'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader, Pill, type Column, DataTable } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';
import { apiFetch } from '@/lib/api-client';
import { parseApiResponse, ApiResponseError } from '@/lib/parse-api-response';

interface ConfiguracionIngesta {
  id: string;
  fuente: string;
  habilitado: boolean;
  cadenciaDias: number;
  proximaEjecucion: string | null;
  ultimaEjecucion: string | null;
  ultimoResultado: string | null;
}

interface EjecucionIngesta {
  id: string;
  fuente: string;
  estado: 'EN_CURSO' | 'EXITOSA' | 'FALLIDA';
  inicio: string;
  fin: string | null;
  reglasNuevas: number;
  reglasModificadas: number;
  errores: string[];
}

interface EjecutarAhoraResult {
  mode: 'sync' | 'async';
  fuente: string;
  ejecucionId: string;
  alreadyRunning?: boolean;
}

const FUENTE_LABEL: Record<string, string> = {
  ARCA: 'ARCA (AFIP)',
  ARBA: 'ARBA (Buenos Aires)',
  AGIP: 'AGIP (CABA)',
  BCRA_FERIADOS: 'BCRA Feriados',
};

const POLL_INTERVAL_MS = 2000;

function errorMessage(err: unknown): string {
  if (err instanceof ApiResponseError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}

export function IntegracionesAdminPage() {
  const { data, loading, error, refetch } = useFetch<ConfiguracionIngesta[]>(
    '/v1/admin/ingesta/configuraciones',
  );
  const [saving, setSaving] = useState<string | null>(null);
  // Map of fuente → { ejecucionId, startedAt } for actively-polling executions.
  // Source of truth is the backend (ejecucion_ingesta table). Seeded on mount
  // from /ejecuciones?estado=EN_CURSO so navigating away/back or refreshing
  // doesn't lose the running state.
  const [running, setRunning] = useState<
    Record<string, { ejecucionId: string; startedAt: number }>
  >({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/v1/admin/ingesta/ejecuciones?estado=EN_CURSO');
        const { data: items } = await parseApiResponse<EjecucionIngesta[]>(res);
        if (cancelled) return;
        const next: Record<string, { ejecucionId: string; startedAt: number }> = {};
        for (const e of items) {
          next[e.fuente] = { ejecucionId: e.id, startedAt: Date.parse(e.inicio) };
        }
        setRunning(next);
      } catch {
        // Silent — table will just show no running badge. Next refetch recovers.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function ejecutarAhora(fuente: string) {
    try {
      const res = await apiFetch(`/v1/admin/ingesta/${fuente}/ejecutar-ahora`, {
        method: 'POST',
      });
      const { data: result } = await parseApiResponse<EjecutarAhoraResult>(res);
      if (result.alreadyRunning) {
        toast.info(`${FUENTE_LABEL[fuente] ?? fuente} ya está corriendo`, {
          description: 'Mostrando el progreso de la ejecución en curso.',
        });
        // Fetch the existing record so we use its real start time instead of Date.now().
        try {
          const detail = await apiFetch(`/v1/admin/ingesta/ejecuciones/${result.ejecucionId}`);
          const { data: ejec } = await parseApiResponse<EjecucionIngesta>(detail);
          setRunning((prev) => ({
            ...prev,
            [fuente]: { ejecucionId: ejec.id, startedAt: Date.parse(ejec.inicio) },
          }));
        } catch {
          setRunning((prev) => ({
            ...prev,
            [fuente]: { ejecucionId: result.ejecucionId, startedAt: Date.now() },
          }));
        }
      } else {
        toast.info(`Scraping ${FUENTE_LABEL[fuente] ?? fuente} iniciado…`);
        setRunning((prev) => ({
          ...prev,
          [fuente]: { ejecucionId: result.ejecucionId, startedAt: Date.now() },
        }));
      }
    } catch (err) {
      toast.error(`No se pudo iniciar ${FUENTE_LABEL[fuente] ?? fuente}`, {
        description: errorMessage(err),
      });
    }
  }

  async function toggleHabilitado(config: ConfiguracionIngesta) {
    setSaving(config.id);
    try {
      const res = await apiFetch(`/v1/admin/ingesta/configuraciones/${config.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habilitado: !config.habilitado }),
      });
      await parseApiResponse(res);
      refetch();
    } catch (err) {
      toast.error('No se pudo actualizar la configuración', { description: errorMessage(err) });
    } finally {
      setSaving(null);
    }
  }

  async function updateCadencia(config: ConfiguracionIngesta, cadenciaDias: number) {
    if (cadenciaDias < 1 || cadenciaDias === config.cadenciaDias) return;
    setSaving(config.id);
    try {
      const res = await apiFetch(`/v1/admin/ingesta/configuraciones/${config.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadenciaDias }),
      });
      await parseApiResponse(res);
      refetch();
    } catch (err) {
      toast.error('No se pudo actualizar la cadencia', { description: errorMessage(err) });
    } finally {
      setSaving(null);
    }
  }

  const columns: Column<ConfiguracionIngesta>[] = [
    {
      header: 'Fuente',
      render: (r) => (
        <span className="font-medium text-[var(--text)]">{FUENTE_LABEL[r.fuente] ?? r.fuente}</span>
      ),
    },
    {
      header: 'Schedule',
      render: (r) => (
        <Pill tone={r.habilitado ? 'brand' : 'neutral'} dot>
          {r.habilitado ? `Cada ${r.cadenciaDias}d` : 'Apagado'}
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
      render: (r) => {
        const active = running[r.fuente];
        if (active) {
          return <RunningBadge startedAt={active.startedAt} />;
        }
        return r.ultimoResultado ? (
          <span className="text-[11.5px] text-[var(--text-2)]">{r.ultimoResultado}</span>
        ) : (
          <span className="text-[11.5px] text-[var(--text-3)]">—</span>
        );
      },
    },
    {
      header: '',
      align: 'right',
      render: (r) => {
        const isRunning = !!running[r.fuente];
        return (
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => ejecutarAhora(r.fuente)}
              className="text-[11.5px] px-2 py-0.5 rounded border border-[var(--brand)]/30 bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)]/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRunning ? 'En curso…' : 'Ejecutar'}
            </button>
            <button
              type="button"
              disabled={saving === r.id}
              onClick={() => toggleHabilitado(r)}
              title={
                r.habilitado
                  ? 'Apagar ejecución automática (dejará de correr cada X días)'
                  : 'Encender ejecución automática según la cadencia'
              }
              className="text-[11.5px] px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving === r.id ? '...' : r.habilitado ? 'Apagar schedule' : 'Encender schedule'}
            </button>
          </div>
        );
      },
    },
  ];

  // Poll each actively-running ejecucion until it reaches a terminal state.
  // Kept in a single effect keyed on the running map to avoid per-fuente timer leaks.
  useEffect(() => {
    const keys = Object.keys(running);
    if (keys.length === 0) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      for (const fuente of keys) {
        const active = running[fuente];
        if (!active) continue;
        try {
          const res = await apiFetch(`/v1/admin/ingesta/ejecuciones/${active.ejecucionId}`);
          const { data: ejec } = await parseApiResponse<EjecucionIngesta>(res);
          if (cancelled) return;
          if (ejec.estado === 'EN_CURSO') continue;

          setRunning((prev) => {
            const next = { ...prev };
            delete next[fuente];
            return next;
          });
          if (ejec.estado === 'EXITOSA') {
            toast.success(`${FUENTE_LABEL[fuente] ?? fuente} completado`, {
              description: `${ejec.reglasNuevas} nuevas, ${ejec.reglasModificadas} modificadas`,
            });
          } else {
            toast.error(`${FUENTE_LABEL[fuente] ?? fuente} falló`, {
              description: ejec.errores[0] ?? 'Sin detalles',
            });
          }
          refetch();
        } catch (err) {
          if (cancelled) return;
          toast.error(`Error consultando estado de ${FUENTE_LABEL[fuente] ?? fuente}`, {
            description: errorMessage(err),
          });
          setRunning((prev) => {
            const next = { ...prev };
            delete next[fuente];
            return next;
          });
        }
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [running, refetch]);

  return (
    <>
      <PageHeader
        title="Configuración de Ingesta"
        subtitle='Fuentes de scraping del calendario oficial. "Ejecutar" dispara un scrape ya. El schedule corre cada N días cuando está encendido.'
        actions={
          <Link
            href="/admin/integraciones/ejecuciones"
            className="text-[12px] px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--brand)] no-underline"
          >
            Ver historial de ejecuciones
          </Link>
        }
      />
      <PageStateGuard loading={loading} error={error}>
        <DataTable columns={columns} rows={data ?? []} rowKey={(r) => r.id} />
      </PageStateGuard>
    </>
  );
}

function RunningBadge({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [startedAt]);

  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--brand)]">
      <span className="inline-block w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
      Scrapeando… {elapsed}s
    </span>
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
