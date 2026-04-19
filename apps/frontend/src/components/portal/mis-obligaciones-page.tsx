'use client';

import { useState } from 'react';
import type { Obligacion } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { PageHeader } from '../page-header';
import { Card } from '../card';
import { DataTable } from '../data-table';
import { Pill } from '../pill';
import { CalendarGrid } from '../obligaciones/calendar-grid';
import { formatFecha } from '@/lib/formatters';

export function MisObligacionesPage() {
  const { estudioActual } = useAuth();
  const { data, loading, error } =
    useFetchWithEstudio<{ items: Obligacion[] }>('/v1/portal/obligaciones');
  const items = (data?.items ?? []).filter((o) => o.estado !== 'VENCIDO');

  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="calendar">
      <PageHeader
        title="Mis obligaciones"
        subtitle="Calendario de vencimientos fiscales"
      />

      <CalendarGrid
        month={month}
        items={items}
        onPrev={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        onNext={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        onToday={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
      />

      <Card title="Próximas obligaciones" padding={0}>
        <DataTable<Obligacion>
          rows={items}
          columns={[
            { header: 'Obligación', render: (o) => o.tipo },
            {
              header: 'Período',
              render: (o) => (
                <span className="font-mono text-[11.5px] text-[var(--text-2)]">{o.periodo}</span>
              ),
            },
            {
              header: 'Vencimiento',
              render: (o) => (
                <span className="font-mono text-[11.5px] text-[var(--text-2)]">
                  {formatFecha(o.fecha)}
                </span>
              ),
            },
            {
              header: 'Estado',
              render: (o) => (
                <Pill tone={o.estado === 'PRESENTADO' ? 'brand' : 'amber'} dot>
                  {o.estado === 'PRESENTADO' ? 'Presentado' : 'Pendiente'}
                </Pill>
              ),
            },
          ]}
        />
      </Card>
    </PageStateGuard>
  );
}
