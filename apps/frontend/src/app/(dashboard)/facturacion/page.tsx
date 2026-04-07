'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
  STATUS_COLORS,
  CARD_CLASSES,
  TABLE_CLASSES,
  KPI_ICON_STYLE,
  CHART_THEME,
} from '@/lib/design-tokens';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface FacturacionStats {
  facturado: number;
  cobrado: number;
  cobradoPorcentaje: number;
  saldoPendiente: number;
  facturasVencidas: number;
  porEstado: { estado: string; cantidad: number }[];
  mensual: { mes: string; facturado: number; cobrado: number }[];
}

interface FacturaRow {
  id: string;
  numero: string;
  clienteId: string;
  fechaEmision: string;
  total: number;
  estado: string;
  totalPagado: number;
}

const ESTADO_LABELS: Record<string, string> = {
  EMITIDA: 'Emitida',
  PARCIALMENTE_PAGADA: 'Parcial',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
  ANULADA: 'Anulada',
};

const PIE_COLORS = ['#4edea3', '#091426', '#00a472', '#ef4444', '#6b7280'];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-AR')}`;
}

export default function FacturacionPage() {
  const { estudioActual, tienePermiso } = useAuth();
  const [stats, setStats] = useState<FacturacionStats | null>(null);
  const [facturas, setFacturas] = useState<FacturaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });

  if (!estudioActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-[#75777d]">
            receipt_long
          </span>
          <p className="mt-2 text-[#45474c] dark:text-[#a0a3a8]">Cargando estudio...</p>
        </div>
      </div>
    );
  }

  if (!tienePermiso('VER_FACTURACION')) {
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, facturasRes] = await Promise.all([
          apiFetch('/v1/facturacion/stats'),
          apiFetch(`/v1/facturacion/facturas?page=${meta.page}&limit=${meta.limit}`),
        ]);

        if (!statsRes.ok || !facturasRes.ok) throw new Error('Error al cargar facturacion');

        const statsBody = await statsRes.json();
        setStats(statsBody.data);

        const facturasBody = await facturasRes.json();
        setFacturas(facturasBody.data);
        setMeta(facturasBody.meta ?? { total: facturasBody.data.length, page: 1, limit: 20 });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [estudioActual]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-[#a0a3a8]">Cargando...</p>
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
  const end = Math.min(meta.page * meta.limit, meta.total || facturas.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Facturacion</h1>
        <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
          Gestion de facturacion y cobranzas del estudio.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${CARD_CLASSES.full} p-6`}>
          <div className="flex items-center gap-3">
            <div className={`${KPI_ICON_STYLE.className} rounded-lg p-2.5`}>
              <span className={`material-symbols-outlined ${KPI_ICON_STYLE.text} text-xl`}>
                payments
              </span>
            </div>
            <div>
              <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">Facturado</p>
              <p className="text-2xl font-bold text-[#091426] dark:text-white">
                {formatCurrency(stats?.facturado ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className={`${CARD_CLASSES.full} p-6`}>
          <div className="flex items-center gap-3">
            <div className={`${KPI_ICON_STYLE.className} rounded-lg p-2.5`}>
              <span className={`material-symbols-outlined ${KPI_ICON_STYLE.text} text-xl`}>
                account_balance
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">Cobrado</p>
              <p className="text-2xl font-bold text-[#091426] dark:text-white">
                {formatCurrency(stats?.cobrado ?? 0)}
              </p>
              <div className="mt-1 w-full bg-gray-200 dark:bg-[#162a4a] rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats?.cobradoPorcentaje ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-[#75777d] mt-0.5">
                {stats?.cobradoPorcentaje ?? 0}%
              </p>
            </div>
          </div>
        </div>

        <div className={`${CARD_CLASSES.full} p-6`}>
          <div className="flex items-center gap-3">
            <div className={`${KPI_ICON_STYLE.className} rounded-lg p-2.5`}>
              <span className={`material-symbols-outlined ${KPI_ICON_STYLE.text} text-xl`}>
                pending
              </span>
            </div>
            <div>
              <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-[#091426] dark:text-white">
                {formatCurrency(stats?.saldoPendiente ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className={`${CARD_CLASSES.full} p-6`}>
          <div className="flex items-center gap-3">
            <div className={`${KPI_ICON_STYLE.className} rounded-lg p-2.5`}>
              <span className={`material-symbols-outlined ${KPI_ICON_STYLE.text} text-xl`}>
                warning
              </span>
            </div>
            <div>
              <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">Facturas Vencidas</p>
              <p className="text-2xl font-bold text-[#091426] dark:text-white">
                {stats?.facturasVencidas ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className={`lg:col-span-2 ${CARD_CLASSES.full} p-6`}>
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
            Facturacion vs Cobranzas
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.mensual ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={CHART_THEME.tooltipStyle}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="facturado"
                  stroke={CHART_THEME.primaryFill}
                  fill={`${CHART_THEME.primaryFill}80`}
                  name="Facturado"
                />
                <Area
                  type="monotone"
                  dataKey="cobrado"
                  stroke={CHART_THEME.secondaryFill}
                  fill={`${CHART_THEME.secondaryFill}80`}
                  name="Cobrado"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className={`${CARD_CLASSES.full} p-6`}>
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
            Estado de Facturas
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.porEstado ?? []}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {(stats?.porEstado ?? []).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_THEME.tooltipStyle} />
                <Legend formatter={(value: string) => ESTADO_LABELS[value] ?? value} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Facturas Table */}
      <div className={`${CARD_CLASSES.full} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white">Facturas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`border-b border-gray-200 dark:border-white/10 ${TABLE_CLASSES.header}`}
              >
                <th className={`text-left py-3 px-4 font-medium ${TABLE_CLASSES.headerText}`}>
                  Numero
                </th>
                <th className={`text-left py-3 px-4 font-medium ${TABLE_CLASSES.headerText}`}>
                  Cliente
                </th>
                <th className={`text-left py-3 px-4 font-medium ${TABLE_CLASSES.headerText}`}>
                  Fecha Emision
                </th>
                <th className={`text-right py-3 px-4 font-medium ${TABLE_CLASSES.headerText}`}>
                  Monto
                </th>
                <th className={`text-left py-3 px-4 font-medium ${TABLE_CLASSES.headerText}`}>
                  Estado
                </th>
                <th className={`text-right py-3 px-4 font-medium ${TABLE_CLASSES.headerText}`}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr
                  key={f.id}
                  className={`border-b border-[#e2e8f0]/50 dark:border-white/5 ${TABLE_CLASSES.rowHover}`}
                >
                  <td className="py-3 px-4 text-[#091426] dark:text-white font-medium font-mono text-xs">
                    {f.numero}
                  </td>
                  <td className="py-3 px-4 text-[#45474c] dark:text-[#c5c6cd]">{f.clienteId}</td>
                  <td className="py-3 px-4 text-[#45474c] dark:text-[#c5c6cd]">
                    {new Date(f.fechaEmision).toLocaleDateString('es-AR')}
                  </td>
                  <td className="py-3 px-4 text-right text-[#091426] dark:text-white font-medium">
                    {formatCurrency(f.total)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[f.estado] ?? ''}`}
                    >
                      {ESTADO_LABELS[f.estado] ?? f.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Ver Detalle"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                        title="Registrar Pago"
                      >
                        <span className="material-symbols-outlined text-lg">payment</span>
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Anular"
                      >
                        <span className="material-symbols-outlined text-lg">block</span>
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Descargar PDF"
                      >
                        <span className="material-symbols-outlined text-lg">download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {facturas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#45474c] dark:text-[#a0a3a8]">
                    No se encontraron facturas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">
            Mostrando {start}-{end} de {meta.total || facturas.length} facturas
          </p>
        </div>
      </div>
    </div>
  );
}
