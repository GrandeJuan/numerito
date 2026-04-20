'use client';

import { PageHeader, DataTable, Avatar, Pill, Button, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';

interface UsuarioPlatform {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  provider: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function UsuariosAdminPage() {
  const { data, loading, error } = useFetch<UsuarioPlatform[]>('/v1/admin/usuarios');

  const columns: Column<UsuarioPlatform>[] = [
    {
      header: 'Usuario',
      render: (r) => {
        const full = `${r.nombre} ${r.apellido}`.trim();
        return (
          <div className="flex items-center gap-3">
            <Avatar name={full || r.email} size={28} />
            <div>
              <div className="text-[13px] font-medium text-[var(--text)]">{full || '—'}</div>
              <div className="text-[11.5px] text-[var(--text-3)] font-mono">{r.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Rol',
      render: (r) => (
        <Pill tone={r.rol === 'SUPERADMIN' ? 'brand' : r.rol === 'SOCIO' ? 'indigo' : 'neutral'}>
          {r.rol}
        </Pill>
      ),
    },
    {
      header: 'Verificado',
      render: (r) => (
        <Pill tone={r.emailVerified ? 'brand' : 'amber'} dot>
          {r.emailVerified ? 'Sí' : 'Pendiente'}
        </Pill>
      ),
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
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Equipo de plataforma y accesos"
        actions={<Button variant="primary">Invitar</Button>}
      />
      <PageStateGuard loading={loading} error={error}>
        <DataTable columns={columns} rows={data ?? []} rowKey={(r) => r.id} />
      </PageStateGuard>
    </>
  );
}
