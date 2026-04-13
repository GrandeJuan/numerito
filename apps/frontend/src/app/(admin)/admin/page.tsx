'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { formatCurrency } from '@/lib/formatters';
import { CARD_CLASSES, CHART_THEME } from '@/lib/design-tokens';
import { KpiCard } from '@/components/shared/kpi-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
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

interface KpiWithSparkline {
  value: number;
  delta: string;
  deltaUp: boolean;
  sparkline: number[];
}

interface DashboardStats {
  kpis: {
    estudiosActivos: KpiWithSparkline;
    totalUsuarios: KpiWithSparkline;
    subscripcionesActivas: KpiWithSparkline;
    mrr: KpiWithSparkline;
    churnMensual: KpiWithSparkline;
    uptime: KpiWithSparkline;
  };
  registrosMensuales: { mes: string; cantidad: number }[];
  distribucionPlanes: { plan: string; cantidad: number }[];
  alertas: { tipo: string; mensaje: string; fecha: string }[];
  estudiosRecientes: {
    id: string;
    nombre: string;
    plan: string;
    estado: string;
    creadoEn: string;
  }[];
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  lastCheck: string;
}

interface HealthCheckResult {
  services: ServiceStatus[];
  uptimePercent: number;
}

const PIE_COLORS = ['#4edea3', '#091426', '#00a472', '#ef4444', '#10b981', '#8b5cf6'];

const STATUS_CONFIG = {
  operational: {
    color: 'bg-emerald-500',
    label: 'Operativo',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  degraded: {
    color: 'bg-amber-500',
    label: 'Degradado',
    textColor: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  down: {
    color: 'bg-red-500',
    label: 'Caído',
    textColor: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
} as const;

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch('/v1/admin/dashboard/stats').then(async (res) => {
        if (!res.ok) throw new Error('Error al cargar estadísticas');
        return (await res.json()).data as DashboardStats;
      }),
      apiFetch('/v1/admin/health').then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()).data as HealthCheckResult;
      }).catch(() => null),
    ])
      .then(([statsData, healthData]) => {
        setStats(statsData);
        setHealth(healthData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-[#a0a3a8]">Cargando...</p>
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
      icon: 'domain',
      ...stats.kpis.estudiosActivos,
      displayValue: stats.kpis.estudiosActivos.value.toLocaleString('es-AR'),
    },
    {
      label: 'Usuarios Totales',
      icon: 'group',
      ...stats.kpis.totalUsuarios,
      displayValue: stats.kpis.totalUsuarios.value.toLocaleString('es-AR'),
    },
    {
      label: 'Suscripciones Activas',
      icon: 'credit_card',
      ...stats.kpis.subscripcionesActivas,
      displayValue: stats.kpis.subscripcionesActivas.value.toLocaleString('es-AR'),
    },
    {
      label: 'MRR',
      icon: 'payments',
      ...stats.kpis.mrr,
      displayValue: formatCurrency(stats.kpis.mrr.value),
    },
    {
      label: 'Churn Mensual',
      icon: 'trending_down',
      ...stats.kpis.churnMensual,
      displayValue: `${stats.kpis.churnMensual.value}%`,
    },
    {
      label: 'Uptime',
      icon: 'monitor_heart',
      ...stats.kpis.uptime,
      displayValue: `${stats.kpis.uptime.value}%`,
    },
  ];

  const estudiosRecientesColumns: Column<DashboardStats['estudiosRecientes'][number]>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (est) => (
        <span className="text-[#091426] dark:text-white font-medium">{est.nombre}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (est) => <span className="text-[#45474c] dark:text-[#c5c6cd]">{est.plan}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (est) => <StatusBadge status={est.estado} />,
    },
    {
      key: 'creadoEn',
      header: 'Creado',
      render: (est) => <span className="text-[#45474c] dark:text-[#a0a3a8]">{est.creadoEn}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#091426] dark:text-white">
          Panel de Administración
        </h1>
        <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
          Vista general de la plataforma Numerito.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.displayValue}
            delta={kpi.delta}
            deltaUp={kpi.deltaUp}
            sparkline={kpi.sparkline}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className={`lg:col-span-2 ${CARD_CLASSES.full} p-6`}>
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
            Registros de Estudios
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.registrosMensuales}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-gray-500" />
                <YAxis tick={{ fontSize: 12 }} className="text-gray-500" allowDecimals={false} />
                <Tooltip contentStyle={CHART_THEME.tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="cantidad"
                  stroke={CHART_THEME.primaryFill}
                  fill={CHART_THEME.primaryFill}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className={`${CARD_CLASSES.full} p-6`}>
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
            Distribución de Planes
          </h2>
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

      {/* System Status Panel */}
      {health && (
        <div className={`${CARD_CLASSES.full} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white">
              Estado del Sistema
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#45474c] dark:text-[#a0a3a8]">Uptime:</span>
              <span className="text-sm font-bold text-[#091426] dark:text-white">
                {health.uptimePercent}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {health.services.map((service) => {
              const config = STATUS_CONFIG[service.status];
              return (
                <div
                  key={service.name}
                  className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor}`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${config.color} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#091426] dark:text-white truncate">
                      {service.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${config.textColor}`}>{config.label}</span>
                      {service.latencyMs > 0 && (
                        <span className="text-xs text-[#75777d] dark:text-[#a0a3a8]">
                          {service.latencyMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts + Recent Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas */}
        <div className={`${CARD_CLASSES.full} p-6`}>
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
            Alertas del Sistema
          </h2>
          {stats.alertas.length === 0 ? (
            <p className="text-gray-500 dark:text-[#a0a3a8] text-sm">Sin alertas activas.</p>
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
                    {alerta.tipo === 'warning'
                      ? 'warning'
                      : alerta.tipo === 'error'
                        ? 'error'
                        : 'info'}
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
        <div className={`lg:col-span-2`}>
          <DataTable
            columns={estudiosRecientesColumns}
            data={stats.estudiosRecientes}
            rowKey={(est) => est.id}
            emptyMessage="No hay estudios recientes."
          />
        </div>
      </div>
    </div>
  );
}
