'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

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

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

  const fetchData = useCallback(async (page = 1) => {
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

      if (!statsRes.ok || !listRes.ok) throw new Error('Error al cargar usuarios');

      const [statsBody, listBody] = await Promise.all([statsRes.json(), listRes.json()]);
      setStats(statsBody.data);
      setUsuarios(listBody.data);
      setMeta(listBody.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, rol, estado]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  const kpis = stats
    ? [
        { label: 'Total Usuarios', value: stats.total, icon: 'group', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
        { label: 'Activos', value: stats.activos, icon: 'person_check', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
        { label: 'Verificados', value: stats.verificados, icon: 'verified_user', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/30' },
        { label: 'Sin Verificar', value: stats.sinVerificar, icon: 'gpp_maybe', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Administrar usuarios de la plataforma.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
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
              <div key={kpi.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3">
                  <div className={`${kpi.bg} rounded-lg p-2.5`}>
                    <span className={`material-symbols-outlined ${kpi.color} text-xl`}>{kpi.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Todos los roles</option>
                <option value="SUPERADMIN">Superadmin</option>
                <option value="ADMIN">Admin</option>
                <option value="CONTADOR">Contador</option>
                <option value="CLIENTE">Cliente</option>
              </select>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Provider</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Verificado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Ultimo Acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const prov = providerIcon(u.provider);
                    return (
                      <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                          {u.nombre} {u.apellido}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                            {u.rol}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300 text-xs">
                            <span className="material-symbols-outlined text-base">{prov.icon}</span>
                            {prov.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.emailVerified ? (
                            <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                          ) : (
                            <span className="material-symbols-outlined text-gray-400 text-lg">cancel</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">
                          {relativeDate(u.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {start}-{end} de {meta.total} usuarios
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchData(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchData(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
