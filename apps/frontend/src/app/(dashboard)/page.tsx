'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Can } from '@/components/shared/can';
import {
  STATUS_COLORS,
  KPI_ICON_STYLE,
  CARD_CLASSES,
  TABLE_CLASSES,
  CHART_THEME,
} from '@/lib/design-tokens';
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
  proximosVencimientos: {
    id: string;
    cliente: string;
    obligacion: string;
    fecha: string;
    estado: string;
  }[];
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
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-[#75777d] animate-pulse">
            business
          </span>
          <p className="mt-2 text-[#45474c] dark:text-[#a0a3a8]">Cargando estudio...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#45474c] dark:text-[#a0a3a8]">Cargando...</p>
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
    { label: 'Clientes', value: stats.kpis.clientes, icon: 'group' },
    { label: 'Vencimientos Proximos', value: stats.kpis.vencimientosProximos, icon: 'schedule' },
    ...(stats.kpis.facturacionMes !== undefined
      ? [
          {
            label: 'Facturacion Mes',
            value: formatCurrency(stats.kpis.facturacionMes),
            icon: 'payments',
          },
        ]
      : []),
    { label: 'Tareas Activas', value: stats.kpis.tareasActivas, icon: 'task_alt' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Dashboard del Estudio</h1>
        <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
          Vista general de {estudioActual.nombre}.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`${CARD_CLASSES.full} p-6`}>
            <div className="flex items-center gap-3">
              <div className={`${KPI_ICON_STYLE.className} rounded-lg p-2.5`}>
                <span className={`material-symbols-outlined ${KPI_ICON_STYLE.text} text-xl`}>
                  {kpi.icon}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">{kpi.label}</p>
                <p className="text-2xl font-bold text-[#091426] dark:text-white">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vencimientos por Estado - Bar Chart */}
        <div className={`${CARD_CLASSES.full} p-6`}>
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
            Vencimientos por Estado
          </h2>
          {stats.vencimientosPorEstado.length === 0 ? (
            <p className="text-[#45474c] dark:text-[#a0a3a8] text-sm">Sin datos de vencimientos.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.vencimientosPorEstado}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_THEME.tooltipStyle} />
                  <Bar dataKey="cantidad" fill={CHART_THEME.primaryFill} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Facturacion Mensual - Area Chart */}
        <Can permission="VER_FACTURACION">
          {stats.facturacionMensual && (
            <div className={`${CARD_CLASSES.full} p-6`}>
              <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
                Facturacion Mensual
              </h2>
              {stats.facturacionMensual.length === 0 ? (
                <p className="text-[#45474c] dark:text-[#a0a3a8] text-sm">
                  Sin datos de facturacion.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.facturacionMensual}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={CHART_THEME.tooltipStyle}
                        formatter={(value) => [formatCurrency(Number(value)), 'Monto']}
                      />
                      <Area
                        type="monotone"
                        dataKey="monto"
                        stroke={CHART_THEME.primaryFill}
                        fill={CHART_THEME.primaryFill}
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
        <div className={`${CARD_CLASSES.full} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white">
              Proximos Vencimientos
            </h2>
            <a href="/obligaciones" className="text-sm text-[#4edea3] hover:underline">
              Ver todos
            </a>
          </div>
          {stats.proximosVencimientos.length === 0 ? (
            <p className="text-[#45474c] dark:text-[#a0a3a8] text-sm">Sin vencimientos proximos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={TABLE_CLASSES.rowBorder}>
                    <th className={`text-left py-2 px-2 ${TABLE_CLASSES.headerText}`}>Cliente</th>
                    <th className={`text-left py-2 px-2 ${TABLE_CLASSES.headerText}`}>
                      Obligacion
                    </th>
                    <th className={`text-left py-2 px-2 ${TABLE_CLASSES.headerText}`}>Fecha</th>
                    <th className={`text-left py-2 px-2 ${TABLE_CLASSES.headerText}`}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.proximosVencimientos.map((v) => (
                    <tr
                      key={v.id}
                      className={`${TABLE_CLASSES.rowBorder} ${TABLE_CLASSES.rowHover}`}
                    >
                      <td className="py-2 px-2 text-[#091426] dark:text-white">{v.cliente}</td>
                      <td className="py-2 px-2 text-[#45474c] dark:text-[#c5c6cd]">
                        {v.obligacion}
                      </td>
                      <td className="py-2 px-2 text-[#45474c] dark:text-[#c5c6cd]">
                        {formatFecha(v.fecha)}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.estado] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-[#a0a3a8]'}`}
                        >
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
        <div className={`${CARD_CLASSES.full} p-6`}>
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
            Actividad Reciente
          </h2>
          {stats.actividadReciente.length === 0 ? (
            <p className="text-[#45474c] dark:text-[#a0a3a8] text-sm">Sin actividad reciente.</p>
          ) : (
            <ul className="space-y-3">
              {stats.actividadReciente.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-lg mt-0.5 text-[#45474c] dark:text-[#75777d]">
                    {a.tipo === 'tarea' ? 'task_alt' : 'event'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#091426] dark:text-white truncate">
                      {a.descripcion}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#45474c] dark:text-[#a0a3a8]">
                        {formatFecha(a.fecha)}
                      </span>
                      {a.usuario && (
                        <span className="text-xs text-[#75777d] dark:text-[#75777d]">
                          {a.usuario}
                        </span>
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
        <div className={`${CARD_CLASSES.full} p-6`}>
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
            Carga de Trabajo
          </h2>
          {stats.cargaTrabajo.length === 0 ? (
            <p className="text-[#45474c] dark:text-[#a0a3a8] text-sm">Sin tareas asignadas.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.cargaTrabajo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="usuario" tick={{ fontSize: 12 }} width={150} />
                  <Tooltip contentStyle={CHART_THEME.tooltipStyle} />
                  <Bar dataKey="tareas" fill={CHART_THEME.secondaryFill} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
