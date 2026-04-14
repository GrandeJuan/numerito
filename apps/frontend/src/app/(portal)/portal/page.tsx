'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { formatFecha, formatCurrency } from '@/lib/formatters';
import { CARD_CLASSES } from '@/lib/design-tokens';
import { KpiCard } from '@/components/shared/kpi-card';
import { StatusBadge } from '@/components/shared/status-badge';

interface PortalStats {
  clienteNombre: string;
  kpis: {
    vencimientosPendientes: number;
    facturasPendientes: number;
    documentos: number;
  };
  vencimientosRecientes: { id: string; obligacion: string; fecha: string; estado: string }[];
  facturasRecientes: { id: string; numero: string; monto: number; estado: string; fecha: string }[];
  documentosRecientes: { id: string; nombre: string; tipo: string; fecha: string }[];
}

const DOC_ICONS: Record<string, string> = {
  PDF: 'picture_as_pdf',
  imagen: 'image',
  planilla: 'table_chart',
};

export default function PortalPage() {
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/v1/portal/dashboard/stats')
      .then((res) => parseApiResponse<PortalStats>(res))
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-[#a0a3a8]">Cargando...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error ?? 'Error al cargar datos'}</p>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Vencimientos Pendientes',
      value: stats.kpis.vencimientosPendientes,
      icon: 'schedule',
    },
    {
      label: 'Facturas Pendientes',
      value: stats.kpis.facturasPendientes,
      icon: 'receipt_long',
    },
    {
      label: 'Documentos',
      value: stats.kpis.documentos,
      icon: 'folder',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#091426] to-[#0f2847] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Bienvenido, {stats.clienteNombre}</h1>
        <p className="mt-1 text-white/70">
          Acceda a sus documentos, obligaciones y estado de cuenta.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} />
        ))}
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proximos Vencimientos */}
        <div className={`${CARD_CLASSES.full} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white">
              Proximos Vencimientos
            </h2>
            <Link href="/portal/obligaciones" className="text-sm text-[#4edea3] hover:underline">
              Ver todos
            </Link>
          </div>
          {stats.vencimientosRecientes.length === 0 ? (
            <p className="text-[#45474c] dark:text-[#a0a3a8] text-sm">Sin vencimientos proximos.</p>
          ) : (
            <ul className="space-y-3">
              {stats.vencimientosRecientes.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between py-2 border-b border-[#e2e8f0]/50 dark:border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#091426] dark:text-white">
                      {v.obligacion}
                    </p>
                    <p className="text-xs text-[#45474c] dark:text-[#a0a3a8]">
                      {formatFecha(v.fecha)}
                    </p>
                  </div>
                  <StatusBadge status={v.estado} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ultimas Facturas */}
        <div className={`${CARD_CLASSES.full} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white">
              Ultimas Facturas
            </h2>
            <Link href="/portal/obligaciones" className="text-sm text-[#4edea3] hover:underline">
              Ver todos
            </Link>
          </div>
          {stats.facturasRecientes.length === 0 ? (
            <p className="text-[#45474c] dark:text-[#a0a3a8] text-sm">Sin facturas recientes.</p>
          ) : (
            <ul className="space-y-3">
              {stats.facturasRecientes.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between py-2 border-b border-[#e2e8f0]/50 dark:border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#091426] dark:text-white">{f.numero}</p>
                    <p className="text-xs text-[#45474c] dark:text-[#a0a3a8]">
                      {formatFecha(f.fecha)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#091426] dark:text-white">
                      {formatCurrency(f.monto)}
                    </p>
                    <StatusBadge status={f.estado} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Documentos Recientes */}
      <div className={`${CARD_CLASSES.full} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#091426] dark:text-white">
            Documentos Recientes
          </h2>
          <Link href="/portal/documentos" className="text-sm text-[#4edea3] hover:underline">
            Ver todos
          </Link>
        </div>
        {stats.documentosRecientes.length === 0 ? (
          <p className="text-[#45474c] dark:text-[#a0a3a8] text-sm">Sin documentos recientes.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.documentosRecientes.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-[#4edea3]/5 transition-colors"
              >
                <div className="bg-[#f0f4f8] dark:bg-[#162a4a] rounded-lg p-2">
                  <span className="material-symbols-outlined text-gray-600 dark:text-[#c5c6cd]">
                    {DOC_ICONS[d.tipo] ?? 'description'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#091426] dark:text-white truncate">
                    {d.nombre}
                  </p>
                  <p className="text-xs text-[#45474c] dark:text-[#a0a3a8]">
                    {formatFecha(d.fecha)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
