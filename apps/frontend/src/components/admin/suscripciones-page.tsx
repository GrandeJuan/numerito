'use client';

import { useState } from 'react';
import { PageHeader, SegmentedControl, DataTable, Pill, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { formatCurrency } from '@/lib/formatters';

interface Suscripcion {
  id: string;
  estudio: string;
  plan: string;
  monto: number;
  estado: 'ACTIVA' | 'PAUSADA' | 'CANCELADA' | 'VENCIDA';
  proximaFactura?: string;
}

type EstadoFiltro = 'todos' | 'ACTIVA' | 'PAUSADA' | 'CANCELADA' | 'VENCIDA';

const ESTADO_TONE: Record<Suscripcion['estado'], 'brand' | 'amber' | 'neutral' | 'rose'> = {
  ACTIVA: 'brand',
  PAUSADA: 'amber',
  CANCELADA: 'neutral',
  VENCIDA: 'rose',
};

const OPTS = [
  { value: 'todos', label: 'Todas' },
  { value: 'ACTIVA', label: 'Activas' },
  { value: 'PAUSADA', label: 'Pausadas' },
  { value: 'VENCIDA', label: 'Vencidas' },
];

export function SuscripcionesPage() {
  const [estado, setEstado] = useState<EstadoFiltro>('todos');
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<Suscripcion[]>(`/v1/admin/suscripciones?estado=${estado}`);

  const columns: Column<Suscripcion>[] = [
    { header: 'Estudio', key: 'estudio' },
    { header: 'Plan', key: 'plan' },
    { header: 'Monto', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.monto)}</span> },
    { header: 'Estado', render: (r) => <Pill tone={ESTADO_TONE[r.estado]} small>{r.estado}</Pill> },
    { header: 'Próxima factura', render: (r) => <span className="mono text-[var(--text-3)]">{r.proximaFactura ?? '—'}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Suscripciones"
        subtitle="Estado de las suscripciones de estudios"
        actions={<SegmentedControl options={OPTS} value={estado} onChange={(v) => setEstado(v as EstadoFiltro)} />}
      />
      <PageStateGuard loading={loading} error={error}>
        {data && <DataTable columns={columns} rows={data} rowKey={(r) => r.id} />}
      </PageStateGuard>
    </>
  );
}
