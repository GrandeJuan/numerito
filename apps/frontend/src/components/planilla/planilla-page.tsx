'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Obligacion } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { PageHeader } from '../page-header';
import { Button } from '../button';
import { Icons } from '../icons';
import { Card } from '../card';
import { DataTable } from '../data-table';
import { Pill, type PillTone } from '../pill';
import { formatFecha } from '@/lib/formatters';

interface VencimientoApi {
  id: string;
  clienteId: string;
  cliente: string;
  tipoObligacion: string;
  periodo: string;
  fechaVencimiento: string;
  descripcion?: string;
  estado: string;
  motivo?: string | null;
  fechaProrrogada?: string | null;
  responsable?: string | null;
}

type EstadoFilter = 'TODOS' | 'PENDIENTE' | 'PRESENTADO' | 'VENCIDO' | 'PRORROGADO' | 'NO_APLICA';

const ESTADO_CONFIG: Record<string, { tone: PillTone; label: string }> = {
  PENDIENTE: { tone: 'amber', label: 'Pendiente' },
  VENCIDO: { tone: 'rose', label: 'Vencido' },
  PRESENTADO: { tone: 'brand', label: 'Presentado' },
  PRORROGADO: { tone: 'indigo', label: 'Prorrogado' },
  NO_APLICA: { tone: 'neutral', label: 'No Aplica' },
};

const ESTADO_FILTERS: { value: EstadoFilter; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'PRESENTADO', label: 'Presentados' },
  { value: 'VENCIDO', label: 'Vencidos' },
  { value: 'PRORROGADO', label: 'Prorrogados' },
  { value: 'NO_APLICA', label: 'No Aplica' },
];

function getCurrentPeriodo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function exportPlanillaXlsx(items: VencimientoApi[]) {
  const rows: string[] = [
    'Cliente,Obligación,Período,Vencimiento,Estado,Motivo,Fecha Prórroga',
  ];
  for (const v of items) {
    rows.push(
      `"${v.cliente}","${v.tipoObligacion}","${v.periodo}","${v.fechaVencimiento}","${v.estado}","${v.motivo ?? ''}","${v.fechaProrrogada ?? ''}"`,
    );
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planilla-responsable-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PlanillaPage() {
  const { estudioActual } = useAuth();
  const [periodo, setPeriodo] = useState(getCurrentPeriodo);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS');
  const [search, setSearch] = useState('');

  const { data, loading, error, refetch } = useFetchWithEstudio<VencimientoApi[]>(
    `/v1/vencimientos?periodo=${periodo}`,
  );
  const rows = data ?? [];

  const filtered = useMemo(() => {
    let result = rows;
    if (estadoFilter !== 'TODOS') {
      result = result.filter((v) => v.estado === estadoFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (v) =>
          v.cliente.toLowerCase().includes(q) ||
          v.tipoObligacion.toLowerCase().includes(q),
      );
    }
    return result;
  }, [rows, estadoFilter, search]);

  // --- Action state ---
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [prorrogaModal, setProrrogaModal] = useState<VencimientoApi | null>(null);
  const [noAplicaModal, setNoAplicaModal] = useState<VencimientoApi | null>(null);

  const handlePresentar = useCallback(
    async (v: VencimientoApi) => {
      setActionLoading(v.id);
      setFeedback(null);
      try {
        const res = await apiFetch(`/v1/vencimientos/${v.id}/presentar`, { method: 'PATCH' });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message ?? body?.message ?? 'Error al presentar');
        }
        setFeedback({ type: 'success', msg: `${v.tipoObligacion} (${v.periodo}) presentado.` });
        refetch();
      } catch (err) {
        setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Error' });
      } finally {
        setActionLoading(null);
      }
    },
    [refetch],
  );

  const handleProrrogar = useCallback(
    async (vId: string, motivo: string, nuevaFecha: string) => {
      setActionLoading(vId);
      setFeedback(null);
      try {
        const res = await apiFetch(`/v1/vencimientos/${vId}/prorrogar`, {
          method: 'PATCH',
          body: JSON.stringify({ motivo, nuevaFecha }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message ?? body?.message ?? 'Error al prorrogar');
        }
        setFeedback({ type: 'success', msg: 'Vencimiento prorrogado correctamente.' });
        setProrrogaModal(null);
        refetch();
      } catch (err) {
        setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Error' });
      } finally {
        setActionLoading(null);
      }
    },
    [refetch],
  );

  const handleNoAplica = useCallback(
    async (vId: string, motivo: string) => {
      setActionLoading(vId);
      setFeedback(null);
      try {
        const res = await apiFetch(`/v1/vencimientos/${vId}/no-aplica`, {
          method: 'PATCH',
          body: JSON.stringify({ motivo }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message ?? body?.message ?? 'Error al marcar no aplica');
        }
        setFeedback({ type: 'success', msg: 'Vencimiento marcado como no aplica.' });
        setNoAplicaModal(null);
        refetch();
      } catch (err) {
        setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Error' });
      } finally {
        setActionLoading(null);
      }
    },
    [refetch],
  );

  // --- KPIs ---
  const kpis = useMemo(() => {
    const pendientes = rows.filter((v) => v.estado === 'PENDIENTE').length;
    const presentados = rows.filter((v) => v.estado === 'PRESENTADO').length;
    const vencidos = rows.filter((v) => v.estado === 'VENCIDO').length;
    const prorrogados = rows.filter((v) => v.estado === 'PRORROGADO').length;
    return { pendientes, presentados, vencidos, prorrogados, total: rows.length };
  }, [rows]);

  const inputClass =
    'h-9 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 text-[13px] text-[var(--text)] outline-none focus:border-[var(--brand)] transition-colors';

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="calendar">
      <PageHeader
        title="Planilla del Responsable"
        subtitle="Gestión de vencimientos por período"
        actions={
          <Button variant="ghost" icon={Icons.download} onClick={() => exportPlanillaXlsx(filtered)}>
            Exportar CSV
          </Button>
        }
      />

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mb-4 text-[12.5px] rounded-[8px] px-3 py-2 border ${
            feedback.type === 'error'
              ? 'text-[var(--rose-ink)] bg-[var(--rose-soft)] border-[var(--rose)]'
              : 'text-[var(--brand-ink)] bg-[var(--brand-soft)] border-[var(--brand)]'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Total" value={kpis.total} />
        <KpiCard label="Pendientes" value={kpis.pendientes} tone="amber" />
        <KpiCard label="Presentados" value={kpis.presentados} tone="brand" />
        <KpiCard label="Vencidos" value={kpis.vencidos} tone="rose" />
        <KpiCard label="Prorrogados" value={kpis.prorrogados} tone="indigo" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Buscar cliente u obligación…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} w-64`}
        />
        <div className="flex gap-1">
          {ESTADO_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setEstadoFilter(f.value)}
              className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors ${
                estadoFilter === f.value
                  ? 'bg-[var(--brand)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card padding={0}>
        <DataTable<VencimientoApi>
          rows={filtered}
          rowKey={(v) => v.id}
          emptyMessage="Sin vencimientos para este período."
          columns={[
            {
              header: 'Cliente',
              render: (v) => (
                <span className="text-[var(--text)] font-medium">{v.cliente}</span>
              ),
            },
            {
              header: 'Obligación',
              render: (v) => (
                <span className="text-[var(--text-2)]">{v.tipoObligacion}</span>
              ),
            },
            {
              header: 'Período',
              render: (v) => (
                <span className="font-mono text-[11.5px] text-[var(--text-2)]">{v.periodo}</span>
              ),
            },
            {
              header: 'Vencimiento',
              render: (v) => (
                <span className="font-mono text-[11.5px] text-[var(--text-2)]">
                  {formatFecha(v.fechaVencimiento)}
                  {v.fechaProrrogada && (
                    <span className="ml-1 text-[var(--indigo-ink)]">
                      → {formatFecha(v.fechaProrrogada)}
                    </span>
                  )}
                </span>
              ),
            },
            {
              header: 'Estado',
              render: (v) => {
                const e = ESTADO_CONFIG[v.estado] ?? { tone: 'neutral' as PillTone, label: v.estado };
                return (
                  <Pill tone={e.tone} dot>
                    {e.label}
                  </Pill>
                );
              },
            },
            {
              header: 'Motivo',
              render: (v) =>
                v.motivo ? (
                  <span className="text-[11px] text-[var(--text-3)] max-w-[200px] truncate block">
                    {v.motivo}
                  </span>
                ) : null,
            },
            {
              header: '',
              align: 'right',
              render: (v) => {
                if (v.estado !== 'PENDIENTE' && v.estado !== 'PRORROGADO') return null;
                const isLoading = actionLoading === v.id;
                return (
                  <div className="flex gap-1.5 justify-end">
                    {(v.estado === 'PENDIENTE' || v.estado === 'PRORROGADO') && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isLoading}
                        onClick={() => handlePresentar(v)}
                      >
                        {isLoading ? '…' : 'Presentar'}
                      </Button>
                    )}
                    {v.estado === 'PENDIENTE' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isLoading}
                          onClick={() => setProrrogaModal(v)}
                        >
                          Prorrogar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isLoading}
                          onClick={() => setNoAplicaModal(v)}
                        >
                          N/A
                        </Button>
                      </>
                    )}
                  </div>
                );
              },
            },
          ]}
          footer={
            <span>
              {filtered.length} de {rows.length} vencimientos
            </span>
          }
        />
      </Card>

      {/* Prorrogar Modal */}
      {prorrogaModal && (
        <ProrrogaModal
          vencimiento={prorrogaModal}
          loading={actionLoading === prorrogaModal.id}
          onConfirm={(motivo, nuevaFecha) =>
            handleProrrogar(prorrogaModal.id, motivo, nuevaFecha)
          }
          onClose={() => setProrrogaModal(null)}
        />
      )}

      {/* No Aplica Modal */}
      {noAplicaModal && (
        <NoAplicaModal
          vencimiento={noAplicaModal}
          loading={actionLoading === noAplicaModal.id}
          onConfirm={(motivo) => handleNoAplica(noAplicaModal.id, motivo)}
          onClose={() => setNoAplicaModal(null)}
        />
      )}
    </PageStateGuard>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: number; tone?: PillTone }) {
  const colors = tone
    ? 'border-l-2 border-l-[var(--' + tone + ')]'
    : '';
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 ${colors}`}
    >
      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)]">
        {label}
      </div>
      <div className="text-[20px] font-semibold text-[var(--text)] mt-0.5">{value}</div>
    </div>
  );
}

function ProrrogaModal({
  vencimiento,
  loading,
  onConfirm,
  onClose,
}: {
  vencimiento: VencimientoApi;
  loading: boolean;
  onConfirm: (motivo: string, nuevaFecha: string) => void;
  onClose: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');

  const inputClass =
    'w-full h-9 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 text-[13px] text-[var(--text)] outline-none focus:border-[var(--brand)] transition-colors';
  const labelClass = 'block text-[12px] font-medium text-[var(--text-2)] mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-lg p-6">
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-1">Prorrogar vencimiento</h2>
        <p className="text-[12px] text-[var(--text-3)] mb-4">
          {vencimiento.tipoObligacion} — {vencimiento.cliente} ({vencimiento.periodo})
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(motivo, nuevaFecha);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="prorroga-motivo" className={labelClass}>Motivo</label>
            <input
              id="prorroga-motivo"
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={inputClass}
              placeholder="Prórroga oficial ARCA RG …"
            />
          </div>
          <div>
            <label htmlFor="prorroga-fecha" className={labelClass}>Nueva fecha</label>
            <input
              id="prorroga-fecha"
              type="date"
              required
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading || !motivo || !nuevaFecha}>
              {loading ? 'Prorrogando…' : 'Prorrogar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NoAplicaModal({
  vencimiento,
  loading,
  onConfirm,
  onClose,
}: {
  vencimiento: VencimientoApi;
  loading: boolean;
  onConfirm: (motivo: string) => void;
  onClose: () => void;
}) {
  const [motivo, setMotivo] = useState('');

  const inputClass =
    'w-full h-9 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 text-[13px] text-[var(--text)] outline-none focus:border-[var(--brand)] transition-colors';
  const labelClass = 'block text-[12px] font-medium text-[var(--text-2)] mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-lg p-6">
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-1">Marcar como No Aplica</h2>
        <p className="text-[12px] text-[var(--text-3)] mb-4">
          {vencimiento.tipoObligacion} — {vencimiento.cliente} ({vencimiento.periodo})
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(motivo);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="na-motivo" className={labelClass}>Motivo</label>
            <input
              id="na-motivo"
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={inputClass}
              placeholder="Cliente dado de baja en esta jurisdicción…"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading || !motivo}>
              {loading ? 'Guardando…' : 'Marcar No Aplica'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
