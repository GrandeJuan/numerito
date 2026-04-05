'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Can } from '@/components/shared/can';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardStats {
  kpis: {
    clientes: number;
    vencimientosProximos: number;
    facturacionMes?: number;
    tareasActivas: number;
  };
  vencimientosPorEstado: { estado: string; cantidad: number }[];
  facturacionMensual?: { mes: string; monto: number }[];
  proximosVencimientos: { id: string; cliente: string; obligacion: string; fecha: string; estado: string }[];
  actividadReciente: { tipo: string; descripcion: string; fecha: string; usuario?: string }[];
  cargaTrabajo?: { usuario: string; tareas: number }[];
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-AR')}`;
}

function formatFecha(fecha: string): string {
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return fecha;
  }
}

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Cumplido: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Vencido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function DashboardPage() {
  const { estudioActual } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!estudioActual) {
      setLoading(false);
      return;
    }

    apiFetch('/v1/dashboard/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error('Error al cargar estadisticas');
        const body = await res.json();
        setStats(body.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [estudioActual]);

  if (!estudioActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500 animate-pulse">business</span>
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

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error ?? 'Error desconocido'}</p>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Clientes',
      value: stats.kpis.clientes,
      icon: 'group',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    },
    {
      label: 'Vencimientos Proximos',
      value: stats.kpis.vencimientosProximos,
      icon: 'schedule',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
    },
    ...(stats.kpis.facturacionMes !== undefined
      ? [{
          label: 'Facturacion Mes',
          value: formatCurrency(stats.kpis.facturacionMes),
          icon: 'payments',
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/30',
        }]
      : []),
    {
      label: 'Tareas Activas',
      value: stats.kpis.tareasActivas,
      icon: 'task_alt',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard del Estudio</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Vista general de {estudioActual.nombre}.
        </p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vencimientos por Estado - Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vencimientos por Estado</h2>
          {stats.vencimientosPorEstado.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sin datos de vencimientos.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.vencimientosPorEstado}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="estado" tick={{ fontSize: 12 }} className="text-gray-500" />
                  <YAxis tick={{ fontSize: 12 }} className="text-gray-500" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-gray-800, #1f2937)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="cantidad" fill="#4edea3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Facturacion Mensual - Area Chart */}
        <Can permission="VER_FACTURACION">
          {stats.facturacionMensual && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Facturacion Mensual</h2>
              {stats.facturacionMensual.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Sin datos de facturacion.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.facturacionMensual}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-gray-500" />
                      <YAxis tick={{ fontSize: 12 }} className="text-gray-500" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-gray-800, #1f2937)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        formatter={(value) => [formatCurrency(Number(value)), 'Monto']}
                      />
                      <Area
                        type="monotone"
                        dataKey="monto"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </Can>
      </div>

      {/* Proximos Vencimientos + Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proximos Vencimientos Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Proximos Vencimientos</h2>
            <a href="/obligaciones" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
              Ver todos
            </a>
          </div>
          {stats.proximosVencimientos.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sin vencimientos proximos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Obligacion</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.proximosVencimientos.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 px-2 text-gray-900 dark:text-white">{v.cliente}</td>
                      <td className="py-2 px-2 text-gray-600 dark:text-gray-300">{v.obligacion}</td>
                      <td className="py-2 px-2 text-gray-600 dark:text-gray-300">{formatFecha(v.fecha)}</td>
                      <td className="py-2 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[v.estado] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {v.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actividad Reciente</h2>
          {stats.actividadReciente.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sin actividad reciente.</p>
          ) : (
            <ul className="space-y-3">
              {stats.actividadReciente.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-lg mt-0.5 text-gray-400 dark:text-gray-500">
                    {a.tipo === 'tarea' ? 'task_alt' : 'event'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{a.descripcion}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatFecha(a.fecha)}</span>
                      {a.usuario && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{a.usuario}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Carga de Trabajo — only SOCIO/RESPONSABLE */}
      {stats.cargaTrabajo && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Carga de Trabajo</h2>
          {stats.cargaTrabajo.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sin tareas asignadas.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.cargaTrabajo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis type="number" tick={{ fontSize: 12 }} className="text-gray-500" allowDecimals={false} />
                  <YAxis type="category" dataKey="usuario" tick={{ fontSize: 12 }} className="text-gray-500" width={150} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-gray-800, #1f2937)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="tareas" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
