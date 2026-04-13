'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { formatFecha } from '@/lib/formatters';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterBar, SearchInput, FilterSelect } from '@/components/shared/filter-bar';

interface Estudio {
  id: string;
  nombre: string;
  cuit: string;
  plan: string;
  planCodigo: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminEstudiosPage() {
  const [estudios, setEstudios] = useState<Estudio[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [estado, setEstado] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchEstudios = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '20');
        if (search) params.set('search', search);
        if (plan) params.set('plan', plan);
        if (estado) params.set('isActive', estado);

        const res = await apiFetch(`/v1/admin/estudios?${params}`);
        if (!res.ok) throw new Error('Error al cargar estudios');
        const body = await res.json();
        setEstudios(body.data);
        setMeta(body.meta);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [search, plan, estado],
  );

  useEffect(() => {
    fetchEstudios();
  }, [fetchEstudios]);

  const handleAction = async (id: string, action: 'suspend' | 'reactivate') => {
    try {
      const res = await apiFetch(`/v1/admin/estudios/${id}/${action}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Error al ejecutar acción');
      fetchEstudios(meta.page);
    } catch {
      // silently fail for now
    }
    setOpenMenu(null);
  };

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  const estudioColumns: Column<Estudio>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (est) => (
        <span className="text-[#091426] dark:text-white font-medium">{est.nombre}</span>
      ),
    },
    {
      key: 'cuit',
      header: 'CUIT',
      render: (est) => (
        <span className="text-[#45474c] dark:text-[#c5c6cd] font-mono text-xs">{est.cuit}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (est) => <StatusBadge status="ACTIVO" label={est.plan} />,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (est) => (
        <StatusBadge
          status={est.isActive ? 'ACTIVO' : 'INACTIVO'}
          label={est.isActive ? 'Activo' : 'Inactivo'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Creado',
      render: (est) => (
        <span className="text-[#45474c] dark:text-[#a0a3a8]">{formatFecha(est.createdAt)}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (est) => (
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === est.id ? null : est.id)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Acciones"
          >
            <span className="material-symbols-outlined text-[#45474c] dark:text-[#a0a3a8]">
              more_vert
            </span>
          </button>
          {openMenu === est.id && (
            <div className="absolute right-4 top-10 z-10 bg-white dark:bg-[#162a4a] border border-[#e2e8f0] dark:border-white/10 rounded-lg shadow-lg py-1 min-w-[160px]">
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-[#c5c6cd] hover:bg-[#4edea3]/5 dark:hover:bg-[#4edea3]/5"
                onClick={() => setOpenMenu(null)}
              >
                <span className="material-symbols-outlined text-base mr-2 align-middle">
                  visibility
                </span>
                Ver Detalle
              </button>
              {est.isActive ? (
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-[#4edea3]/5 dark:hover:bg-[#4edea3]/5"
                  onClick={() => handleAction(est.id, 'suspend')}
                >
                  <span className="material-symbols-outlined text-base mr-2 align-middle">
                    block
                  </span>
                  Suspender
                </button>
              ) : (
                <button
                  className="w-full text-left px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-[#4edea3]/5 dark:hover:bg-[#4edea3]/5"
                  onClick={() => handleAction(est.id, 'reactivate')}
                >
                  <span className="material-symbols-outlined text-base mr-2 align-middle">
                    check_circle
                  </span>
                  Reactivar
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Gestión de Estudios</h1>
        <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
          Administrar estudios contables de la plataforma.
        </p>
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o CUIT..."
        />
        <FilterSelect
          value={plan}
          onChange={setPlan}
          placeholder="Todos los planes"
          options={[
            { value: 'STARTER', label: 'Starter' },
            { value: 'PROFESIONAL', label: 'Profesional' },
            { value: 'ENTERPRISE', label: 'Enterprise' },
          ]}
        />
        <FilterSelect
          value={estado}
          onChange={setEstado}
          placeholder="Todos los estados"
          options={[
            { value: 'true', label: 'Activo' },
            { value: 'false', label: 'Inactivo' },
          ]}
        />
      </FilterBar>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-[#45474c] dark:text-[#a0a3a8]">Cargando...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <DataTable
          columns={estudioColumns}
          data={estudios}
          rowKey={(est) => est.id}
          emptyMessage="No se encontraron estudios."
          footer={
            <>
              <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">
                Mostrando {start}-{end} de {meta.total} estudios
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchEstudios(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="px-3 py-1 text-sm rounded-lg border border-[#e2e8f0] dark:border-white/10 text-gray-700 dark:text-[#c5c6cd] hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchEstudios(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1 text-sm rounded-lg border border-[#e2e8f0] dark:border-white/10 text-gray-700 dark:text-[#c5c6cd] hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </>
          }
        />
      )}
    </div>
  );
}
