'use client';

import { PageHeader, DataTable, Pill, Button, type Column } from '@/components/redesign';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { formatCurrency } from '@/lib/formatters';

interface FacturaPlatform {
  id: string;
  numero: string;
  fecha: string;
  estudio: string;
  periodo: string;
  monto: number;
  estado: 'PAGADA' | 'PENDIENTE' | 'VENCIDA';
}

const ESTADO_TONE: Record<FacturaPlatform['estado'], 'brand' | 'amber' | 'rose'> = {
  PAGADA: 'brand',
  PENDIENTE: 'amber',
  VENCIDA: 'rose',
};

export function FacturacionAdminPage() {
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<FacturaPlatform[]>('/v1/admin/facturacion');

  const columns: Column<FacturaPlatform>[] = [
    { header: 'N°', render: (r) => <span className="mono">{r.numero}</span> },
    { header: 'Fecha', render: (r) => <span className="mono">{r.fecha}</span> },
    { header: 'Estudio', key: 'estudio' },
    { header: 'Período', key: 'periodo' },
    { header: 'Monto', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.monto)}</span> },
    { header: 'Estado', render: (r) => <Pill tone={ESTADO_TONE[r.estado]} small>{r.estado}</Pill> },
  ];

  return (
    <>
      <PageHeader
        title="Facturación"
        subtitle="Facturas emitidas a estudios suscriptos"
        actions={<Button variant="primary">Exportar</Button>}
      />
      <PageStateGuard loading={loading} error={error}>
        {data && <DataTable columns={columns} rows={data} rowKey={(r) => r.id} />}
      </PageStateGuard>
    </>
  );
}
