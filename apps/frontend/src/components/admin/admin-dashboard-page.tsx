'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Button, Card, PageHeader, SegmentedControl } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';
import { formatCurrencyCompact } from '@/lib/formatters';
import { KpiAdminCard } from './kpi-admin-card';
import { SparkLine, SparkBars, UptimeBars } from './sparks';
import { DonutChart, DonutLegend } from './donut-chart';
import { UsageBars } from './usage-bars';
import { ActivityFeed, type ActivityItem } from './activity-feed';
import { SystemHealthList, type ServiceStatus } from './system-health-list';
import { AdminStudiosTable, type StudioRow } from './admin-studios-table';

type PlanTone = 'brand' | 'indigo' | 'amber' | 'neutral';
type ServiceStatusKey = 'ok' | 'warn' | 'err';
type ActivityTone = 'brand' | 'amber' | 'rose' | 'indigo';

interface KpiWithSparkline {
  value: number;
  delta: string;
  deltaUp: boolean;
  sparkline: number[];
}

interface UptimeKpi extends KpiWithSparkline {
  incidents: number;
  totalDowntimeSec: number;
  dailyStatuses: ServiceStatusKey[];
}

interface DauMauKpi extends KpiWithSparkline {
  dau: number;
  mau: number;
  stickiness: number;
}

interface GrowthPoint {
  month: string;
  mrr: number;
  newStudios: number;
  churn: number;
}

interface PlanDistributionEntry {
  plan: string;
  count: number;
  percent: number;
  tone: PlanTone;
}

interface ModuleUsageEntry {
  module: string;
  pctActiveStudios: number;
  tone: PlanTone;
}

interface ActivityEntry {
  id: string;
  tone: ActivityTone;
  body: string;
  meta?: string;
  time: string;
}

interface ServiceHealthEntry {
  name: string;
  detail: string;
  uptime: string;
  status: ServiceStatusKey;
}

interface AdminDashboardStats {
  kpis: {
    mrr: KpiWithSparkline;
    estudiosActivos: KpiWithSparkline;
    dauMau: DauMauKpi | null;
    uptime: UptimeKpi;
  };
  growth: GrowthPoint[];
  planDistribution: PlanDistributionEntry[];
  moduleUsage: ModuleUsageEntry[];
  activity: ActivityEntry[];
  services: ServiceHealthEntry[];
  topStudios: StudioRow[];
}

const PERIODS = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'year', label: 'Año' },
] as const;

type PeriodValue = (typeof PERIODS)[number]['value'];

const GROWTH_METRICS = [
  { value: 'mrr', label: 'MRR' },
  { value: 'studios', label: 'Estudios' },
  { value: 'users', label: 'Usuarios' },
] as const;

type GrowthMetric = (typeof GROWTH_METRICS)[number]['value'];

const TONE_COLOR: Record<PlanTone, string> = {
  brand: 'var(--brand)',
  indigo: 'var(--indigo)',
  amber: 'var(--amber)',
  neutral: 'var(--text-3)',
};

const MODULE_TONE_ORDER: PlanTone[] = ['brand', 'brand', 'indigo', 'indigo', 'amber', 'amber'];

export function AdminDashboardPage() {
  const [period, setPeriod] = useState<PeriodValue>('30d');
  const [growthMetric, setGrowthMetric] = useState<GrowthMetric>('mrr');

  const { data, loading, error } = useFetch<AdminDashboardStats>('/v1/admin/dashboard/stats');

  return (
    <>
      <PageHeader
        title="Panel de control"
        subtitle="Vista consolidada de la plataforma"
        actions={
          <>
            <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />
            <Button variant="ghost">
              <DownloadIcon /> Exportar
            </Button>
          </>
        }
      />

      <PageStateGuard loading={loading} error={error}>
        {data && (
          <AdminDashboardContent
            data={data}
            growthMetric={growthMetric}
            onGrowthMetricChange={setGrowthMetric}
          />
        )}
      </PageStateGuard>
    </>
  );
}

function AdminDashboardContent({
  data,
  growthMetric,
  onGrowthMetricChange,
}: {
  data: AdminDashboardStats;
  growthMetric: GrowthMetric;
  onGrowthMetricChange: (v: GrowthMetric) => void;
}) {
  const totalStudios = data.planDistribution.reduce((a, d) => a + d.count, 0);

  const mrrSparkPoints = useMemo(
    () => normalize(data.kpis.mrr.sparkline),
    [data.kpis.mrr.sparkline],
  );
  const estudiosSparkValues = useMemo(
    () => normalize(data.kpis.estudiosActivos.sparkline.slice(-9)),
    [data.kpis.estudiosActivos.sparkline],
  );
  const uptimeDailyStatuses = useMemo(
    () =>
      data.kpis.uptime.dailyStatuses.length > 0
        ? data.kpis.uptime.dailyStatuses
        : (Array(30).fill('ok') as ServiceStatusKey[]),
    [data.kpis.uptime.dailyStatuses],
  );

  const dauMau = data.kpis.dauMau;
  const uptime = data.kpis.uptime;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KpiAdminCard
          label="MRR"
          icon={<DollarIcon />}
          value={formatCurrencyCompact(data.kpis.mrr.value)}
          delta={{
            text: `${data.kpis.mrr.delta} vs mes anterior`,
            tone: data.kpis.mrr.deltaUp ? 'up' : 'down',
          }}
          spark={<SparkLine points={mrrSparkPoints} id="sp-mrr" />}
        />
        <KpiAdminCard
          label="Estudios activos"
          icon={<BuildingIcon />}
          value={String(data.kpis.estudiosActivos.value)}
          delta={{
            text: data.kpis.estudiosActivos.delta,
            tone: data.kpis.estudiosActivos.deltaUp ? 'up' : 'down',
          }}
          spark={<SparkBars values={estudiosSparkValues} />}
        />
        <KpiAdminCard
          label="DAU / MAU"
          icon={<UsersIcon />}
          value={
            dauMau ? (
              <>
                {dauMau.dau.toLocaleString('es-AR')}{' '}
                <span className="text-[15px] text-[var(--text-3)]">
                  / {dauMau.mau.toLocaleString('es-AR')}
                </span>
              </>
            ) : (
              <span className="text-[15px] text-[var(--text-3)]">Sin datos</span>
            )
          }
          delta={
            dauMau
              ? {
                  text: `${dauMau.stickiness.toFixed(1)}% stickiness · ${dauMau.delta}`,
                  tone: dauMau.deltaUp ? 'up' : 'down',
                }
              : { text: 'tracking pendiente', tone: 'flat' }
          }
          spark={
            dauMau ? (
              <SparkLine points={normalize(dauMau.sparkline)} color="var(--indigo)" id="sp-dau" />
            ) : null
          }
        />
        <KpiAdminCard
          label="Uptime 30d"
          icon={<HeartbeatIcon />}
          value={`${uptime.value.toFixed(2)}%`}
          delta={{
            text: `${uptime.incidents} incidentes · ${formatDowntime(uptime.totalDowntimeSec)} total`,
            tone: uptime.incidents === 0 ? 'up' : 'flat',
          }}
          spark={<UptimeBars statuses={uptimeDailyStatuses} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3 mb-3">
        <Card padding={0}>
          <CardHead
            title="Crecimiento de la plataforma"
            subtitle="MRR + nuevos estudios + churn · últimos 12 meses"
            right={
              <SegmentedControl
                options={GROWTH_METRICS}
                value={growthMetric}
                onChange={onGrowthMetricChange}
                size="sm"
              />
            }
          />
          <div className="flex gap-3.5 px-[18px] pt-3 pb-3 text-[11.5px] text-[var(--text-3)]">
            <LegendDot color="var(--brand)" label="MRR" />
            <LegendDot color="var(--indigo)" label="Nuevos estudios" />
            <LegendDot color="var(--text-4)" label="Churn" />
          </div>
          <GrowthChart growth={data.growth} />
        </Card>

        <Card padding={0}>
          <CardHead title="Distribución por plan" subtitle={`${totalStudios} estudios activos`} />
          <div className="flex items-center gap-[18px] p-[18px]">
            <DonutChart
              slices={data.planDistribution.map((p) => ({
                label: p.plan,
                value: p.count,
                color: TONE_COLOR[p.tone],
              }))}
              centerValue={totalStudios}
              centerLabel="Estudios"
            />
            <DonutLegend
              rows={data.planDistribution.map((p) => ({
                label: p.plan,
                value: p.count,
                percent: `${p.percent}%`,
                color: TONE_COLOR[p.tone],
              }))}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <Card padding={0}>
          <CardHead title="Uso por módulo" subtitle="% estudios activos · últimos 7 días" />
          {data.moduleUsage.length > 0 ? (
            <UsageBars
              rows={data.moduleUsage.map((m, i) => ({
                label: m.module,
                value: m.pctActiveStudios,
                tone: (m.tone === 'neutral'
                  ? MODULE_TONE_ORDER[i % MODULE_TONE_ORDER.length]
                  : m.tone) as Exclude<PlanTone, 'neutral'>,
              }))}
            />
          ) : (
            <EmptyState label="Telemetría de módulos no disponible aún" />
          )}
        </Card>

        <Card padding={0}>
          <CardHead title="Actividad reciente" subtitle="Eventos de auditoría" />
          {data.activity.length > 0 ? (
            <ActivityFeed items={data.activity.map(toActivityItem)} />
          ) : (
            <EmptyState label="Sin actividad registrada" />
          )}
        </Card>

        <Card padding={0}>
          <CardHead title="Estado del sistema" subtitle="Servicios críticos" />
          <SystemHealthList services={data.services as ServiceStatus[]} />
        </Card>
      </div>

      <Card padding={0} className="mb-3">
        <CardHead
          title="Top estudios por uso"
          subtitle="Ordenados por usuarios activos en los últimos 30 días"
          right={
            <>
              <Button variant="ghost">
                <FilterIcon /> Filtros
              </Button>
              <Button variant="primary">Ver todos</Button>
            </>
          }
        />
        <StudiosTableControls total={totalStudios} shown={data.topStudios.length} />
        <AdminStudiosTable rows={data.topStudios} />
      </Card>
    </>
  );
}

function toActivityItem(e: ActivityEntry): ActivityItem {
  return { id: e.id, tone: e.tone, body: e.body, meta: e.meta, time: e.time };
}

function normalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const max = Math.max(...values, 1);
  return values.map((v) => (v <= 0 ? 0 : v / max));
}

function formatDowntime(sec: number): string {
  if (sec <= 0) return '0s';
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rest = sec % 60;
  return rest === 0 ? `${min}m` : `${min}m ${rest}s`;
}

function CardHead({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-[var(--border)]">
      <div>
        <h3 className="text-[13.5px] font-semibold tracking-[-0.01em] m-0 text-[var(--text)]">
          {title}
        </h3>
        {subtitle && <div className="text-[11.5px] text-[var(--text-3)] mt-0.5">{subtitle}</div>}
      </div>
      {right && <div className="flex items-center gap-1.5">{right}</div>}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-[2px]" style={{ background: color }} />
      {label}
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="px-[18px] py-8 text-center text-[12px] text-[var(--text-3)]">{label}</div>;
}

function StudiosTableControls({ total, shown }: { total: number; shown: number }) {
  const [filter, setFilter] = useState<'activos' | 'trial' | 'suspended' | 'risk'>('activos');
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
      <input
        type="search"
        placeholder="Buscar por nombre, CUIT o ID…"
        className="h-8 w-[260px] bg-[var(--surface)] border border-[var(--border)] rounded-[7px] px-2.5 text-[12.5px] text-[var(--text)] outline-none focus:border-[var(--brand)]"
      />
      <Chip on={filter === 'activos'} onClick={() => setFilter('activos')}>
        Activos
      </Chip>
      <Chip on={filter === 'trial'} onClick={() => setFilter('trial')}>
        Trial
      </Chip>
      <Chip on={filter === 'suspended'} onClick={() => setFilter('suspended')}>
        Suspendidos
      </Chip>
      <Chip on={filter === 'risk'} onClick={() => setFilter('risk')}>
        Riesgo churn
      </Chip>
      <span className="ml-auto text-[11.5px] text-[var(--text-3)]">
        Mostrando {shown} de {total || shown}
      </span>
    </div>
  );
}

function Chip({
  children,
  on,
  onClick,
}: {
  children: ReactNode;
  on?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[26px] px-2.5 rounded-md border text-[11.5px] cursor-pointer inline-flex items-center gap-1.5 ${
        on
          ? 'bg-[var(--brand-softer)] text-[var(--brand-ink)] border-[var(--brand-soft)]'
          : 'bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  );
}

function GrowthChart({ growth }: { growth: GrowthPoint[] }) {
  if (growth.length === 0) {
    return <EmptyState label="Sin datos de crecimiento" />;
  }

  const width = 760;
  const height = 260;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxMrr = Math.max(...growth.map((g) => g.mrr), 1);
  const yTickStep = Math.ceil(maxMrr / 5 / 100000) * 100000 || Math.ceil(maxMrr / 5) || 1;
  const yTicks = [1, 2, 3, 4, 5].map((n) => n * yTickStep);
  const yMax = yTicks[yTicks.length - 1];
  const yToPx = (v: number) => padT + chartH - (v / yMax) * chartH;

  const step = growth.length > 1 ? chartW / (growth.length - 1) : 0;
  const xOf = (i: number) => padL + i * step;

  const maxNew = Math.max(...growth.map((g) => g.newStudios), 1);
  const barW = Math.max(8, step * 0.38);

  const linePoints = growth
    .map((g, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)} ${yToPx(g.mrr)}`)
    .join(' ');
  const areaPath = `${linePoints} L${xOf(growth.length - 1)} ${padT + chartH} L${padL} ${padT + chartH} Z`;

  return (
    <div className="px-1.5 pb-2.5">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <g stroke="var(--border)" strokeWidth="1">
          {yTicks.map((_, i) => {
            const y = padT + chartH - (chartH * (i + 1)) / yTicks.length;
            return <line key={i} x1={padL} y1={y} x2={width - padR} y2={y} />;
          })}
        </g>
        <g fontFamily="JetBrains Mono" fontSize="9.5" fill="var(--text-3)">
          {yTicks.map((v, i) => {
            const y = padT + chartH - (chartH * (i + 1)) / yTicks.length;
            return (
              <text key={i} x={padL - 4} y={y + 3} textAnchor="end">
                {formatCurrencyCompact(v)}
              </text>
            );
          })}
          {growth.map((g, i) => (
            <text key={`${g.month}-${i}`} x={xOf(i)} y={height - 10} textAnchor="middle">
              {g.month}
            </text>
          ))}
        </g>
        <defs>
          <linearGradient id="mrrGr" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--brand)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#mrrGr)" />
        <path
          d={linePoints}
          stroke="var(--brand)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g fill="var(--indigo)" opacity="0.75">
          {growth.map((g, i) => {
            const h = (g.newStudios / maxNew) * (chartH * 0.35);
            return (
              <rect
                key={`${g.month}-${i}-bar`}
                x={xOf(i) - barW / 2}
                y={padT + chartH - h}
                width={barW}
                height={Math.max(2, h)}
                rx="2"
              />
            );
          })}
        </g>
        <circle
          cx={xOf(growth.length - 1)}
          cy={yToPx(growth[growth.length - 1].mrr)}
          r="4"
          fill="var(--brand)"
          stroke="var(--bg)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M6 12h12M10 18h4" />
    </svg>
  );
}
function DollarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21a6 6 0 0 1 12 0" />
      <circle cx="17" cy="7" r="3" />
      <path d="M21 21a5 5 0 0 0-8-4" />
    </svg>
  );
}
function HeartbeatIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12A10 10 0 1 1 12 2a7 7 0 0 0 10 10Z" />
    </svg>
  );
}
