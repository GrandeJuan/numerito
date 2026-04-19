'use client';

import { PageHeader, KpiCard, Card } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface MetricasData {
  usuariosActivos: number;
  obligacionesProcesadas: number;
  facturasEmitidas: number;
  usuariosTimeseries: Array<{ mes: string; valor: number }>;
  obligacionesTimeseries: Array<{ mes: string; valor: number }>;
}

const CHART_STYLE = {
  contentStyle: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--text)',
  },
};

export function MetricasAdminPage() {
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<MetricasData>('/v1/admin/metricas');

  return (
    <>
      <PageHeader title="Métricas" subtitle="Uso agregado de la plataforma" />
      <PageStateGuard loading={loading} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <KpiCard label="Usuarios activos (30d)" value={String(data.usuariosActivos)} />
              <KpiCard label="Obligaciones procesadas" value={String(data.obligacionesProcesadas)} />
              <KpiCard label="Facturas emitidas" value={String(data.facturasEmitidas)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="Usuarios activos · 12m">
                <div className="p-4 pt-0" style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.usuariosTimeseries}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis dataKey="mes" stroke="var(--text-3)" fontSize={11} />
                      <YAxis stroke="var(--text-3)" fontSize={11} />
                      <Tooltip {...CHART_STYLE} />
                      <Line type="monotone" dataKey="valor" stroke="var(--brand)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card title="Obligaciones procesadas · 12m">
                <div className="p-4 pt-0" style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.obligacionesTimeseries}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis dataKey="mes" stroke="var(--text-3)" fontSize={11} />
                      <YAxis stroke="var(--text-3)" fontSize={11} />
                      <Tooltip {...CHART_STYLE} />
                      <Bar dataKey="valor" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        )}
      </PageStateGuard>
    </>
  );
}
