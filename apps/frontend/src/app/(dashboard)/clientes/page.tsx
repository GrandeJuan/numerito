'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { KpiCard } from '@/components/shared/kpi-card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterBar, SearchInput, FilterSelect } from '@/components/shared/filter-bar';
import { formatCurrency } from '@/lib/formatters';
import { CONDICION_IVA_LABELS, TIPO_CLIENTE_LABELS } from '@numerito/shared';

interface ClienteRow {
  id: string;
  razonSocial: string;
  cuit: string;
  tipo: string;
  condicionIva: string;
  responsable: { id: string; nombre: string } | null;
  vencimientosPendientes: number;
  vencimientosVencidos: number;
  saldoPendiente: number;
  isActive: boolean;
}

interface ClientesSummary {
  total: number;
  porCondicionIva: Record<string, number>;
}

export default function ClientesPage() {
  const { estudioActual } = useAuth();
  const {
    data: clientes,
    loading: loadingClientes,
    error: errorClientes,
  } = useFetchWithEstudio<ClienteRow[]>('/v1/clientes');
  const { data: summary } = useFetchWithEstudio<ClientesSummary>('/v1/clientes/summary');

  // Filters
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [condicionIvaFilter, setCondicionIvaFilter] = useState('');

  const filtered = useMemo(() => {
    let result = clientes ?? [];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.razonSocial.toLowerCase().includes(q) || c.cuit.includes(q));
    }
    if (tipoFilter) {
      result = result.filter((c) => c.tipo === tipoFilter);
    }
    if (condicionIvaFilter) {
      result = result.filter((c) => c.condicionIva === condicionIvaFilter);
    }
    return result;
  }, [clientes, search, tipoFilter, condicionIvaFilter]);

  const clienteColumns: Column<ClienteRow>[] = [
    {
      key: 'razonSocial',
      header: 'Razon Social',
      render: (c) => (
        <span className="text-[#091426] dark:text-white font-medium">{c.razonSocial}</span>
      ),
    },
    {
      key: 'cuit',
      header: 'CUIT',
      render: (c) => (
        <span className="text-gray-600 dark:text-[#c5c6cd] font-mono text-xs">{c.cuit}</span>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (c) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
          {TIPO_CLIENTE_LABELS[c.tipo as keyof typeof TIPO_CLIENTE_LABELS] ?? c.tipo}
        </span>
      ),
    },
    {
      key: 'condicionIva',
      header: 'Condicion IVA',
      render: (c) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {CONDICION_IVA_LABELS[c.condicionIva as keyof typeof CONDICION_IVA_LABELS] ??
            c.condicionIva}
        </span>
      ),
    },
    {
      key: 'responsable',
      header: 'Responsable',
      render: (c) =>
        c.responsable ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {c.responsable.nombre.charAt(0)}
            </div>
            <span className="text-[#091426] dark:text-white text-sm">{c.responsable.nombre}</span>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-[#75777d] text-sm">Sin asignar</span>
        ),
    },
    {
      key: 'vencimientos',
      header: 'Vencimientos',
      render: (c) => (
        <div className="flex flex-col gap-0.5">
          {c.vencimientosPendientes > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {c.vencimientosPendientes} pendientes
            </span>
          )}
          {c.vencimientosVencidos > 0 && (
            <span className="text-xs text-red-600 dark:text-red-400">
              {c.vencimientosVencidos} vencidos
            </span>
          )}
          {c.vencimientosPendientes === 0 && c.vencimientosVencidos === 0 && (
            <span className="text-xs text-gray-400 dark:text-[#75777d]">Al dia</span>
          )}
        </div>
      ),
    },
    {
      key: 'saldo',
      header: 'Saldo',
      align: 'right',
      render: (c) => (
        <span className="text-[#091426] dark:text-white font-medium">
          {c.saldoPendiente > 0 ? formatCurrency(c.saldoPendiente) : '-'}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: () => (
        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <span className="material-symbols-outlined text-lg">more_vert</span>
        </button>
      ),
    },
  ];

  return (
    <PageStateGuard
      estudioActual={estudioActual}
      loading={loadingClientes}
      error={errorClientes}
      icon="group"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Clientes</h1>
          <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
            Gestion de clientes del estudio.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon="group"
            label="Total Clientes"
            value={summary?.total ?? clientes?.length ?? 0}
          />
          {summary?.porCondicionIva &&
            Object.entries(summary.porCondicionIva)
              .slice(0, 3)
              .map(([key, count]) => (
                <KpiCard
                  key={key}
                  icon="badge"
                  label={CONDICION_IVA_LABELS[key as keyof typeof CONDICION_IVA_LABELS] ?? key}
                  value={count}
                />
              ))}
        </div>

        {/* Filter Bar */}
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por razon social o CUIT..."
          />
          <FilterSelect
            value={tipoFilter}
            onChange={setTipoFilter}
            placeholder="Todos los tipos"
            options={Object.entries(TIPO_CLIENTE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <FilterSelect
            value={condicionIvaFilter}
            onChange={setCondicionIvaFilter}
            placeholder="Todas las condiciones"
            options={Object.entries(CONDICION_IVA_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </FilterBar>

        {/* Table */}
        <DataTable<ClienteRow>
          columns={clienteColumns}
          data={filtered}
          rowKey={(c) => c.id}
          emptyMessage="No se encontraron clientes."
          footer={
            <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">{filtered.length} clientes</p>
          }
        />
      </div>
    </PageStateGuard>
  );
}
