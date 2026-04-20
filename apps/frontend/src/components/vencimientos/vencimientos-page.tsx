'use client';

import { useState, useCallback } from 'react';
import type { Obligacion } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';
import { PageStateGuard } from '@/components/shared/page-state-guard';

import { PageHeader } from '../page-header';
import { Button } from '../button';
import { Icons } from '../icons';

import { VencimientosKpis } from './vencimientos-kpis';
import { CalendarGrid } from './calendar-grid';
import { VencimientosTable } from './vencimientos-table';

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

export function VencimientosPage() {
  const { estudioActual } = useAuth();
  const { data, loading, error, refetch } = useFetchWithEstudio<VencimientoApi[]>('/v1/vencimientos');
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
  const [presentandoId, setPresentandoId] = useState<string | null>(null);
  const [presentarError, setPresentarError] = useState<string | null>(null);
  const [presentarExito, setPresentarExito] = useState<string | null>(null);

  const handlePresentar = useCallback(
    async (o: Obligacion) => {
      setPresentandoId(o.id);
      setPresentarError(null);
      setPresentarExito(null);
      try {
        const res = await apiFetch(`/v1/vencimientos/${o.id}/presentar`, { method: 'PATCH' });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message ?? body?.message ?? 'No se pudo presentar el vencimiento');
        }
        setPresentarExito(`Vencimiento de ${o.tipo} (${o.periodo}) presentado correctamente.`);
        refetch();
      } catch (err) {
        setPresentarError(err instanceof Error ? err.message : 'Error al presentar el vencimiento');
      } finally {
        setPresentandoId(null);
      }
    },
    [refetch],
  );

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

      {presentarError && (
        <div
          role="alert"
          className="mb-4 text-[12.5px] text-[var(--rose-ink)] bg-[var(--rose-soft)] border border-[var(--rose)] rounded-[8px] px-3 py-2"
        >
          {presentarError}
        </div>
      )}

      {presentarExito && (
        <div
          role="status"
          className="mb-4 text-[12.5px] text-[var(--brand-ink)] bg-[var(--brand-soft)] border border-[var(--brand)] rounded-[8px] px-3 py-2"
        >
          {presentarExito}
        </div>
      )}

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
        presentandoId={presentandoId}
        onPresentar={handlePresentar}
        onMore={(o) => console.log('more', o.id)}
      />
    </PageStateGuard>
  );
}
