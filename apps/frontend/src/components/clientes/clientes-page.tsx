'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Cliente } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';
import { PageStateGuard } from '@/components/shared/page-state-guard';

import { PageHeader } from '../page-header';
import { Button } from '../button';
import { Icons } from '../icons';

import { ClientesKpis } from './clientes-kpis';
import { ClientesFilterBar } from './clientes-filter-bar';
import { ClientesTable } from './clientes-table';

const PAGE_SIZE = 50;

function exportClientesCsv(clientes: Cliente[]) {
  const rows: string[] = ['Razón Social,CUIT,Tipo,Condición IVA,Responsable,Activo'];
  for (const c of clientes) {
    rows.push(
      `"${c.razonSocial}","${c.cuit}","${c.tipo}","${c.condicionIva}","${c.responsable ?? ''}",${c.isActive !== false ? 'Sí' : 'No'}`,
    );
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ClientesPage() {
  const router = useRouter();
  const { estudioActual } = useAuth();
  const { data, loading, error, refetch } = useFetchWithEstudio<Cliente[]>('/v1/clientes');
  const rows = data ?? [];

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(
      (c) =>
        c.razonSocial.toLowerCase().includes(q) ||
        c.cuit.replace(/\D/g, '').includes(q.replace(/\D/g, '')),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleArchivar = useCallback(
    async (c: Cliente) => {
      const res = await apiFetch(`/v1/clientes/${c.id}/desactivar`, { method: 'PATCH' });
      if (res.ok) refetch();
    },
    [refetch],
  );

  const handleReactivar = useCallback(
    async (c: Cliente) => {
      const res = await apiFetch(`/v1/clientes/${c.id}/activar`, { method: 'PATCH' });
      if (res.ok) refetch();
    },
    [refetch],
  );

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="users">
      <PageHeader
        title="Clientes"
        subtitle="Gestión de clientes del estudio"
        actions={
          <>
            <Button variant="ghost" icon={Icons.download} onClick={() => exportClientesCsv(rows)}>
              Exportar
            </Button>
            <Button variant="brand" icon={Icons.plus} onClick={() => router.push('/clientes/new')}>
              Nuevo cliente
            </Button>
          </>
        }
      />

      <ClientesKpis rows={rows} />

      <ClientesFilterBar
        search={search}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        total={rows.length}
        filtered={filtered.length}
      />

      <ClientesTable
        rows={paged}
        total={filtered.length}
        page={page}
        totalPages={totalPages}
        onRowClick={(c) => router.push(`/clientes/${c.id}`)}
        onPageChange={setPage}
        onArchivar={handleArchivar}
        onReactivar={handleReactivar}
      />
    </PageStateGuard>
  );
}
