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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
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
  growthData: { mes: string; usuarios: number; estudios: number }[];
  revenueData: { mes: string; mrr: number; arr: number }[];
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

const PIE_COLORS = ['#4edea3', '#00a472', '#091426', '#75777d', '#10b981', '#8b5cf6'];

function formatARS(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

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

      {/* Charts Row: Growth + Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Area Chart (dual series) */}
        <div className={`lg:col-span-2 ${CARD_CLASSES.full} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#091426] dark:text-white">
                Crecimiento de Usuarios y Estudios
              </h2>
              <p className="text-xs text-[#75777d] dark:text-[#a0a3a8] mt-0.5">
                Últimos 12 meses
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]" />
                <span className="text-[#45474c] dark:text-[#a0a3a8]">Usuarios</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#091426] dark:bg-white" />
                <span className="text-[#45474c] dark:text-[#a0a3a8]">Estudios</span>
              </span>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.growthData}>
                <defs>
                  <linearGradient id="gradUsuarios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4edea3" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#4edea3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEstudios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#091426" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#091426" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:opacity-20" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#75777d' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#75777d' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={CHART_THEME.tooltipStyle}
                  itemStyle={{ color: 'white' }}
                  labelStyle={{ color: '#4edea3', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="usuarios" stroke="#4edea3" strokeWidth={2} fill="url(#gradUsuarios)" />
                <Area type="monotone" dataKey="estudios" stroke="#091426" strokeWidth={2} fill="url(#gradEstudios)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution Donut */}
        <div className={`${CARD_CLASSES.full} p-6`}>
          <h2 className="text-sm font-bold text-[#091426] dark:text-white mb-1">
            Distribución por Plan
          </h2>
          <p className="text-xs text-[#75777d] dark:text-[#a0a3a8] mb-4">
            {stats.distribucionPlanes.reduce((a, b) => a + b.cantidad, 0)} estudios activos
          </p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.distribucionPlanes}
                  dataKey="cantidad"
                  nameKey="plan"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {stats.distribucionPlanes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_THEME.tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {stats.distribucionPlanes.map((p, i) => (
              <div key={p.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-xs text-[#45474c] dark:text-[#a0a3a8]">{p.plan}</span>
                </div>
                <span className="text-xs font-semibold text-[#091426] dark:text-white tabular-nums">
                  {p.cantidad}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Bar Chart */}
      <div className={`${CARD_CLASSES.full} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-[#091426] dark:text-white">
              Revenue: MRR y ARR
            </h2>
            <p className="text-xs text-[#75777d] dark:text-[#a0a3a8] mt-0.5">
              Evolución en pesos argentinos
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]" />
              <span className="text-[#45474c] dark:text-[#a0a3a8]">MRR</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#091426] dark:bg-white" />
              <span className="text-[#45474c] dark:text-[#a0a3a8]">ARR</span>
            </span>
          </div>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.revenueData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:opacity-20" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#75777d' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#75777d' }}
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={formatARS}
              />
              <Tooltip
                contentStyle={CHART_THEME.tooltipStyle}
                formatter={(value: number) => [formatARS(value), '']}
                labelStyle={{ color: '#4edea3', fontWeight: 600 }}
              />
              <Bar dataKey="mrr" fill="#4edea3" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="arr" fill="#091426" radius={[6, 6, 0, 0]} maxBarSize={32} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
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
