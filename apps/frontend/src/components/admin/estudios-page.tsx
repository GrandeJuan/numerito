'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const PAGE_SIZE = 20;

export function EstudiosAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(() => Number(searchParams.get('page') ?? '1'));
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(PAGE_SIZE));
  if (search.trim()) params.set('search', search.trim());
  const estado = searchParams.get('estado');
  if (estado) {
    if (estado === 'active') params.set('isActive', 'true');
    else if (estado === 'suspended') params.set('isActive', 'false');
  }

  const { data, meta, loading, error } = useFetch<EstudioAdmin[]>(
    `/v1/admin/estudios?${params.toString()}`,
  );

  const totalPages = meta?.totalPages ?? 1;

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
      render: (r) => (
        <button
          className="text-[12px] text-[var(--text-3)] hover:text-[var(--text)]"
          onClick={() => router.push(`/admin/estudios/${r.id}`)}
        >
          Ver
        </button>
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
      <div className="flex items-center gap-3 mb-3">
        <input
          type="search"
          placeholder="Buscar por nombre o CUIT…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-8 w-[280px] bg-[var(--surface)] border border-[var(--border)] rounded-[7px] px-2.5 text-[12.5px] text-[var(--text)] outline-none focus:border-[var(--brand)]"
        />
        {meta && (
          <span className="text-[11.5px] text-[var(--text-3)]">
            {meta.total} estudio{meta.total !== 1 ? 's' : ''}
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
