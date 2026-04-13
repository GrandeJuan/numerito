'use client';

import { useMemo, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { formatFecha } from '@/lib/formatters';
import { CARD_CLASSES } from '@/lib/design-tokens';
import { KpiCard } from '@/components/shared/kpi-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ESTADO_VENCIMIENTO_LABELS } from '@numerito/shared';

interface VencimientoRow {
  id: string;
  cliente: string;
  clienteId: string;
  tipoObligacion: string;
  periodo: string;
  fechaVencimiento: string;
  descripcion: string;
  estado: string;
}

interface ObligacionesKpis {
  pendientes: number;
  vencidos: number;
  presentadosEsteMes: number;
  proximoVencimiento: string | null;
}

const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function getPeriodoString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last week
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function ObligacionesPage() {
  const { estudioActual } = useAuth();
  const [presentando, setPresentando] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const periodo = useMemo(() => getPeriodoString(calendarDate), [calendarDate]);

  const {
    data: kpis,
    loading: loadingKpis,
    error: errorKpis,
  } = useFetchWithEstudio<ObligacionesKpis>('/v1/obligaciones/kpis');
  const {
    data: vencimientosRaw,
    loading: loadingVenc,
    error: errorVenc,
    refetch: refetchVenc,
  } = useFetchWithEstudio<VencimientoRow[]>('/v1/obligaciones/vencimientos');
  const { data: calendarVencimientos, refetch: refetchCalendar } = useFetchWithEstudio<
    VencimientoRow[]
  >(`/v1/obligaciones/calendario/${periodo}`);

  const vencimientos = vencimientosRaw ?? [];
  const loading = loadingKpis || loadingVenc;
  const error = errorKpis || errorVenc;

  const handlePresentar = useCallback(
    async (id: string) => {
      setPresentando(id);
      try {
        const res = await apiFetch(`/v1/obligaciones/vencimientos/${id}/presentar`, {
          method: 'PATCH',
        });
        if (res.ok) {
          refetchVenc();
          refetchCalendar();
        }
      } finally {
        setPresentando(null);
      }
    },
    [refetchVenc, refetchCalendar],
  );

  const prevMonth = () => {
    setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  // Map vencimientos to calendar days
  const vencimientosByDay = useMemo(() => {
    const map: Record<number, VencimientoRow[]> = {};
    for (const v of calendarVencimientos ?? []) {
      const day = new Date(v.fechaVencimiento + 'T00:00:00').getDate();
      if (!map[day]) map[day] = [];
      map[day].push(v);
    }
    return map;
  }, [calendarVencimientos]);

  const calendarDays = useMemo(
    () => getCalendarDays(calendarDate.getFullYear(), calendarDate.getMonth()),
    [calendarDate],
  );

  const meta = { total: vencimientos.length, page: 1, limit: 20 };
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, vencimientos.length);

  const vencimientoColumns: Column<VencimientoRow>[] = [
    {
      key: 'cliente',
      header: 'Cliente',
      render: (v) => (
        <span className="text-[#091426] dark:text-white font-medium">{v.cliente}</span>
      ),
    },
    {
      key: 'tipoObligacion',
      header: 'Obligacion',
      render: (v) => <span className="text-[#45474c] dark:text-[#c5c6cd]">{v.tipoObligacion}</span>,
    },
    {
      key: 'periodo',
      header: 'Periodo',
      render: (v) => <span className="text-[#45474c] dark:text-[#c5c6cd]">{v.periodo}</span>,
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (v) => (
        <span className="text-[#45474c] dark:text-[#c5c6cd]">
          {formatFecha(v.fechaVencimiento)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (v) => (
        <StatusBadge
          status={v.estado}
          label={
            ESTADO_VENCIMIENTO_LABELS[v.estado as keyof typeof ESTADO_VENCIMIENTO_LABELS] ??
            v.estado
          }
        />
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right' as const,
      render: (v) =>
        v.estado === 'PENDIENTE' ? (
          <button
            onClick={() => handlePresentar(v.id)}
            disabled={presentando === v.id}
            className="px-3 py-1 text-xs bg-[#091426] text-white font-bold rounded-xl shadow-lg shadow-[#091426]/20 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {presentando === v.id ? 'Presentando...' : 'Presentar'}
          </button>
        ) : null,
    },
  ];

  const kpiCards = [
    {
      label: 'Pendientes',
      value: kpis?.pendientes ?? 0,
      icon: 'pending_actions',
    },
    {
      label: 'Vencidos',
      value: kpis?.vencidos ?? 0,
      icon: 'warning',
    },
    {
      label: 'Presentados este mes',
      value: kpis?.presentadosEsteMes ?? 0,
      icon: 'check_circle',
    },
    {
      label: 'Proximo vencimiento',
      value: kpis?.proximoVencimiento ? formatFecha(kpis.proximoVencimiento) : '-',
      icon: 'event',
    },
  ];

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="event">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Obligaciones</h1>
          <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
            Calendario y gestion de vencimientos fiscales.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <KpiCard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} />
          ))}
        </div>

        {/* Calendar */}
        <div className={`${CARD_CLASSES.full} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white">
              Calendario de Vencimientos
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                aria-label="Mes anterior"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#45474c] dark:text-[#a0a3a8]"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <span className="text-sm font-medium text-[#091426] dark:text-white capitalize min-w-[140px] text-center">
                {getMonthLabel(calendarDate)}
              </span>
              <button
                onClick={nextMonth}
                aria-label="Mes siguiente"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#45474c] dark:text-[#a0a3a8]"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px">
            {/* Day headers */}
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-[#45474c] dark:text-[#a0a3a8] py-2"
              >
                {d}
              </div>
            ))}

            {/* Calendar cells */}
            {calendarDays.map((day, i) => {
              const dayVencimientos = day ? (vencimientosByDay[day] ?? []) : [];
              const hasPresented = dayVencimientos.some((v) => v.estado === 'PRESENTADO');
              const hasPending = dayVencimientos.some((v) => v.estado === 'PENDIENTE');
              const hasOverdue = dayVencimientos.some((v) => v.estado === 'VENCIDO');

              return (
                <div
                  key={i}
                  className={`min-h-[48px] p-1 text-center text-sm rounded ${
                    day
                      ? 'text-[#091426] dark:text-white hover:bg-gray-50 dark:hover:bg-[#4edea3]/5'
                      : 'text-[#e2e8f0] dark:text-[#45474c]'
                  }`}
                >
                  {day && (
                    <>
                      <span className="block">{day}</span>
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {hasPresented && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                        {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vencimientos Table */}
        <div>
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white">Vencimientos</h2>
          </div>
          <DataTable<VencimientoRow>
            columns={vencimientoColumns}
            data={vencimientos}
            rowKey={(v) => v.id}
            emptyMessage="No hay vencimientos."
            footer={
              <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">
                Mostrando {start}-{end} de {vencimientos.length} vencimientos
              </p>
            }
          />
        </div>
      </div>
    </PageStateGuard>
  );
}
