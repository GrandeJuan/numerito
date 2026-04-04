'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

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

  const fetchEstudios = useCallback(async (page = 1) => {
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
  }, [search, plan, estado]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Estudios</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Administrar estudios contables de la plataforma.</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por nombre o CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Todos los planes</option>
            <option value="STARTER">Starter</option>
            <option value="PROFESIONAL">Profesional</option>
            <option value="ENTERPRISE">Enterprise</option>
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
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">CUIT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Creado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudios.map((est) => (
                  <tr key={est.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{est.nombre}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-mono text-xs">{est.cuit}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {est.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          est.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {est.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                      {new Date(est.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-3 px-4 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === est.id ? null : est.id)}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Acciones"
                      >
                        <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">more_vert</span>
                      </button>
                      {openMenu === est.id && (
                        <div className="absolute right-4 top-10 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]">
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setOpenMenu(null)}
                          >
                            <span className="material-symbols-outlined text-base mr-2 align-middle">visibility</span>
                            Ver Detalle
                          </button>
                          {est.isActive ? (
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => handleAction(est.id, 'suspend')}
                            >
                              <span className="material-symbols-outlined text-base mr-2 align-middle">block</span>
                              Suspender
                            </button>
                          ) : (
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => handleAction(est.id, 'reactivate')}
                            >
                              <span className="material-symbols-outlined text-base mr-2 align-middle">check_circle</span>
                              Reactivar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {estudios.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron estudios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {start}-{end} de {meta.total} estudios
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchEstudios(meta.page - 1)}
                disabled={meta.page <= 1}
                className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => fetchEstudios(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
