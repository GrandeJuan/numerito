'use client';

import { STATUS_COLORS, CARD_CLASSES, TABLE_CLASSES, KPI_ICON_STYLE } from '@/lib/design-tokens';

interface Obligacion {
  id: string;
  obligacion: string;
  periodo: string;
  fecha: string;
  estado: 'Pendiente' | 'Vencido' | 'Presentada';
}

const MOCK_OBLIGACIONES: Obligacion[] = [
  { id: '1', obligacion: 'IVA', periodo: '2026-04', fecha: '2026-04-20', estado: 'Pendiente' },
  {
    id: '2',
    obligacion: 'Ganancias',
    periodo: '2026-04',
    fecha: '2026-04-22',
    estado: 'Pendiente',
  },
  { id: '3', obligacion: 'IIBB', periodo: '2026-04', fecha: '2026-04-15', estado: 'Pendiente' },
  { id: '4', obligacion: 'IVA', periodo: '2026-03', fecha: '2026-03-20', estado: 'Presentada' },
  {
    id: '5',
    obligacion: 'Ganancias',
    periodo: '2026-03',
    fecha: '2026-03-22',
    estado: 'Presentada',
  },
  { id: '6', obligacion: 'IIBB', periodo: '2026-03', fecha: '2026-03-15', estado: 'Presentada' },
  {
    id: '7',
    obligacion: 'Cargas Sociales',
    periodo: '2026-02',
    fecha: '2026-02-10',
    estado: 'Vencido',
  },
  { id: '8', obligacion: 'IVA', periodo: '2026-02', fecha: '2026-02-20', estado: 'Presentada' },
];

function formatFecha(fecha: string): string {
  try {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return fecha;
  }
}

const TIMELINE_DOT_COLORS: Record<string, string> = {
  Pendiente: 'bg-amber-400',
  Presentada: 'bg-emerald-400',
  Vencido: 'bg-red-400',
};

export default function PortalObligacionesPage() {
  const pendientes = MOCK_OBLIGACIONES.filter((o) => o.estado === 'Pendiente').length;
  const vencidas = MOCK_OBLIGACIONES.filter((o) => o.estado === 'Vencido').length;
  const presentadas = MOCK_OBLIGACIONES.filter((o) => o.estado === 'Presentada').length;

  const kpis = [
    {
      label: 'Pendientes',
      value: pendientes,
      icon: 'schedule',
    },
    {
      label: 'Vencidas',
      value: vencidas,
      icon: 'warning',
    },
    {
      label: 'Presentadas',
      value: presentadas,
      icon: 'check_circle',
    },
  ];

  // Timeline: show recent obligations sorted by date
  const timelineItems = [...MOCK_OBLIGACIONES]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Mis Obligaciones</h1>
        <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
          Estado de sus obligaciones fiscales.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Timeline */}
      <div className={`${CARD_CLASSES.full} p-6`}>
        <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
          Linea de Tiempo
        </h2>
        <div
          data-testid="obligaciones-timeline"
          className="flex items-center gap-2 overflow-x-auto pb-2"
        >
          {timelineItems.map((item, i) => (
            <div key={item.id} className="flex items-center">
              <div className="flex flex-col items-center min-w-[80px]">
                <div
                  className={`w-4 h-4 rounded-full ${TIMELINE_DOT_COLORS[item.estado]} ring-4 ring-white dark:ring-gray-800`}
                />
                <p className="text-xs font-medium text-[#091426] dark:text-white mt-2">
                  {item.obligacion}
                </p>
                <p className="text-xs text-[#45474c] dark:text-[#a0a3a8]">
                  {formatFecha(item.fecha)}
                </p>
              </div>
              {i < timelineItems.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-200 dark:bg-[#162a4a] mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Read-only Table */}
      <div className={`${CARD_CLASSES.full}`}>
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
            Detalle de Obligaciones
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className={`text-left py-3 px-6 ${TABLE_CLASSES.headerText}`}>Obligacion</th>
                <th className={`text-left py-3 px-6 ${TABLE_CLASSES.headerText}`}>Periodo</th>
                <th className={`text-left py-3 px-6 ${TABLE_CLASSES.headerText}`}>Fecha</th>
                <th className={`text-left py-3 px-6 ${TABLE_CLASSES.headerText}`}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_OBLIGACIONES.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-[#e2e8f0]/50 dark:border-white/5 last:border-0"
                >
                  <td className="py-3 px-6 text-[#091426] dark:text-white font-medium">
                    {o.obligacion}
                  </td>
                  <td className="py-3 px-6 text-[#45474c] dark:text-[#a0a3a8]">{o.periodo}</td>
                  <td className="py-3 px-6 text-[#45474c] dark:text-[#a0a3a8]">
                    {formatFecha(o.fecha)}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.estado]}`}
                    >
                      {o.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 mt-0.5">
          info
        </span>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Para consultas sobre sus obligaciones, contacte a su estudio contable.
        </p>
      </div>
    </div>
  );
}
