'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import type { PaginationMeta } from '@numerito/shared';
import { KpiCard } from '@/components/shared/kpi-card';
import { RolBadge } from '@/components/shared/rol-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterBar, SearchInput, FilterSelect } from '@/components/shared/filter-bar';
import { ROL_LABELS } from '@numerito/shared';

interface Usuario {
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

interface Stats {
  total: number;
  activos: number;
  verificados: number;
  sinVerificar: number;
}


function providerIcon(provider: string | null): { icon: string; label: string } {
  switch (provider) {
    case 'google':
      return { icon: 'g_mobiledata', label: 'Google' };
    case 'microsoft':
      return { icon: 'window', label: 'Microsoft' };
    default:
      return { icon: 'mail', label: 'Email' };
  }
}

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`;
  return date.toLocaleDateString('es-AR');
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rol, setRol] = useState('');
  const [estado, setEstado] = useState('');

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '20');
        if (search) params.set('search', search);
        if (rol) params.set('rol', rol);
        if (estado) params.set('isActive', estado);

        const [statsRes, listRes] = await Promise.all([
          apiFetch('/v1/admin/usuarios/stats'),
          apiFetch(`/v1/admin/usuarios?${params}`),
        ]);

        const [statsResult, listResult] = await Promise.all([
          parseApiResponse<Stats>(statsRes),
          parseApiResponse<Usuario[]>(listRes),
        ]);
        setStats(statsResult.data);
        setUsuarios(listResult.data);
        if (listResult.meta) {
          setMeta(listResult.meta);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [search, rol, estado],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  const kpis = stats
    ? [
        { label: 'Total Usuarios', value: stats.total, icon: 'group' },
        { label: 'Activos', value: stats.activos, icon: 'person_check' },
        { label: 'Verificados', value: stats.verificados, icon: 'verified_user' },
        { label: 'Sin Verificar', value: stats.sinVerificar, icon: 'gpp_maybe' },
      ]
    : [];

  const usuarioColumns: Column<Usuario>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (u) => (
        <span className="text-[#091426] dark:text-white font-medium">
          {u.nombre} {u.apellido}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (u) => <span className="text-[#45474c] dark:text-[#c5c6cd]">{u.email}</span>,
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (u) => (
        <RolBadge rol={u.rol} label={ROL_LABELS[u.rol as keyof typeof ROL_LABELS] ?? u.rol} />
      ),
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (u) => {
        const prov = providerIcon(u.provider);
        return (
          <span className="inline-flex items-center gap-1 text-[#45474c] dark:text-[#c5c6cd] text-xs">
            <span className="material-symbols-outlined text-base">{prov.icon}</span>
            {prov.label}
          </span>
        );
      },
    },
    {
      key: 'verificado',
      header: 'Verificado',
      render: (u) =>
        u.emailVerified ? (
          <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
        ) : (
          <span className="material-symbols-outlined text-gray-400 text-lg">cancel</span>
        ),
    },
    {
      key: 'updatedAt',
      header: 'Ultimo Acceso',
      render: (u) => (
        <span className="text-[#45474c] dark:text-[#a0a3a8] text-xs">
          {relativeDate(u.updatedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Gestión de Usuarios</h1>
        <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
          Administrar usuarios de la plataforma.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-[#45474c] dark:text-[#a0a3a8]">Cargando...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} />
            ))}
          </div>

          {/* Filters */}
          <FilterBar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nombre o email..."
            />
            <FilterSelect
              value={rol}
              onChange={setRol}
              placeholder="Todos los roles"
              options={[
                { value: 'SUPERADMIN', label: 'Superadmin' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'CONTADOR', label: 'Contador' },
                { value: 'CLIENTE', label: 'Cliente' },
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
          <DataTable
            columns={usuarioColumns}
            data={usuarios}
            rowKey={(u) => u.id}
            emptyMessage="No se encontraron usuarios."
            footer={
              <>
                <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">
                  Mostrando {start}-{end} de {meta.total} usuarios
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchData(meta.page - 1)}
                    disabled={meta.page <= 1}
                    className="px-3 py-1 text-sm rounded-lg border border-[#e2e8f0] dark:border-white/10 text-gray-700 dark:text-[#c5c6cd] hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => fetchData(meta.page + 1)}
                    disabled={meta.page >= meta.totalPages}
                    className="px-3 py-1 text-sm rounded-lg border border-[#e2e8f0] dark:border-white/10 text-gray-700 dark:text-[#c5c6cd] hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </>
            }
          />
        </>
      )}
    </div>
  );
}
