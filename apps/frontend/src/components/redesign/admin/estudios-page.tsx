'use client';

import { PageHeader, DataTable, Pill, Button, type Column } from '@/components/redesign';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { formatCurrency } from '@/lib/formatters';

interface EstudioAdmin {
  id: string;
  nombre: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  usuarios: number;
  mrr: number;
  estado: 'ACTIVO' | 'TRIAL' | 'SUSPENDIDO' | 'CANCELADO';
}

const ESTADO_TONE: Record<EstudioAdmin['estado'], 'brand' | 'indigo' | 'amber' | 'neutral'> = {
  ACTIVO: 'brand',
  TRIAL: 'indigo',
  SUSPENDIDO: 'amber',
  CANCELADO: 'neutral',
};

const PLAN_TONE: Record<EstudioAdmin['plan'], 'neutral' | 'indigo' | 'brand'> = {
  STARTER: 'neutral',
  PRO: 'indigo',
  ENTERPRISE: 'brand',
};

export function EstudiosAdminPage() {
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<EstudioAdmin[]>('/v1/admin/estudios');

  const columns: Column<EstudioAdmin>[] = [
    { header: 'Estudio', render: (r) => <span className="font-medium text-[var(--text)]">{r.nombre}</span> },
    { header: 'Plan', render: (r) => <Pill tone={PLAN_TONE[r.plan]} small>{r.plan}</Pill> },
    { header: 'Usuarios', align: 'right', render: (r) => <span className="mono">{r.usuarios}</span> },
    { header: 'MRR', align: 'right', render: (r) => <span className="mono">{formatCurrency(r.mrr)}</span> },
    { header: 'Estado', render: (r) => <Pill tone={ESTADO_TONE[r.estado]} small>{r.estado}</Pill> },
    { header: '', align: 'right', render: () => <button className="text-[12px] text-[var(--text-3)] hover:text-[var(--text)]">Ver</button> },
  ];

  return (
    <>
      <PageHeader
        title="Estudios"
        subtitle="Todos los tenants de la plataforma"
        actions={<Button variant="primary">Nuevo estudio</Button>}
      />
      <PageStateGuard loading={loading} error={error}>
        {data && <DataTable columns={columns} rows={data} rowKey={(r) => r.id} />}
      </PageStateGuard>
    </>
  );
}
