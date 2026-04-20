'use client';

import { useState } from 'react';
import { PageHeader, DataTable, Button, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { formatCurrency } from '@/lib/formatters';

interface AsientoContable {
  id: string;
  numero: number;
  fecha: string;
  descripcion: string;
  debe: number;
  haber: number;
}

export function AsientosPage() {
  const [q, setQ] = useState('');

  const { data, loading, error } = useFetchWithEstudio<AsientoContable[]>(
    `/v1/contabilidad/asientos${q ? `?q=${encodeURIComponent(q)}` : ''}`,
  );

  const columns: Column<AsientoContable>[] = [
    { header: 'N°', render: (r) => <span className="mono text-[var(--text-3)]">#{r.numero}</span> },
    { header: 'Fecha', render: (r) => <span className="mono">{r.fecha}</span> },
    { header: 'Descripción', key: 'descripcion' },
    { header: 'Debe', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.debe)}</span> },
    { header: 'Haber', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.haber)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Asientos contables"
        subtitle="Registro de operaciones del libro diario"
        actions={
          <>
            <input
              type="search"
              placeholder="Buscar asiento…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 px-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] w-[220px] outline-none focus:border-[var(--brand)]"
            />
            <Button variant="primary">Nuevo asiento</Button>
          </>
        }
      />
      <PageStateGuard loading={loading} error={error}>
        {data && <DataTable columns={columns} rows={data} rowKey={(r) => r.id} emptyMessage="No hay asientos registrados." />}
      </PageStateGuard>
    </>
  );
}
