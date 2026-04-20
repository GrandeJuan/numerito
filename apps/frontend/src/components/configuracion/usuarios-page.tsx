'use client';

import { PageHeader, DataTable, Button, Pill, Avatar, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { Can } from '@/components/shared/can';

interface UsuarioEstudio {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: 'ACTIVO' | 'INVITADO' | 'SUSPENDIDO';
  ultimoAcceso?: string;
}

const ESTADO_TONE: Record<UsuarioEstudio['estado'], 'brand' | 'amber' | 'neutral'> = {
  ACTIVO: 'brand',
  INVITADO: 'amber',
  SUSPENDIDO: 'neutral',
};

export function UsuariosConfigPage() {
  const { data, loading, error } = useFetchWithEstudio<UsuarioEstudio[]>('/v1/estudios/equipo');

  const columns: Column<UsuarioEstudio>[] = [
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
    { header: 'Rol', key: 'rol' },
    {
      header: 'Estado',
      render: (r) => (
        <Pill tone={ESTADO_TONE[r.estado]} small>
          {r.estado}
        </Pill>
      ),
    },
    {
      header: 'Último acceso',
      render: (r) => <span className="mono text-[var(--text-3)]">{r.ultimoAcceso ?? '—'}</span>,
    },
    {
      header: '',
      align: 'right',
      render: () => (
        <button className="text-[12px] text-[var(--text-3)] hover:text-[var(--text)]">
          Editar
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Miembros del estudio con acceso al sistema"
        actions={
          <Can permission="usuarios.invitar">
            <Button variant="primary">Invitar usuario</Button>
          </Can>
        }
      />
      <PageStateGuard loading={loading} error={error}>
        {data && (
          <DataTable
            columns={columns}
            rows={data}
            rowKey={(r) => r.id}
            emptyMessage="No hay usuarios cargados."
          />
        )}
      </PageStateGuard>
    </>
  );
}
