'use client';

import { useState } from 'react';
import { PageHeader, KpiCard, SegmentedControl, Card, DataTable, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { formatCurrency } from '@/lib/formatters';

type Periodo = 'month' | 'quarter' | 'year';

interface ContabilidadSummary {
  ventas: number;
  ventasDelta?: number;
  compras: number;
  comprasDelta?: number;
  ivaDebito: number;
  ivaCredito: number;
  detalle: Array<{
    concepto: string;
    ventas: number;
    compras: number;
    ivaDebito: number;
    ivaCredito: number;
  }>;
}

const PERIODO_OPTIONS = [
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Año' },
];

export function ContabilidadPage() {
  const [periodo, setPeriodo] = useState<Periodo>('month');

  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<ContabilidadSummary>(
    `/v1/contabilidad/summary?periodo=${periodo}`,
  );

  const columns: Column<ContabilidadSummary['detalle'][number]>[] = [
    { header: 'Concepto', key: 'concepto' },
    { header: 'Ventas', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.ventas)}</span> },
    { header: 'Compras', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.compras)}</span> },
    { header: 'IVA Débito', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.ivaDebito)}</span> },
    { header: 'IVA Crédito', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.ivaCredito)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Contabilidad"
        subtitle="Resumen de operaciones e IVA"
        actions={<SegmentedControl options={PERIODO_OPTIONS} value={periodo} onChange={(v) => setPeriodo(v as Periodo)} />}
      />
      <PageStateGuard loading={loading} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard label="Ventas" value={formatCurrency(data.ventas)} delta={data.ventasDelta != null ? { text: `${data.ventasDelta >= 0 ? '+' : ''}${data.ventasDelta}%`, tone: data.ventasDelta >= 0 ? 'brand' : 'rose' } : undefined} />
              <KpiCard label="Compras" value={formatCurrency(data.compras)} delta={data.comprasDelta != null ? { text: `${data.comprasDelta >= 0 ? '+' : ''}${data.comprasDelta}%`, tone: 'neutral' } : undefined} />
              <KpiCard label="IVA Débito" value={formatCurrency(data.ivaDebito)} />
              <KpiCard label="IVA Crédito" value={formatCurrency(data.ivaCredito)} />
            </div>
            <Card title="Detalle por concepto">
              <DataTable columns={columns} rows={data.detalle} rowKey={(r) => r.concepto} />
            </Card>
          </>
        )}
      </PageStateGuard>
    </>
  );
}
