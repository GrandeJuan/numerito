'use client';

import { PageHeader, KpiCard, Card, DataTable, Pill, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { formatCurrency } from '@/lib/formatters';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AdminOverview {
  mrr: number;
  mrrDelta: number;
  estudiosActivos: number;
  estudiosDelta: number;
  churnMensual: number;
  uptime: number;
  mrrTimeseries: Array<{ mes: string; valor: number }>;
  actividad: Array<{
    id: string;
    fecha: string;
    tipo: string;
    estudio: string;
    descripcion: string;
  }>;
}

export function AdminDashboardPage() {
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<AdminOverview>('/v1/admin/overview');

  const columns: Column<AdminOverview['actividad'][number]>[] = [
    { header: 'Fecha', render: (r) => <span className="mono text-[var(--text-3)]">{r.fecha}</span> },
    { header: 'Tipo', render: (r) => <Pill tone="neutral" small>{r.tipo}</Pill> },
    { header: 'Estudio', key: 'estudio' },
    { header: 'Descripción', key: 'descripcion' },
  ];

  return (
    <>
      <PageHeader title="Overview" subtitle="Plataforma Numerito · todos los estudios" />
      <PageStateGuard loading={loading} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard label="MRR" value={formatCurrency(data.mrr)} delta={{ text: `${data.mrrDelta >= 0 ? '+' : ''}${data.mrrDelta}%`, tone: data.mrrDelta >= 0 ? 'brand' : 'rose' }} />
              <KpiCard label="Estudios activos" value={String(data.estudiosActivos)} delta={{ text: `${data.estudiosDelta >= 0 ? '+' : ''}${data.estudiosDelta}`, tone: data.estudiosDelta >= 0 ? 'brand' : 'rose' }} />
              <KpiCard label="Churn mensual" value={`${data.churnMensual.toFixed(2)}%`} delta={{ text: `${data.churnMensual.toFixed(2)}%`, tone: 'rose' }} />
              <KpiCard label="Uptime" value={`${data.uptime.toFixed(2)}%`} />
            </div>

            <Card title="MRR · últimos 12 meses">
              <div className="p-4 pt-0" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.mrrTimeseries}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="mes" stroke="var(--text-3)" fontSize={11} />
                    <YAxis stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'var(--text)',
                      }}
                      formatter={(v) => formatCurrency(Number(v))}
                    />
                    <Line type="monotone" dataKey="valor" stroke="var(--brand)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="mt-6">
              <Card title="Actividad reciente">
                <DataTable columns={columns} rows={data.actividad} rowKey={(r) => r.id} />
              </Card>
            </div>
          </>
        )}
      </PageStateGuard>
    </>
  );
}
