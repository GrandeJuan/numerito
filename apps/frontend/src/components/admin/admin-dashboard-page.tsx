'use client';

import { PageHeader, KpiCard, Card, DataTable, Pill, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';
import { formatCurrency } from '@/lib/formatters';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface KpiWithSparkline {
  value: number;
  delta: string;
  deltaUp: boolean;
  sparkline: number[];
}

interface TopTenant {
  id: string;
  nombre: string;
  plan: string;
  usuarios: number;
  clientes: number;
  actividad: number;
}

interface EstudioReciente {
  id: string;
  nombre: string;
  plan: string;
  estado: string;
  creadoEn: string;
}

interface AdminDashboardStats {
  kpis: {
    estudiosActivos: KpiWithSparkline;
    totalUsuarios: KpiWithSparkline;
    subscripcionesActivas: KpiWithSparkline;
    mrr: KpiWithSparkline;
    churnMensual: KpiWithSparkline;
    uptime: KpiWithSparkline;
  };
  growthData: Array<{ mes: string; usuarios: number; estudios: number }>;
  revenueData: Array<{ mes: string; mrr: number; arr: number }>;
  registrosMensuales: Array<{ mes: string; cantidad: number }>;
  distribucionPlanes: Array<{ plan: string; cantidad: number }>;
  alertas: Array<{ tipo: string; mensaje: string; fecha: string }>;
  estudiosRecientes: EstudioReciente[];
  topTenants: TopTenant[];
}

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--text)',
  },
};

export function AdminDashboardPage() {
  const { data, loading, error } = useFetch<AdminDashboardStats>('/v1/admin/dashboard/stats');

  const topTenantsCols: Column<TopTenant>[] = [
    {
      header: 'Estudio',
      render: (r) => <span className="font-medium text-[var(--text)]">{r.nombre}</span>,
    },
    { header: 'Plan', render: (r) => <Pill tone="indigo">{r.plan}</Pill> },
    {
      header: 'Usuarios',
      align: 'right',
      render: (r) => <span className="font-mono">{r.usuarios}</span>,
    },
    {
      header: 'Clientes',
      align: 'right',
      render: (r) => <span className="font-mono">{r.clientes}</span>,
    },
    {
      header: 'Actividad',
      align: 'right',
      render: (r) => <span className="font-mono text-[var(--text-2)]">{r.actividad}</span>,
    },
  ];

  const recientesCols: Column<EstudioReciente>[] = [
    {
      header: 'Estudio',
      render: (r) => <span className="font-medium text-[var(--text)]">{r.nombre}</span>,
    },
    { header: 'Plan', render: (r) => <Pill tone="indigo">{r.plan}</Pill> },
    {
      header: 'Estado',
      render: (r) => (
        <Pill tone={r.estado === 'ACTIVO' ? 'brand' : 'neutral'} dot>
          {r.estado}
        </Pill>
      ),
    },
    {
      header: 'Creado',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--text-3)]">
          {r.creadoEn.slice(0, 10)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Overview" subtitle="Plataforma Numerito · todos los estudios" />
      <PageStateGuard loading={loading} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <KpiCard
                label="MRR"
                value={formatCurrency(data.kpis.mrr.value)}
                delta={{
                  text: data.kpis.mrr.delta,
                  tone: data.kpis.mrr.deltaUp ? 'brand' : 'rose',
                }}
              />
              <KpiCard
                label="Estudios activos"
                value={String(data.kpis.estudiosActivos.value)}
                delta={{
                  text: data.kpis.estudiosActivos.delta,
                  tone: data.kpis.estudiosActivos.deltaUp ? 'brand' : 'rose',
                }}
              />
              <KpiCard
                label="Usuarios totales"
                value={String(data.kpis.totalUsuarios.value)}
                delta={{
                  text: data.kpis.totalUsuarios.delta,
                  tone: data.kpis.totalUsuarios.deltaUp ? 'brand' : 'rose',
                }}
              />
              <KpiCard
                label="Suscripciones activas"
                value={String(data.kpis.subscripcionesActivas.value)}
                delta={{
                  text: data.kpis.subscripcionesActivas.delta,
                  tone: data.kpis.subscripcionesActivas.deltaUp ? 'brand' : 'rose',
                }}
              />
              <KpiCard
                label="Churn mensual"
                value={`${data.kpis.churnMensual.value.toFixed(2)}%`}
                delta={{
                  text: data.kpis.churnMensual.delta,
                  tone: data.kpis.churnMensual.deltaUp ? 'rose' : 'brand',
                }}
              />
              <KpiCard
                label="Uptime"
                value={`${data.kpis.uptime.value.toFixed(2)}%`}
                delta={{ text: data.kpis.uptime.delta, tone: 'brand' }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-4">
              <Card title="MRR / ARR · últimos 12 meses">
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.revenueData}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis dataKey="mes" stroke="var(--text-3)" fontSize={11} />
                      <YAxis
                        stroke="var(--text-3)"
                        fontSize={11}
                        tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                      />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v) => formatCurrency(Number(v))} />
                      <Line
                        type="monotone"
                        dataKey="mrr"
                        stroke="var(--brand)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="arr"
                        stroke="var(--indigo)"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="4 4"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card title="Crecimiento · usuarios y estudios">
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.growthData}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis dataKey="mes" stroke="var(--text-3)" fontSize={11} />
                      <YAxis stroke="var(--text-3)" fontSize={11} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Line
                        type="monotone"
                        dataKey="usuarios"
                        stroke="var(--brand)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="estudios"
                        stroke="var(--amber)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3.5 mb-4">
              <Card title="Distribución de planes">
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.distribucionPlanes}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis dataKey="plan" stroke="var(--text-3)" fontSize={11} />
                      <YAxis stroke="var(--text-3)" fontSize={11} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar dataKey="cantidad" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card title="Top tenants por actividad">
                <DataTable columns={topTenantsCols} rows={data.topTenants} rowKey={(r) => r.id} />
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              <Card title="Estudios recientes">
                <DataTable
                  columns={recientesCols}
                  rows={data.estudiosRecientes}
                  rowKey={(r) => r.id}
                />
              </Card>
              <Card title="Alertas del sistema">
                {data.alertas.length === 0 ? (
                  <p className="text-[var(--text-3)] text-[12.5px]">Sin alertas activas.</p>
                ) : (
                  data.alertas.map((a, i, arr) => (
                    <div
                      key={`${a.tipo}-${a.fecha}-${i}`}
                      className={`flex items-start gap-3 py-2.5 ${
                        i < arr.length - 1 ? 'border-b border-[var(--border)]' : ''
                      }`}
                    >
                      <Pill
                        tone={a.tipo === 'ERROR' ? 'rose' : a.tipo === 'WARN' ? 'amber' : 'neutral'}
                        dot
                      >
                        {a.tipo}
                      </Pill>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] text-[var(--text)]">{a.mensaje}</div>
                        <div className="text-[11px] text-[var(--text-3)] font-mono mt-0.5">
                          {a.fecha}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>
          </>
        )}
      </PageStateGuard>
    </>
  );
}
