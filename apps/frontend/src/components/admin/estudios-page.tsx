'use client';

import { PageHeader, DataTable, Pill, Button, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';

interface EstudioAdmin {
  id: string;
  nombre: string;
  cuit: string;
  plan: string;
  planCodigo: string | null;
  isActive: boolean;
  createdAt: string;
}

const PLAN_TONE: Record<string, 'neutral' | 'indigo' | 'brand'> = {
  STARTER: 'neutral',
  PRO: 'indigo',
  ENTERPRISE: 'brand',
};

export function EstudiosAdminPage() {
  const { data, loading, error } = useFetch<EstudioAdmin[]>('/v1/admin/estudios');

  const columns: Column<EstudioAdmin>[] = [
    {
      header: 'Estudio',
      render: (r) => <span className="font-medium text-[var(--text)]">{r.nombre}</span>,
    },
    {
      header: 'CUIT',
      render: (r) => <span className="font-mono text-[11.5px] text-[var(--text-2)]">{r.cuit}</span>,
    },
    {
      header: 'Plan',
      render: (r) => <Pill tone={PLAN_TONE[r.planCodigo ?? ''] ?? 'neutral'}>{r.plan}</Pill>,
    },
    {
      header: 'Estado',
      render: (r) => (
        <Pill tone={r.isActive ? 'brand' : 'neutral'} dot>
          {r.isActive ? 'Activo' : 'Suspendido'}
        </Pill>
      ),
    },
    {
      header: 'Creado',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--text-3)]">
          {r.createdAt.slice(0, 10)}
        </span>
      ),
    },
    {
      header: '',
      align: 'right',
      render: () => (
        <button className="text-[12px] text-[var(--text-3)] hover:text-[var(--text)]">Ver</button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Estudios"
        subtitle="Todos los tenants de la plataforma"
        actions={<Button variant="primary">Nuevo estudio</Button>}
      />
      <PageStateGuard loading={loading} error={error}>
        <DataTable columns={columns} rows={data ?? []} rowKey={(r) => r.id} />
      </PageStateGuard>
    </>
  );
}
