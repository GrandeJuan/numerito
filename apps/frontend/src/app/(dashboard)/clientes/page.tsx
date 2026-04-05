'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

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

const CONDICION_IVA_LABELS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTO: 'Monotributista',
  EXENTO: 'Exento',
  NO_RESPONSABLE: 'No Responsable',
  CONSUMIDOR_FINAL: 'Consumidor Final',
};

const TIPO_LABELS: Record<string, string> = {
  PERSONA_FISICA: 'Persona Fisica',
  PERSONA_JURIDICA: 'Persona Juridica',
  SOCIEDAD: 'Sociedad',
};

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-AR')}`;
}

export default function ClientesPage() {
  const { estudioActual } = useAuth();
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [summary, setSummary] = useState<ClientesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });

  // Filters
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [condicionIvaFilter, setCondicionIvaFilter] = useState('');

  useEffect(() => {
    if (!estudioActual) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [clientesRes, summaryRes] = await Promise.all([
          apiFetch('/v1/clientes'),
          apiFetch('/v1/clientes/summary'),
        ]);

        if (!clientesRes.ok) throw new Error('Error al cargar clientes');

        const clientesBody = await clientesRes.json();
        setClientes(clientesBody.data);
        setMeta(clientesBody.meta ?? { total: clientesBody.data.length, page: 1, limit: 20 });

        if (summaryRes.ok) {
          const summaryBody = await summaryRes.json();
          setSummary(summaryBody.data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [estudioActual]);

  const filtered = useMemo(() => {
    let result = clientes;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.razonSocial.toLowerCase().includes(q) || c.cuit.includes(q),
      );
    }
    if (tipoFilter) {
      result = result.filter((c) => c.tipo === tipoFilter);
    }
    if (condicionIvaFilter) {
      result = result.filter((c) => c.condicionIva === condicionIvaFilter);
    }
    return result;
  }, [clientes, search, tipoFilter, condicionIvaFilter]);

  if (!estudioActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">group</span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando estudio...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, filtered.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Gestion de clientes del estudio.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-2.5">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl">group</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.total ?? clientes.length}</p>
            </div>
          </div>
        </div>
        {summary?.porCondicionIva && Object.entries(summary.porCondicionIva).slice(0, 3).map(([key, count]) => (
          <div key={key} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2.5">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">badge</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{CONDICION_IVA_LABELS[key] ?? key}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por razon social o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los tipos</option>
            <option value="PERSONA_FISICA">Persona Fisica</option>
            <option value="PERSONA_JURIDICA">Persona Juridica</option>
            <option value="SOCIEDAD">Sociedad</option>
          </select>
          <select
            value={condicionIvaFilter}
            onChange={(e) => setCondicionIvaFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todas las condiciones</option>
            <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
            <option value="MONOTRIBUTO">Monotributista</option>
            <option value="EXENTO">Exento</option>
            <option value="NO_RESPONSABLE">No Responsable</option>
            <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Razon Social</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">CUIT</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Condicion IVA</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Responsable</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Vencimientos</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Saldo</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{c.razonSocial}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-mono text-xs">{c.cuit}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {TIPO_LABELS[c.tipo] ?? c.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {CONDICION_IVA_LABELS[c.condicionIva] ?? c.condicionIva}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {c.responsable ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {c.responsable.nombre.charAt(0)}
                        </div>
                        <span className="text-gray-900 dark:text-white text-sm">{c.responsable.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">Sin asignar</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
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
                        <span className="text-xs text-gray-400 dark:text-gray-500">Al dia</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-medium">
                    {c.saldoPendiente > 0 ? formatCurrency(c.saldoPendiente) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <span className="material-symbols-outlined text-lg">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {start}-{end} de {filtered.length} clientes
          </p>
        </div>
      </div>
    </div>
  );
}
