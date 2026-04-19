'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Cliente } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';

import { PageHeader } from '../page-header';
import { Button } from '../button';
import { Icons } from '../icons';

import { ClientesKpis } from './clientes-kpis';
import { ClientesFilterBar } from './clientes-filter-bar';
import { ClientesTable } from './clientes-table';

export function ClientesPage() {
  const router = useRouter();
  const { estudioActual } = useAuth();
  const { data, loading, error } =
    useFetchWithEstudio<{ items: Cliente[] }>('/v1/clientes');
  const rows = data?.items ?? [];

  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(
      (c) =>
        c.razonSocial.toLowerCase().includes(q) || c.cuit.replace(/\D/g, '').includes(q.replace(/\D/g, '')),
    );
  }, [rows, search]);

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="users">
      <PageHeader
        title="Clientes"
        subtitle="Gestión de clientes del estudio"
        actions={
          <>
            <Button variant="ghost" icon={Icons.download}>
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
        onSearch={setSearch}
        total={rows.length}
        filtered={filtered.length}
      />

      <ClientesTable
        rows={filtered}
        total={rows.length}
        onRowClick={(c) => router.push(`/clientes/${c.id}`)}
      />
    </PageStateGuard>
  );
}
