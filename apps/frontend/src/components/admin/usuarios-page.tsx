'use client';

import { useState } from 'react';
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

const PAGE_SIZE = 20;

export function UsuariosAdminPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(PAGE_SIZE));
  if (search.trim()) params.set('search', search.trim());

  const { data, meta, loading, error } = useFetch<UsuarioPlatform[]>(
    `/v1/admin/usuarios?${params.toString()}`,
  );

  const totalPages = meta?.totalPages ?? 1;

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
      <div className="flex items-center gap-3 mb-3">
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-8 w-[280px] bg-[var(--surface)] border border-[var(--border)] rounded-[7px] px-2.5 text-[12.5px] text-[var(--text)] outline-none focus:border-[var(--brand)]"
        />
        {meta && (
          <span className="text-[11.5px] text-[var(--text-3)]">
            {meta.total} usuario{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <PageStateGuard loading={loading} error={error}>
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(r) => r.id}
          footer={
            totalPages > 1 && (
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            )
          }
        />
      </PageStateGuard>
    </>
  );
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-2 py-1 text-[12px] rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← Anterior
      </button>
      <span className="text-[12px] text-[var(--text-3)]">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-2 py-1 text-[12px] rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Siguiente →
      </button>
    </div>
  );
}
