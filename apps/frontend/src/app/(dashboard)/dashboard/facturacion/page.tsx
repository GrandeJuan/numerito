'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface FacturacionStats {
  facturado: number;
  cobrado: number;
  cobradoPorcentaje: number;
  saldoPendiente: number;
  facturasVencidas: number;
  porEstado: { estado: string; cantidad: number }[];
  mensual: { mes: string; facturado: number; cobrado: number }[];
}

interface FacturaRow {
  id: string;
  numero: string;
  clienteId: string;
  fechaEmision: string;
  total: number;
  estado: string;
  totalPagado: number;
}

const ESTADO_LABELS: Record<string, string> = {
  EMITIDA: 'Emitida',
  PARCIALMENTE_PAGADA: 'Parcial',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
  ANULADA: 'Anulada',
};

const ESTADO_COLORS: Record<string, string> = {
  EMITIDA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PARCIALMENTE_PAGADA: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  PAGADA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  VENCIDA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ANULADA: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#6b7280'];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-AR')}`;
}

export default function FacturacionPage() {
  const { estudioActual, tienePermiso } = useAuth();
  const [stats, setStats] = useState<FacturacionStats | null>(null);
  const [facturas, setFacturas] = useState<FacturaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });

  if (!estudioActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">receipt_long</span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Seleccione un estudio para ver facturacion.</p>
        </div>
      </div>
    );
  }

  if (!tienePermiso('VER_FACTURACION')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-red-400">lock</span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">No tiene permisos para acceder a esta seccion.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, facturasRes] = await Promise.all([
          apiFetch('/v1/facturacion/stats'),
          apiFetch(`/v1/facturacion/facturas?page=${meta.page}&limit=${meta.limit}`),
        ]);

        if (!statsRes.ok || !facturasRes.ok) throw new Error('Error al cargar facturacion');

        const statsBody = await statsRes.json();
        setStats(statsBody.data);

        const facturasBody = await facturasRes.json();
        setFacturas(facturasBody.data);
        setMeta(facturasBody.meta ?? { total: facturasBody.data.length, page: 1, limit: 20 });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [estudioActual]);

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
  const end = Math.min(meta.page * meta.limit, meta.total || facturas.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturacion</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Gestion de facturacion y cobranzas del estudio.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-2.5">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl">payments</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Facturado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.facturado ?? 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2.5">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">account_balance</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Cobrado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.cobrado ?? 0)}</p>
              <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats?.cobradoPorcentaje ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{stats?.cobradoPorcentaje ?? 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2.5">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">pending</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.saldoPendiente ?? 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-2.5">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">warning</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Facturas Vencidas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.facturasVencidas ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Facturacion vs Cobranzas</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.mensual ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Area type="monotone" dataKey="facturado" stroke="#3b82f6" fill="#3b82f680" name="Facturado" />
                <Area type="monotone" dataKey="cobrado" stroke="#10b981" fill="#10b98180" name="Cobrado" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estado de Facturas</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.porEstado ?? []}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {(stats?.porEstado ?? []).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend formatter={(value: string) => ESTADO_LABELS[value] ?? value} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Facturas Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Facturas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Numero</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Fecha Emision</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Monto</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Estado</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium font-mono text-xs">{f.numero}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{f.clienteId}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{new Date(f.fechaEmision).toLocaleDateString('es-AR')}</td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-medium">{formatCurrency(f.total)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[f.estado] ?? ''}`}>
                      {ESTADO_LABELS[f.estado] ?? f.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Ver Detalle">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400" title="Registrar Pago">
                        <span className="material-symbols-outlined text-lg">payment</span>
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Anular">
                        <span className="material-symbols-outlined text-lg">block</span>
                      </button>
                      <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="Descargar PDF">
                        <span className="material-symbols-outlined text-lg">download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {facturas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron facturas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {start}-{end} de {meta.total || facturas.length} facturas
          </p>
        </div>
      </div>
    </div>
  );
}
