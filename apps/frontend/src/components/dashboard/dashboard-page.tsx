'use client';

import type { DashboardStats } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { Can } from '@/components/shared/can';
import { formatCurrency } from '@/lib/formatters';

import { PageHeader } from '../page-header';
import { KpiCard } from '../kpi-card';
import { SegmentedControl } from '../segmented-control';
import { Button } from '../button';

import { VencimientosPorEstadoCard } from './vencimientos-por-estado-card';
import { FacturacionMensualCard } from './facturacion-mensual-card';
import { ProximosVencimientosCard } from './proximos-vencimientos-card';
import { ActividadRecienteCard } from './actividad-reciente-card';
import { useState } from 'react';

const Download = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
  </svg>
);

function exportDashboardCsv(stats: DashboardStats) {
  const rows: string[] = ['Métrica,Valor'];
  rows.push(`Clientes,"${stats.kpis.clientes}"`);
  rows.push(`Vencimientos próximos,"${stats.kpis.vencimientosProximos}"`);
  if (stats.kpis.facturacionMes !== undefined) {
    rows.push(`Facturación mes,"${stats.kpis.facturacionMes}"`);
  }
  rows.push(`Tareas activas,"${stats.kpis.tareasActivas}"`);
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DashboardPage() {
  const { estudioActual } = useAuth();
  const {
    data: stats,
    loading,
    error,
  } = useFetchWithEstudio<DashboardStats>('/v1/dashboard/stats');
  const [range, setRange] = useState<'month' | 'quarter' | 'year'>('month');

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="dashboard">
      <PageHeader
        title="Dashboard del Estudio"
        subtitle={`Vista general de ${estudioActual?.nombre ?? ''}.`}
        actions={
          <>
            <SegmentedControl
              value={range}
              onChange={setRange}
              options={[
                { value: 'month', label: 'Mes' },
                { value: 'quarter', label: 'Trimestre' },
                { value: 'year', label: 'Año' },
              ]}
            />
            <Button variant="ghost" icon={Download} onClick={() => stats && exportDashboardCsv(stats)}>
              Exportar
            </Button>
          </>
        }
      />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Clientes" value={stats.kpis.clientes} />
          <KpiCard
            label="Vencimientos Próximos"
            value={stats.kpis.vencimientosProximos}
            delta={{ tone: 'amber', text: '7 días' }}
          />
          {stats.kpis.facturacionMes !== undefined && (
            <KpiCard
              label="Facturación Mes"
              value={formatCurrency(stats.kpis.facturacionMes)}
              delta={{
                tone: stats.kpis.facturacionMes > 0 ? 'brand' : 'neutral',
                text: stats.kpis.facturacionMes > 0 ? 'este mes' : 'sin datos',
              }}
            />
          )}
          <KpiCard
            label="Tareas Activas"
            value={stats.kpis.tareasActivas}
            delta={{
              tone: stats.kpis.tareasActivas > 0 ? 'indigo' : 'neutral',
              text: stats.kpis.tareasActivas > 0 ? 'activas' : 'sin carga',
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3.5 mb-4">
        <VencimientosPorEstadoCard data={stats?.vencimientosPorEstado ?? []} />
        <Can permission="VER_FACTURACION">
          {stats?.facturacionMensual && <FacturacionMensualCard data={stats.facturacionMensual} />}
        </Can>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <ProximosVencimientosCard items={stats?.proximosVencimientos ?? []} />
        <ActividadRecienteCard items={stats?.actividadReciente ?? []} />
      </div>
    </PageStateGuard>
  );
}
