'use client';

import { useState } from 'react';
import { PageHeader, SegmentedControl, DataTable, Pill, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';

interface LogEntry {
  id: string;
  timestamp: string;
  nivel: 'INFO' | 'WARN' | 'ERROR';
  actor: string;
  estudio?: string;
  accion: string;
  detalle?: string;
}

type NivelFiltro = 'todos' | 'INFO' | 'WARN' | 'ERROR';

const NIVEL_TONE: Record<LogEntry['nivel'], 'neutral' | 'amber' | 'rose'> = {
  INFO: 'neutral',
  WARN: 'amber',
  ERROR: 'rose',
};

const OPTS = [
  { value: 'todos', label: 'Todos' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARN', label: 'Warn' },
  { value: 'ERROR', label: 'Error' },
];

export function LogsPage() {
  const [nivel, setNivel] = useState<NivelFiltro>('todos');
  const [q, setQ] = useState('');
  // TODO: verificar endpoint
  const params = new URLSearchParams();
  if (nivel !== 'todos') params.set('nivel', nivel);
  if (q) params.set('q', q);
  const { data, loading, error } = useFetchWithEstudio<LogEntry[]>(`/v1/admin/logs?${params.toString()}`);

  const columns: Column<LogEntry>[] = [
    { header: 'Timestamp', render: (r) => <span className="mono text-[var(--text-3)]">{r.timestamp}</span> },
    { header: 'Nivel', render: (r) => <Pill tone={NIVEL_TONE[r.nivel]} small>{r.nivel}</Pill> },
    { header: 'Actor', key: 'actor' },
    { header: 'Estudio', render: (r) => r.estudio ?? '—' },
    { header: 'Acción', render: (r) => <span className="mono text-[12px]">{r.accion}</span> },
    { header: 'Detalle', render: (r) => <span className="text-[var(--text-3)]">{r.detalle ?? ''}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Logs"
        subtitle="Auditoría y eventos del sistema"
        actions={
          <>
            <input
              type="search"
              placeholder="Buscar…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 px-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] w-[220px] outline-none focus:border-[var(--brand)]"
            />
            <SegmentedControl options={OPTS} value={nivel} onChange={(v) => setNivel(v as NivelFiltro)} />
          </>
        }
      />
      <PageStateGuard loading={loading} error={error}>
        {data && <DataTable columns={columns} rows={data} rowKey={(r) => r.id} />}
      </PageStateGuard>
    </>
  );
}
