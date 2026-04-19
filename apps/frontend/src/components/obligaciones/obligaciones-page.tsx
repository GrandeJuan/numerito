'use client';

import { useState } from 'react';
import type { Obligacion } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';

import { PageHeader } from '../page-header';
import { Button } from '../button';
import { Icons } from '../icons';

import { ObligacionesKpis } from './obligaciones-kpis';
import { CalendarGrid } from './calendar-grid';
import { ObligacionesTable } from './obligaciones-table';

export function ObligacionesPage() {
  const { estudioActual } = useAuth();
  const { data, loading, error } =
    useFetchWithEstudio<{ items: Obligacion[] }>('/v1/obligaciones');
  const items = data?.items ?? [];

  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="calendar">
      <PageHeader
        title="Obligaciones"
        subtitle="Calendario y gestión de vencimientos fiscales"
        actions={
          <>
            <Button variant="ghost" icon={Icons.download}>
              Exportar
            </Button>
            <Button variant="brand" icon={Icons.plus}>
              Nueva obligación
            </Button>
          </>
        }
      />

      <ObligacionesKpis items={items} />

      <CalendarGrid
        month={month}
        items={items}
        onPrev={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        onNext={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        onToday={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
      />

      <ObligacionesTable
        rows={items}
        onPresentar={(o) => console.log('presentar', o.id)}
        onMore={(o) => console.log('more', o.id)}
      />
    </PageStateGuard>
  );
}
