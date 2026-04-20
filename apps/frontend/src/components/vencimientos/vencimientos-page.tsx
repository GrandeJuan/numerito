'use client';

import { useState } from 'react';
import type { Obligacion } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';

import { PageHeader } from '../page-header';
import { Button } from '../button';
import { Icons } from '../icons';

import { VencimientosKpis } from './vencimientos-kpis';
import { CalendarGrid } from './calendar-grid';
import { VencimientosTable } from './vencimientos-table';

export function VencimientosPage() {
  const { estudioActual } = useAuth();
  interface VencimientoApi {
    id: string;
    clienteId: string;
    cliente: string;
    tipoObligacion: string;
    periodo: string;
    fechaVencimiento: string;
    descripcion?: string;
    estado: 'PENDIENTE' | 'PRESENTADO' | 'VENCIDO';
    monto?: number;
    responsable?: string | null;
  }
  const { data, loading, error } = useFetchWithEstudio<VencimientoApi[]>('/v1/vencimientos');
  const items: Obligacion[] = (data ?? []).map((v) => ({
    id: v.id,
    tipo: v.tipoObligacion,
    periodo: v.periodo,
    fecha: v.fechaVencimiento,
    fechaVencimiento: v.fechaVencimiento,
    descripcion: v.descripcion,
    estado: v.estado,
    cliente: v.cliente,
    monto: v.monto,
    responsable: v.responsable ?? null,
  }));

  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="calendar">
      <PageHeader
        title="Vencimientos"
        subtitle="Calendario y gestión de vencimientos fiscales"
        actions={
          <>
            <Button variant="ghost" icon={Icons.download}>
              Exportar
            </Button>
            <Button variant="brand" icon={Icons.plus}>
              Nuevo vencimiento
            </Button>
          </>
        }
      />

      <VencimientosKpis items={items} />

      <CalendarGrid
        month={month}
        items={items}
        onPrev={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        onNext={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        onToday={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
      />

      <VencimientosTable
        rows={items}
        onPresentar={(o) => console.log('presentar', o.id)}
        onMore={(o) => console.log('more', o.id)}
      />
    </PageStateGuard>
  );
}
