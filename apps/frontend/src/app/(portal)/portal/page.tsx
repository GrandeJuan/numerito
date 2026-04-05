'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

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

function formatFecha(fecha: string): string {
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return fecha;
  }
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-AR')}`;
}

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Cumplido: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Vencido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Pagada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const DOC_ICONS: Record<string, string> = {
  PDF: 'picture_as_pdf',
  imagen: 'image',
  planilla: 'table_chart',
};

export default function PortalPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/v1/portal/dashboard/stats')
      .then(async (res) => {
        if (!res.ok) throw new Error('Error al cargar estadisticas del portal');
        const body = await res.json();
        setStats(body.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
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
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
    },
    {
      label: 'Facturas Pendientes',
      value: stats.kpis.facturasPendientes,
      icon: 'receipt_long',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label: 'Documentos',
      value: stats.kpis.documentos,
      icon: 'folder',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#091426] to-[#0f2847] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Bienvenido, {stats.clienteNombre}
        </h1>
        <p className="mt-1 text-white/70">
          Acceda a sus documentos, obligaciones y estado de cuenta.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center gap-3">
              <div className={`${kpi.bg} rounded-lg p-2.5`}>
                <span className={`material-symbols-outlined ${kpi.color} text-xl`}>{kpi.icon}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proximos Vencimientos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Proximos Vencimientos</h2>
            <Link href="/portal/obligaciones" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
              Ver todos
            </Link>
          </div>
          {stats.vencimientosRecientes.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sin vencimientos proximos.</p>
          ) : (
            <ul className="space-y-3">
              {stats.vencimientosRecientes.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{v.obligacion}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFecha(v.fecha)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[v.estado] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {v.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ultimas Facturas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ultimas Facturas</h2>
            <Link href="/portal/obligaciones" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
              Ver todos
            </Link>
          </div>
          {stats.facturasRecientes.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sin facturas recientes.</p>
          ) : (
            <ul className="space-y-3">
              {stats.facturasRecientes.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{f.numero}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFecha(f.fecha)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(f.monto)}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[f.estado] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {f.estado}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Documentos Recientes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Documentos Recientes</h2>
          <Link href="/portal/documentos" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
            Ver todos
          </Link>
        </div>
        {stats.documentosRecientes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sin documentos recientes.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.documentosRecientes.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                    {DOC_ICONS[d.tipo] ?? 'description'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{d.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFecha(d.fecha)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
