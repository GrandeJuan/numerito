'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { formatCurrency } from '@/lib/formatters';
import { CARD_CLASSES, KPI_ICON_STYLE, CHART_THEME } from '@/lib/design-tokens';
import { KpiCard } from '@/components/shared/kpi-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ESTADO_FACTURA_LABELS } from '@numerito/shared';
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

const PIE_COLORS = ['#4edea3', '#091426', '#00a472', '#ef4444', '#6b7280'];

export default function FacturacionPage() {
  const { estudioActual, tienePermiso } = useAuth();
  const [meta] = useState({ total: 0, page: 1, limit: 20 });

  const {
    data: stats,
    loading: loadingStats,
    error: errorStats,
  } = useFetchWithEstudio<FacturacionStats>('/v1/facturacion/stats');
  const {
    data: facturasData,
    loading: loadingFacturas,
    error: errorFacturas,
  } = useFetchWithEstudio<FacturaRow[]>(
    `/v1/facturacion/facturas?page=${meta.page}&limit=${meta.limit}`,
  );

  const loading = loadingStats || loadingFacturas;
  const error = errorStats || errorFacturas;
  const facturas = facturasData ?? [];

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

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total || facturas.length);

  const facturaColumns: Column<FacturaRow>[] = [
    {
      key: 'numero',
      header: 'Numero',
      render: (f) => (
        <span className="text-[#091426] dark:text-white font-medium font-mono text-xs">
          {f.numero}
        </span>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (f) => <span className="text-[#45474c] dark:text-[#c5c6cd]">{f.clienteId}</span>,
    },
    {
      key: 'fechaEmision',
      header: 'Fecha Emision',
      render: (f) => (
        <span className="text-[#45474c] dark:text-[#c5c6cd]">
          {new Date(f.fechaEmision).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      render: (f) => (
        <span className="text-[#091426] dark:text-white font-medium">
          {formatCurrency(f.total)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (f) => (
        <StatusBadge
          status={f.estado}
          label={ESTADO_FACTURA_LABELS[f.estado as keyof typeof ESTADO_FACTURA_LABELS] ?? f.estado}
        />
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: () => (
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
      ),
    },
  ];

  return (
    <PageStateGuard
      estudioActual={estudioActual}
      loading={loading}
      error={error}
      icon="receipt_long"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Facturacion</h1>
          <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
            Gestion de facturacion y cobranzas del estudio.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon="payments"
            label="Facturado"
            value={formatCurrency(stats?.facturado ?? 0)}
          />

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

          <KpiCard
            icon="pending"
            label="Saldo Pendiente"
            value={formatCurrency(stats?.saldoPendiente ?? 0)}
          />
          <KpiCard icon="warning" label="Facturas Vencidas" value={stats?.facturasVencidas ?? 0} />
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
                  <Legend
                    formatter={(value: string) =>
                      ESTADO_FACTURA_LABELS[value as keyof typeof ESTADO_FACTURA_LABELS] ?? value
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Facturas Table */}
        <div>
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white">Facturas</h2>
          </div>
          <DataTable<FacturaRow>
            columns={facturaColumns}
            data={facturas}
            rowKey={(f) => f.id}
            emptyMessage="No se encontraron facturas."
            footer={
              <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">
                Mostrando {start}-{end} de {meta.total || facturas.length} facturas
              </p>
            }
          />
        </div>
      </div>
    </PageStateGuard>
  );
}
