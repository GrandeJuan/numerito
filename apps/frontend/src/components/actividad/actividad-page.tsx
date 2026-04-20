'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { PageHeader } from '../page-header';
import { Card } from '../card';
import { DataTable, type Column } from '../data-table';
import { SegmentedControl } from '../segmented-control';
import { Pill } from '../pill';
import { formatFecha } from '@/lib/formatters';

interface ActividadItem {
  tipo: 'tarea' | 'vencimiento';
  descripcion: string;
  fecha: string;
  usuario?: string;
}

type Filtro = 'todos' | 'tarea' | 'vencimiento';

const OPTS = [
  { value: 'todos', label: 'Todos' },
  { value: 'tarea', label: 'Tareas' },
  { value: 'vencimiento', label: 'Vencimientos' },
];

export function ActividadPage() {
  const { estudioActual } = useAuth();
  const [tipo, setTipo] = useState<Filtro>('todos');
  const { data, loading, error } = useFetchWithEstudio<ActividadItem[]>(
    `/v1/dashboard/actividad?limit=100&tipo=${tipo}`,
  );

  const items = data ?? [];

  const columns: Column<ActividadItem>[] = [
    {
      header: 'Tipo',
      render: (r) => (
        <Pill tone={r.tipo === 'vencimiento' ? 'amber' : 'indigo'} dot>
          {r.tipo === 'vencimiento' ? 'Vencimiento' : 'Tarea'}
        </Pill>
      ),
    },
    {
      header: 'Descripción',
      render: (r) => <span className="text-[var(--text)] text-[12.5px]">{r.descripcion}</span>,
    },
    {
      header: 'Fecha',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--text-3)]">{formatFecha(r.fecha)}</span>
      ),
    },
    {
      header: 'Usuario',
      render: (r) => (
        <span className="text-[11.5px] text-[var(--text-2)] font-mono">{r.usuario ?? '—'}</span>
      ),
    },
  ];

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="activity">
      <PageHeader
        title="Actividad reciente"
        subtitle="Historial completo de tareas y vencimientos del estudio."
        actions={
          <SegmentedControl options={OPTS} value={tipo} onChange={(v) => setTipo(v as Filtro)} />
        }
      />

      <Card padding={0}>
        {items.length === 0 ? (
          <div className="py-10 text-center text-[var(--text-3)] text-[13px]">
            Sin actividad registrada.
          </div>
        ) : (
          <DataTable<ActividadItem>
            rows={items}
            columns={columns}
            footer={
              <span>
                {items.length} {items.length === 1 ? 'evento' : 'eventos'}
              </span>
            }
          />
        )}
      </Card>
    </PageStateGuard>
  );
}
