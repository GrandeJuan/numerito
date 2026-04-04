'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardStats {
  kpis: {
    estudiosActivos: number;
    totalUsuarios: number;
    mrr: number;
    subscripcionesPorVencer: number;
  };
  registrosMensuales: { mes: string; cantidad: number }[];
  distribucionPlanes: { plan: string; cantidad: number }[];
  alertas: { tipo: string; mensaje: string; fecha: string }[];
  estudiosRecientes: { id: string; nombre: string; plan: string; estado: string; creadoEn: string }[];
}

const PIE_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-AR')}`;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/v1/admin/dashboard/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error('Error al cargar estadísticas');
        const body = await res.json();
        setStats(body.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error ?? 'Error desconocido'}</p>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Estudios Activos',
      value: stats.kpis.estudiosActivos,
      icon: 'apartment',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    },
    {
      label: 'Usuarios Totales',
      value: stats.kpis.totalUsuarios,
      icon: 'group',
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-900/30',
    },
    {
      label: 'MRR',
      value: formatCurrency(stats.kpis.mrr),
      icon: 'payments',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    },
    {
      label: 'Por Vencer',
      value: stats.kpis.subscripcionesPorVencer,
      icon: 'schedule',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Vista general de la plataforma Numerito.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Registros de Estudios</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.registrosMensuales}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-gray-500" />
                <YAxis tick={{ fontSize: 12 }} className="text-gray-500" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-gray-800, #1f2937)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución de Planes</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.distribucionPlanes}
                  dataKey="cantidad"
                  nameKey="plan"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {stats.distribucionPlanes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts + Recent Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alertas del Sistema</h2>
          {stats.alertas.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sin alertas activas.</p>
          ) : (
            <ul className="space-y-3">
              {stats.alertas.map((alerta, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    alerta.tipo === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'
                      : alerta.tipo === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg mt-0.5">
                    {alerta.tipo === 'warning' ? 'warning' : alerta.tipo === 'error' ? 'error' : 'info'}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{alerta.mensaje}</p>
                    <p className="text-xs opacity-70 mt-1">{alerta.fecha}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Estudios Recientes */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estudios Recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Plan</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Estado</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Creado</th>
                </tr>
              </thead>
              <tbody>
                {stats.estudiosRecientes.map((est) => (
                  <tr key={est.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-2 text-gray-900 dark:text-white font-medium">{est.nombre}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{est.plan}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          est.estado === 'Activo'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {est.estado}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{est.creadoEn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
