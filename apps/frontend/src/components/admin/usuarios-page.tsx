'use client';

import { PageHeader, DataTable, Avatar, Pill, Button, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';

interface UsuarioPlatform {
  id: string;
  nombre: string;
  email: string;
  rol: 'SUPERADMIN' | 'SOPORTE' | 'BILLING';
  estudio?: string;
  ultimoAcceso?: string;
  estado: 'ACTIVO' | 'SUSPENDIDO';
}

export function UsuariosAdminPage() {
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<UsuarioPlatform[]>('/v1/admin/usuarios');

  const columns: Column<UsuarioPlatform>[] = [
    {
      header: 'Usuario',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.nombre} size={28} />
          <div>
            <div className="text-[13px] font-medium text-[var(--text)]">{r.nombre}</div>
            <div className="text-[11.5px] text-[var(--text-3)]">{r.email}</div>
          </div>
        </div>
      ),
    },
    { header: 'Rol', render: (r) => <Pill tone={r.rol === 'SUPERADMIN' ? 'brand' : 'neutral'} small>{r.rol}</Pill> },
    { header: 'Estudio', render: (r) => <span className="text-[var(--text-2)]">{r.estudio ?? '—'}</span> },
    { header: 'Último acceso', render: (r) => <span className="mono text-[var(--text-3)]">{r.ultimoAcceso ?? '—'}</span> },
    { header: 'Estado', render: (r) => <Pill tone={r.estado === 'ACTIVO' ? 'brand' : 'neutral'} small>{r.estado}</Pill> },
  ];

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Equipo de plataforma y accesos" actions={<Button variant="primary">Invitar</Button>} />
      <PageStateGuard loading={loading} error={error}>
        {data && <DataTable columns={columns} rows={data} rowKey={(r) => r.id} />}
      </PageStateGuard>
    </>
  );
}
