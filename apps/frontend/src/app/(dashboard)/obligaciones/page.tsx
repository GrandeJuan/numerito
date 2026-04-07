'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { STATUS_COLORS, CARD_CLASSES, TABLE_CLASSES, KPI_ICON_STYLE } from '@/lib/design-tokens';

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

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PRESENTADO: 'Presentado',
  VENCIDO: 'Vencido',
};

const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function formatFecha(fecha: string): string {
  try {
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return fecha;
  }
}

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
  const [vencimientos, setVencimientos] = useState<VencimientoRow[]>([]);
  const [calendarVencimientos, setCalendarVencimientos] = useState<VencimientoRow[]>([]);
  const [kpis, setKpis] = useState<ObligacionesKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [presentando, setPresentando] = useState<string | null>(null);

  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const periodo = useMemo(() => getPeriodoString(calendarDate), [calendarDate]);

  useEffect(() => {
    if (!estudioActual) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [kpisRes, vencimientosRes, calendarioRes] = await Promise.all([
          apiFetch('/v1/obligaciones/kpis'),
          apiFetch('/v1/obligaciones/vencimientos'),
          apiFetch(`/v1/obligaciones/calendario/${periodo}`),
        ]);

        if (!kpisRes.ok || !vencimientosRes.ok) throw new Error('Error al cargar obligaciones');

        const kpisBody = await kpisRes.json();
        setKpis(kpisBody.data);

        const vBody = await vencimientosRes.json();
        setVencimientos(vBody.data);
        setMeta(vBody.meta ?? { total: vBody.data.length, page: 1, limit: 20 });

        if (calendarioRes.ok) {
          const calBody = await calendarioRes.json();
          setCalendarVencimientos(calBody.data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [estudioActual, periodo]);

  const handlePresentar = useCallback(
    async (id: string) => {
      setPresentando(id);
      try {
        const res = await apiFetch(`/v1/obligaciones/vencimientos/${id}/presentar`, {
          method: 'PATCH',
        });
        if (res.ok) {
          setVencimientos((prev) =>
            prev.map((v) => (v.id === id ? { ...v, estado: 'PRESENTADO' } : v)),
          );
          setCalendarVencimientos((prev) =>
            prev.map((v) => (v.id === id ? { ...v, estado: 'PRESENTADO' } : v)),
          );
          if (kpis) {
            setKpis({
              ...kpis,
              pendientes: Math.max(0, kpis.pendientes - 1),
              presentadosEsteMes: kpis.presentadosEsteMes + 1,
            });
          }
        }
      } finally {
        setPresentando(null);
      }
    },
    [kpis],
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
    for (const v of calendarVencimientos) {
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

  if (!estudioActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-[#75777d]">
            event
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, vencimientos.length);

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
                      {hasPresented && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
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
      <div className={`${CARD_CLASSES.full} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white">Vencimientos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`border-b border-gray-200 dark:border-white/10 ${TABLE_CLASSES.header}`}
              >
                <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>Cliente</th>
                <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>Obligacion</th>
                <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>Periodo</th>
                <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>Fecha</th>
                <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>Estado</th>
                <th className={`text-right py-3 px-4 ${TABLE_CLASSES.headerText}`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vencimientos.map((v) => (
                <tr
                  key={v.id}
                  className={`border-b border-[#e2e8f0]/50 dark:border-white/5 ${TABLE_CLASSES.rowHover}`}
                >
                  <td className="py-3 px-4 text-[#091426] dark:text-white font-medium">
                    {v.cliente}
                  </td>
                  <td className="py-3 px-4 text-[#45474c] dark:text-[#c5c6cd]">
                    {v.tipoObligacion}
                  </td>
                  <td className="py-3 px-4 text-[#45474c] dark:text-[#c5c6cd]">{v.periodo}</td>
                  <td className="py-3 px-4 text-[#45474c] dark:text-[#c5c6cd]">
                    {formatFecha(v.fechaVencimiento)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.estado] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-[#a0a3a8]'}`}
                    >
                      {ESTADO_LABELS[v.estado] ?? v.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {v.estado === 'PENDIENTE' && (
                      <button
                        onClick={() => handlePresentar(v.id)}
                        disabled={presentando === v.id}
                        className="px-3 py-1 text-xs bg-[#091426] text-white font-bold rounded-xl shadow-lg shadow-[#091426]/20 hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        {presentando === v.id ? 'Presentando...' : 'Presentar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {vencimientos.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#45474c] dark:text-[#a0a3a8]">
                    No hay vencimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">
            Mostrando {start}-{end} de {vencimientos.length} vencimientos
          </p>
        </div>
      </div>
    </div>
  );
}
