'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Pill, type Column, DataTable } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';
import { apiFetch } from '@/lib/api-client';
import { parseApiResponse, ApiResponseError } from '@/lib/parse-api-response';

interface EjecucionIngesta {
  id: string;
  fuente: string;
  estado: string;
  disparador: string;
  disparadoPor: string | null;
  ingestaId: string | null;
  inicio: string;
  fin: string | null;
  reglasNuevas: number;
  reglasModificadas: number;
  errores: string[];
}

const FUENTE_LABEL: Record<string, string> = {
  ARCA: 'ARCA (AFIP)',
  ARBA: 'ARBA (Buenos Aires)',
  AGIP: 'AGIP (CABA)',
  BCRA_FERIADOS: 'BCRA Feriados',
};

const FUENTES = ['', 'ARCA', 'ARBA', 'AGIP', 'BCRA_FERIADOS'] as const;
const ESTADOS = ['', 'EN_CURSO', 'EXITOSA', 'FALLIDA'] as const;

const ESTADO_TONE: Record<string, 'brand' | 'amber' | 'neutral' | 'indigo'> = {
  EN_CURSO: 'indigo',
  EXITOSA: 'brand',
  FALLIDA: 'amber',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(inicio: string, fin: string | null): string {
  if (!fin) return '—';
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ${secs % 60}s`;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiResponseError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}

export function EjecucionesHistorialPage() {
  const [fuenteFilter, setFuenteFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [logsExpanded, setLogsExpanded] = useState<Set<string>>(new Set());
  const [launching, setLaunching] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (fuenteFilter) params.set('fuente', fuenteFilter);
  if (estadoFilter) params.set('estado', estadoFilter);

  const { data, loading, error, refetch } = useFetch<EjecucionIngesta[]>(
    `/v1/admin/ingesta/ejecuciones?${params.toString()}`,
  );

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleLogs(id: string) {
    setLogsExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function ejecutarAhora(fuente: string) {
    setLaunching(fuente);
    try {
      const res = await apiFetch(`/v1/admin/ingesta/${fuente}/ejecutar-ahora`, {
        method: 'POST',
      });
      await parseApiResponse(res);
      toast.info(`Scraping ${FUENTE_LABEL[fuente] ?? fuente} iniciado…`);
      refetch();
    } catch (err) {
      toast.error(`No se pudo iniciar ${FUENTE_LABEL[fuente] ?? fuente}`, {
        description: errorMessage(err),
      });
    } finally {
      setLaunching(null);
    }
  }

  const columns: Column<EjecucionIngesta>[] = [
    {
      header: 'Fuente',
      render: (r) => (
        <span className="font-medium text-[var(--text)]">{FUENTE_LABEL[r.fuente] ?? r.fuente}</span>
      ),
    },
    {
      header: 'Estado',
      render: (r) => (
        <Pill tone={ESTADO_TONE[r.estado] ?? 'neutral'} dot>
          {r.estado}
        </Pill>
      ),
    },
    {
      header: 'Disparador',
      render: (r) => (
        <span className="text-[11.5px] text-[var(--text-2)]">
          {r.disparador}
          {r.disparadoPor ? ` (${r.disparadoPor})` : ''}
        </span>
      ),
    },
    {
      header: 'Inicio',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--text-2)]">{formatDate(r.inicio)}</span>
      ),
    },
    {
      header: 'Duración',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--text-2)]">
          {formatDuration(r.inicio, r.fin)}
        </span>
      ),
    },
    {
      header: 'Reglas',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--text-2)]">
          {r.reglasNuevas > 0 && <span className="text-emerald-400 mr-1.5">+{r.reglasNuevas}</span>}
          {r.reglasModificadas > 0 && (
            <span className="text-amber-400 mr-1.5">~{r.reglasModificadas}</span>
          )}
          {r.reglasNuevas === 0 && r.reglasModificadas === 0 && '—'}
        </span>
      ),
    },
    {
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => toggleLogs(r.id)}
            className="text-[11.5px] px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--brand)]"
          >
            {logsExpanded.has(r.id) ? 'Ocultar logs' : 'Ver logs'}
          </button>
          {r.errores.length > 0 && (
            <button
              type="button"
              onClick={() => toggleExpand(r.id)}
              className="text-[11.5px] px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
            >
              {expanded.has(r.id)
                ? 'Ocultar'
                : `${r.errores.length} error${r.errores.length > 1 ? 'es' : ''}`}
            </button>
          )}
        </div>
      ),
    },
  ];

  const ejecuciones = data ?? [];

  return (
    <>
      <PageHeader
        title="Historial de Ejecuciones"
        subtitle="Audit trail de scraping — estado, duración, reglas procesadas, errores"
        actions={
          <div className="flex gap-2">
            {(['ARCA', 'ARBA', 'AGIP', 'BCRA_FERIADOS'] as const).map((fuente) => (
              <button
                key={fuente}
                type="button"
                disabled={launching === fuente}
                onClick={() => ejecutarAhora(fuente)}
                className="text-[11.5px] px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--brand)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {launching === fuente ? '...' : `Ejecutar ${fuente}`}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex gap-3 mb-4">
        <select
          value={fuenteFilter}
          onChange={(e) => setFuenteFilter(e.target.value)}
          className="text-[12px] px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)]"
        >
          {FUENTES.map((f) => (
            <option key={f} value={f}>
              {f ? (FUENTE_LABEL[f] ?? f) : 'Todas las fuentes'}
            </option>
          ))}
        </select>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="text-[12px] px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)]"
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e || 'Todos los estados'}
            </option>
          ))}
        </select>
      </div>

      <PageStateGuard loading={loading} error={error}>
        {ejecuciones.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-3)]">
            No hay ejecuciones registradas
            {fuenteFilter || estadoFilter ? ' con los filtros seleccionados' : ''}.
          </div>
        ) : (
          <>
            <DataTable columns={columns} rows={ejecuciones} rowKey={(r) => r.id} />
            {ejecuciones.map((ej) => (
              <div key={`panels-${ej.id}`}>
                {expanded.has(ej.id) && (
                  <div className="mt-1 mb-3 mx-2 p-3 rounded bg-rose-500/5 border border-rose-500/20">
                    <div className="text-[11px] text-rose-400 font-medium mb-1.5">
                      Errores — {FUENTE_LABEL[ej.fuente] ?? ej.fuente} — {formatDate(ej.inicio)}
                    </div>
                    <ul className="space-y-1">
                      {ej.errores.map((err, i) => (
                        <li
                          key={i}
                          className="text-[11.5px] text-rose-300/80 font-mono leading-relaxed"
                        >
                          {err}
                        </li>
                      ))}
                    </ul>
                    {ej.ingestaId && (
                      <div className="mt-2 text-[10.5px] text-[var(--text-3)]">
                        ingestaId: <span className="font-mono">{ej.ingestaId}</span>
                      </div>
                    )}
                  </div>
                )}
                {logsExpanded.has(ej.id) && <LogsPanel ejecucion={ej} />}
              </div>
            ))}
          </>
        )}
      </PageStateGuard>
    </>
  );
}

const LOG_POLL_INTERVAL_MS = 3000;

function LogsPanel({ ejecucion }: { ejecucion: EjecucionIngesta }) {
  const [logs, setLogs] = useState<string>('Cargando…');
  const [loading, setLoading] = useState(true);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLogs() {
      try {
        const res = await apiFetch(`/v1/admin/ingesta/ejecuciones/${ejecucion.id}/logs`);
        const { data: result } = await parseApiResponse<{ logs: string }>(res);
        if (cancelled) return;
        setLogs(result.logs || '(sin salida)');
      } catch (err) {
        if (cancelled) return;
        setLogs(`Error leyendo logs: ${errorMessage(err)}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLogs();

    // Keep polling while the run is still in progress so the user sees
    // the scraper's stdout as it happens.
    const timer =
      ejecucion.estado === 'EN_CURSO' ? setInterval(fetchLogs, LOG_POLL_INTERVAL_MS) : null;

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [ejecucion.id, ejecucion.estado]);

  useEffect(() => {
    // Auto-scroll to bottom on new content while EN_CURSO.
    if (preRef.current && ejecucion.estado === 'EN_CURSO') {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [logs, ejecucion.estado]);

  return (
    <div className="mt-1 mb-3 mx-2 rounded bg-[var(--surface-2)] border border-[var(--border)]">
      <div className="px-3 py-1.5 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-2)] font-medium">
          Logs del container · {FUENTE_LABEL[ejecucion.fuente] ?? ejecucion.fuente}
          {ejecucion.estado === 'EN_CURSO' && (
            <span className="ml-2 text-[var(--brand)]">● live</span>
          )}
        </span>
        {loading && <span className="text-[10.5px] text-[var(--text-3)]">cargando…</span>}
      </div>
      <pre
        ref={preRef}
        className="p-3 text-[11px] leading-relaxed font-mono text-[var(--text-2)] whitespace-pre-wrap break-all max-h-[400px] overflow-auto"
      >
        {logs}
      </pre>
    </div>
  );
}
