'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { PageHeader } from '../page-header';
import { KpiCard } from '../kpi-card';
import { Card } from '../card';
import { Pill } from '../pill';
import { DataTable, type Column } from '../data-table';
import { Button } from '../button';
import { Icons } from '../icons';

interface CumplimientoResponsable {
  responsableId: string | null;
  responsableNombre: string;
  total: number;
  presentados: number;
  vencidos: number;
  prorrogados: number;
  pendientes: number;
  enRiesgo: number;
  porcentajeCumplimiento: number;
}

interface CumplimientoSocioData {
  periodo: string;
  resumenGeneral: {
    total: number;
    presentados: number;
    vencidos: number;
    prorrogados: number;
    pendientes: number;
    enRiesgo: number;
    porcentajeCumplimiento: number;
  };
  porResponsable: CumplimientoResponsable[];
}

function currentPeriodo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatPeriodo(periodo: string): string {
  const [y, m] = periodo.split('-');
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const idx = parseInt(m, 10) - 1;
  return `${meses[idx] ?? m} ${y}`;
}

function prevPeriodo(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function nextPeriodo(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

const STATUS_COLORS: Record<string, string> = {
  presentados: 'var(--brand)',
  vencidos: 'var(--rose)',
  prorrogados: 'var(--blue)',
  pendientes: 'var(--amber)',
  enRiesgo: 'var(--rose)',
};

const STATUS_LABELS: Record<string, string> = {
  presentados: 'Presentados',
  vencidos: 'Vencidos',
  prorrogados: 'Prorrogados',
  pendientes: 'Pendientes',
};

function CumplimientoBar({ row }: { row: CumplimientoResponsable }) {
  const total = Math.max(1, row.total);
  const segments = [
    { key: 'presentados', value: row.presentados, color: STATUS_COLORS.presentados },
    { key: 'prorrogados', value: row.prorrogados, color: STATUS_COLORS.prorrogados },
    { key: 'pendientes', value: row.pendientes, color: STATUS_COLORS.pendientes },
    { key: 'vencidos', value: row.vencidos, color: STATUS_COLORS.vencidos },
  ];

  return (
    <div className="flex gap-[2px] h-[6px] rounded-[3px] overflow-hidden bg-[var(--surface-2)]">
      {segments.map(
        (s) =>
          s.value > 0 && (
            <div
              key={s.key}
              className="h-full rounded-[2px] transition-[width] duration-500"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
              title={`${STATUS_LABELS[s.key]}: ${s.value}`}
            />
          ),
      )}
    </div>
  );
}

function ResumenCard({ resumen }: { resumen: CumplimientoSocioData['resumenGeneral'] }) {
  const total = Math.max(1, resumen.total);
  const statuses = ['presentados', 'vencidos', 'prorrogados', 'pendientes'] as const;

  return (
    <Card title="Distribución por Estado" subtitle="Desglose del período">
      <div className="flex items-baseline gap-3 mb-5">
        <div className="font-mono text-[30px] font-semibold tracking-[-0.03em] text-[var(--text)]">
          {resumen.total}
        </div>
        <div className="text-[12.5px] text-[var(--text-3)]">obligaciones totales</div>
        {resumen.enRiesgo > 0 && (
          <div className="ml-auto">
            <Pill tone="rose" dot>
              {resumen.enRiesgo} en riesgo
            </Pill>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {statuses.map((key) => {
          const value = resumen[key];
          return (
            <div key={key}>
              <div className="flex items-center mb-1.5">
                <div
                  className="w-2 h-2 rounded-[2px] mr-2"
                  style={{ background: STATUS_COLORS[key] }}
                />
                <div className="text-[12.5px] font-medium text-[var(--text)]">
                  {STATUS_LABELS[key]}
                </div>
                <div className="ml-auto flex items-center gap-2.5">
                  <span className="font-mono text-[11.5px] text-[var(--text-3)]">
                    {Math.round((value / total) * 100)}%
                  </span>
                  <span className="font-mono text-[13.5px] font-semibold text-[var(--text)] min-w-[22px] text-right">
                    {value}
                  </span>
                </div>
              </div>
              <div className="h-[6px] bg-[var(--surface-2)] border border-[var(--border)] rounded-[3px] overflow-hidden">
                <div
                  className="h-full rounded-[3px] transition-[width] duration-500"
                  style={{
                    width: `${(value / Math.max(1, ...statuses.map((s) => resumen[s]))) * 100}%`,
                    background: STATUS_COLORS[key],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function exportCsv(data: CumplimientoSocioData) {
  const rows: string[] = [
    'Responsable,Total,Presentados,Vencidos,Prorrogados,Pendientes,En Riesgo,% Cumplimiento',
  ];
  for (const r of data.porResponsable) {
    rows.push(
      `"${r.responsableNombre}",${r.total},${r.presentados},${r.vencidos},${r.prorrogados},${r.pendientes},${r.enRiesgo},${r.porcentajeCumplimiento}%`,
    );
  }
  const { resumenGeneral: g } = data;
  rows.push(
    `"TOTAL",${g.total},${g.presentados},${g.vencidos},${g.prorrogados},${g.pendientes},${g.enRiesgo},${g.porcentajeCumplimiento}%`,
  );
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cumplimiento-${data.periodo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const RESPONSABLE_COLUMNS: Column<CumplimientoResponsable>[] = [
  {
    header: 'Responsable',
    render: (r) => (
      <span className="font-medium text-[var(--brand)] hover:underline">{r.responsableNombre}</span>
    ),
  },
  {
    header: 'Total',
    align: 'right',
    render: (r) => <span className="font-mono">{r.total}</span>,
  },
  {
    header: 'Cumplimiento',
    render: (r) => (
      <div className="flex items-center gap-2 min-w-[120px]">
        <div className="flex-1">
          <CumplimientoBar row={r} />
        </div>
        <span className="font-mono text-[11.5px] text-[var(--text-3)] min-w-[32px] text-right">
          {r.porcentajeCumplimiento}%
        </span>
      </div>
    ),
  },
  {
    header: 'Presentados',
    align: 'right',
    render: (r) => (
      <span className="font-mono" style={{ color: 'var(--brand)' }}>
        {r.presentados}
      </span>
    ),
  },
  {
    header: 'Vencidos',
    align: 'right',
    render: (r) => (
      <span className="font-mono" style={{ color: r.vencidos > 0 ? 'var(--rose)' : undefined }}>
        {r.vencidos}
      </span>
    ),
  },
  {
    header: 'Pendientes',
    align: 'right',
    render: (r) => (
      <span className="font-mono" style={{ color: r.pendientes > 0 ? 'var(--amber-ink)' : undefined }}>
        {r.pendientes}
      </span>
    ),
  },
  {
    header: 'En Riesgo',
    align: 'right',
    render: (r) =>
      r.enRiesgo > 0 ? (
        <Pill tone="rose" dot small>
          {r.enRiesgo}
        </Pill>
      ) : (
        <span className="font-mono text-[var(--text-3)]">0</span>
      ),
  },
];

export function CumplimientoSocioPage() {
  const { estudioActual } = useAuth();
  const router = useRouter();
  const [periodo, setPeriodo] = useState(currentPeriodo);

  const handleDrilldown = useCallback(
    (row: CumplimientoResponsable) => {
      const params = new URLSearchParams();
      params.set('periodo', periodo);
      if (row.responsableId) {
        params.set('responsableId', row.responsableId);
        params.set('responsable', row.responsableNombre);
      }
      router.push(`/vencimientos?${params.toString()}`);
    },
    [periodo, router],
  );

  const endpoint = useMemo(
    () => `/v1/dashboard/cumplimiento-socio?periodo=${periodo}`,
    [periodo],
  );

  const { data, loading, error } = useFetchWithEstudio<CumplimientoSocioData>(endpoint);

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="chart">
      <PageHeader
        title="Cumplimiento por Responsable"
        subtitle={`Métricas de cumplimiento del estudio — ${formatPeriodo(periodo)}.`}
        actions={
          <>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setPeriodo(prevPeriodo)}>
                {Icons.chevL}
              </Button>
              <span className="text-[12.5px] font-medium text-[var(--text)] min-w-[110px] text-center">
                {formatPeriodo(periodo)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPeriodo(nextPeriodo)}
                disabled={periodo >= currentPeriodo()}
              >
                {Icons.chevR}
              </Button>
            </div>
            <Button
              variant="ghost"
              icon={Icons.download}
              onClick={() => data && exportCsv(data)}
              disabled={!data}
            >
              Exportar
            </Button>
          </>
        }
      />

      {data && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <KpiCard
              label="% Cumplimiento"
              value={`${data.resumenGeneral.porcentajeCumplimiento}%`}
              delta={{
                tone: data.resumenGeneral.porcentajeCumplimiento >= 80 ? 'brand' : 'amber',
                text:
                  data.resumenGeneral.porcentajeCumplimiento >= 80
                    ? 'en meta'
                    : 'debajo de meta',
              }}
            />
            <KpiCard
              label="Presentados"
              value={data.resumenGeneral.presentados}
              delta={{ tone: 'brand', text: `de ${data.resumenGeneral.total}` }}
            />
            <KpiCard
              label="Pendientes"
              value={data.resumenGeneral.pendientes}
              delta={{
                tone: data.resumenGeneral.pendientes > 0 ? 'amber' : 'brand',
                text: data.resumenGeneral.pendientes > 0 ? 'sin presentar' : 'al día',
              }}
            />
            <KpiCard
              label="Vencidos"
              value={data.resumenGeneral.vencidos}
              delta={{
                tone: data.resumenGeneral.vencidos > 0 ? 'rose' : 'brand',
                text: data.resumenGeneral.vencidos > 0 ? 'requieren atención' : 'ninguno',
              }}
            />
            <KpiCard
              label="En Riesgo"
              value={data.resumenGeneral.enRiesgo}
              delta={{
                tone: data.resumenGeneral.enRiesgo > 0 ? 'rose' : 'brand',
                text: data.resumenGeneral.enRiesgo > 0 ? 'próximos a vencer' : 'sin riesgo',
              }}
            />
          </div>

          {/* Main content: status breakdown + table */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-3.5 mb-4">
            <ResumenCard resumen={data.resumenGeneral} />
            <Card title="Detalle por Responsable" subtitle="Métricas individuales del período">
              <DataTable
                columns={RESPONSABLE_COLUMNS}
                rows={data.porResponsable}
                rowKey={(r) => r.responsableId ?? 'sin-asignar'}
                onRowClick={handleDrilldown}
                emptyMessage="Sin datos de cumplimiento para este período."
                footer={
                  <span>
                    {data.porResponsable.length} responsable
                    {data.porResponsable.length !== 1 ? 's' : ''}
                  </span>
                }
              />
            </Card>
          </div>
        </>
      )}
    </PageStateGuard>
  );
}
