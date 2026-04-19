'use client';

import { useState } from 'react';
import { PageHeader, SegmentedControl, DataTable, Pill, Button, type Column } from '@/components/redesign';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { formatCurrency } from '@/lib/formatters';

type TipoFiltro = 'todos' | 'ventas' | 'compras';

interface ComprobanteIVA {
  id: string;
  fecha: string;
  tipo: 'VENTAS' | 'COMPRAS';
  comprobante: string;
  cuit: string;
  razonSocial: string;
  neto: number;
  iva: number;
  total: number;
}

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'compras', label: 'Compras' },
];

export function LibroIVAPage() {
  const [tipo, setTipo] = useState<TipoFiltro>('todos');

  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<ComprobanteIVA[]>(`/v1/contabilidad/libro-iva?tipo=${tipo}`);

  const columns: Column<ComprobanteIVA>[] = [
    { header: 'Fecha', render: (r) => <span className="mono">{r.fecha}</span> },
    { header: 'Tipo', render: (r) => <Pill tone={r.tipo === 'VENTAS' ? 'brand' : 'indigo'} small>{r.tipo}</Pill> },
    { header: 'Comprobante', render: (r) => <span className="mono">{r.comprobante}</span> },
    { header: 'CUIT', render: (r) => <span className="mono">{r.cuit}</span> },
    { header: 'Razón social', key: 'razonSocial' },
    { header: 'Neto', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.neto)}</span> },
    { header: 'IVA', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.iva)}</span> },
    { header: 'Total', align: 'right', render: (r) => <span className="mono font-medium text-[var(--text)]">{formatCurrency(r.total)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Libro IVA"
        subtitle="Comprobantes de ventas y compras registrados"
        actions={
          <>
            <SegmentedControl options={TIPO_OPTIONS} value={tipo} onChange={(v) => setTipo(v as TipoFiltro)} />
            <Button variant="primary">Exportar</Button>
          </>
        }
      />
      <PageStateGuard loading={loading} error={error}>
        {data && <DataTable columns={columns} rows={data} rowKey={(r) => r.id} emptyMessage="No hay comprobantes en el período seleccionado." />}
      </PageStateGuard>
    </>
  );
}
