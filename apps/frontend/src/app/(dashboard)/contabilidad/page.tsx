'use client';

import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { formatCurrency } from '@/lib/formatters';
import {
  STATUS_COLORS,
  CARD_CLASSES,
  TABLE_CLASSES,
  KPI_ICON_STYLE,
  CHART_THEME,
} from '@/lib/design-tokens';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface LibroInfo {
  id: string;
  tipo: string;
  periodo: string;
  isRubricado: boolean;
  numeroRubrica?: string;
}

interface AsientoReciente {
  id: string;
  fecha: string;
  descripcion: string;
  totalDebe: number;
  totalHaber: number;
}

interface ContabilidadStats {
  asientosDelPeriodo: number;
  librosRubricados: number;
  totalLibros: number;
  balanceCuadrado: boolean;
  libros: LibroInfo[];
  mensualDebeHaber: { mes: string; debe: number; haber: number }[];
  asientosRecientes: AsientoReciente[];
}

const TIPO_LIBRO_LABELS: Record<string, string> = {
  IVA_COMPRAS: 'IVA Compras',
  IVA_VENTAS: 'IVA Ventas',
  DIARIO: 'Diario',
  INVENTARIO_BALANCES: 'Mayor',
  SUELDOS: 'Sueldos',
};

const TIPO_LIBRO_ICONS: Record<string, string> = {
  IVA_COMPRAS: 'shopping_cart',
  IVA_VENTAS: 'point_of_sale',
  DIARIO: 'menu_book',
  INVENTARIO_BALANCES: 'inventory',
  SUELDOS: 'badge',
};

export default function ContabilidadPage() {
  const { estudioActual, tienePermiso } = useAuth();
  const {
    data: stats,
    loading,
    error,
  } = useFetchWithEstudio<ContabilidadStats>('/v1/contabilidad/stats');

  if (!tienePermiso('VER_CONTABILIDAD')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-red-400">lock</span>
          <p className="mt-2 text-[#45474c] dark:text-[#a0a3a8]">
            No tiene permisos para acceder a esta seccion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="menu_book">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Contabilidad</h1>
          <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
            Libros contables, asientos y balance del estudio.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`${CARD_CLASSES.full} p-6`}>
            <div className="flex items-center gap-3">
              <div className={`${KPI_ICON_STYLE.className} rounded-lg p-2.5`}>
                <span className={`material-symbols-outlined ${KPI_ICON_STYLE.text} text-xl`}>
                  edit_note
                </span>
              </div>
              <div>
                <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">Asientos del Periodo</p>
                <p className="text-2xl font-bold text-[#091426] dark:text-white">
                  {stats?.asientosDelPeriodo ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className={`${CARD_CLASSES.full} p-6`}>
            <div className="flex items-center gap-3">
              <div className={`${KPI_ICON_STYLE.className} rounded-lg p-2.5`}>
                <span className={`material-symbols-outlined ${KPI_ICON_STYLE.text} text-xl`}>
                  verified
                </span>
              </div>
              <div>
                <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">Libros Rubricados</p>
                <p className="text-2xl font-bold text-[#091426] dark:text-white">
                  {stats?.librosRubricados ?? 0} / {stats?.totalLibros ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className={`${CARD_CLASSES.full} p-6`}>
            <div className="flex items-center gap-3">
              <div
                className={`rounded-lg p-2.5 ${stats?.balanceCuadrado ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-red-50 dark:bg-red-900/30 text-red-600'}`}
              >
                <span
                  className={`material-symbols-outlined text-xl ${stats?.balanceCuadrado ? 'text-[#4edea3]' : 'text-red-600 dark:text-red-400'}`}
                >
                  {stats?.balanceCuadrado ? 'check_circle' : 'error'}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">Balance</p>
                <p
                  className={`text-2xl font-bold ${stats?.balanceCuadrado ? 'text-[#4edea3]' : 'text-red-600 dark:text-red-400'}`}
                >
                  {stats?.balanceCuadrado ? 'Cuadrado' : 'Descuadrado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Libros + Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Libros Contables */}
          <div className={`${CARD_CLASSES.full} p-6`}>
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
              Libros Contables
            </h2>
            <div className="space-y-3">
              {(stats?.libros ?? []).map((libro) => (
                <div
                  key={libro.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#f0f4f8] dark:bg-[#162a4a] border border-[#e2e8f0]/50 dark:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#45474c] dark:text-[#a0a3a8]">
                      {TIPO_LIBRO_ICONS[libro.tipo] ?? 'menu_book'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#091426] dark:text-white">
                        {TIPO_LIBRO_LABELS[libro.tipo] ?? libro.tipo}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-[#75777d]">{libro.periodo}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      libro.isRubricado ? STATUS_COLORS['Activo'] : STATUS_COLORS['Pendiente']
                    }`}
                  >
                    {libro.isRubricado ? 'Rubricado' : 'Pendiente'}
                  </span>
                </div>
              ))}
              {(stats?.libros ?? []).length === 0 && (
                <p className="text-sm text-gray-400 dark:text-[#75777d] text-center py-4">
                  Sin libros registrados.
                </p>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className={`lg:col-span-2 ${CARD_CLASSES.full} p-6`}>
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
              Debe vs Haber por Mes
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.mensualDebeHaber ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={CHART_THEME.tooltipStyle}
                  />
                  <Legend />
                  <Bar dataKey="debe" fill={CHART_THEME.primaryFill} name="Debe" />
                  <Bar dataKey="haber" fill={CHART_THEME.secondaryFill} name="Haber" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Asientos Table */}
        <div className={`${CARD_CLASSES.full} overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white">
              Asientos Recientes
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={`border-b border-gray-200 dark:border-white/10 ${TABLE_CLASSES.header}`}
                >
                  <th className={`text-left py-3 px-4 font-medium ${TABLE_CLASSES.headerText}`}>
                    Fecha
                  </th>
                  <th className={`text-left py-3 px-4 font-medium ${TABLE_CLASSES.headerText}`}>
                    Descripcion
                  </th>
                  <th className={`text-right py-3 px-4 font-medium ${TABLE_CLASSES.headerText}`}>
                    Debe
                  </th>
                  <th className={`text-right py-3 px-4 font-medium ${TABLE_CLASSES.headerText}`}>
                    Haber
                  </th>
                </tr>
              </thead>
              <tbody>
                {(stats?.asientosRecientes ?? []).map((a) => (
                  <tr
                    key={a.id}
                    className={`border-b border-[#e2e8f0]/50 dark:border-white/5 ${TABLE_CLASSES.rowHover}`}
                  >
                    <td className="py-3 px-4 text-[#45474c] dark:text-[#c5c6cd]">
                      {new Date(a.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-3 px-4 text-[#091426] dark:text-white">{a.descripcion}</td>
                    <td className="py-3 px-4 text-right text-[#091426] dark:text-white font-medium">
                      {formatCurrency(a.totalDebe)}
                    </td>
                    <td className="py-3 px-4 text-right text-[#091426] dark:text-white font-medium">
                      {formatCurrency(a.totalHaber)}
                    </td>
                  </tr>
                ))}
                {(stats?.asientosRecientes ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#45474c] dark:text-[#a0a3a8]">
                      No hay asientos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageStateGuard>
  );
}
