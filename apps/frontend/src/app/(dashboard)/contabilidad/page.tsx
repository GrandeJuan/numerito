'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
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

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-AR')}`;
}

export default function ContabilidadPage() {
  const { estudioActual, tienePermiso } = useAuth();
  const [stats, setStats] = useState<ContabilidadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!estudioActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">menu_book</span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando estudio...</p>
        </div>
      </div>
    );
  }

  if (!tienePermiso('VER_CONTABILIDAD')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-red-400">lock</span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">No tiene permisos para acceder a esta seccion.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await apiFetch('/v1/contabilidad/stats');
        if (!res.ok) throw new Error('Error al cargar contabilidad');

        const body = await res.json();
        setStats(body.data);
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
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contabilidad</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Libros contables, asientos y balance del estudio.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2.5">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">edit_note</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Asientos del Periodo</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.asientosDelPeriodo ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-2.5">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl">verified</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Libros Rubricados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.librosRubricados ?? 0} / {stats?.totalLibros ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2.5 ${stats?.balanceCuadrado ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
              <span className={`material-symbols-outlined text-xl ${stats?.balanceCuadrado ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats?.balanceCuadrado ? 'check_circle' : 'error'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
              <p className={`text-2xl font-bold ${stats?.balanceCuadrado ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats?.balanceCuadrado ? 'Cuadrado' : 'Descuadrado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Libros + Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Libros Contables */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Libros Contables</h2>
          <div className="space-y-3">
            {(stats?.libros ?? []).map((libro) => (
              <div
                key={libro.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">
                    {TIPO_LIBRO_ICONS[libro.tipo] ?? 'menu_book'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {TIPO_LIBRO_LABELS[libro.tipo] ?? libro.tipo}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{libro.periodo}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    libro.isRubricado
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}
                >
                  {libro.isRubricado ? 'Rubricado' : 'Pendiente'}
                </span>
              </div>
            ))}
            {(stats?.libros ?? []).length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin libros registrados.</p>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Debe vs Haber por Mes</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.mensualDebeHaber ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="debe" fill="#3b82f6" name="Debe" />
                <Bar dataKey="haber" fill="#10b981" name="Haber" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Asientos Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Asientos Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Descripcion</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Debe</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Haber</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.asientosRecientes ?? []).map((a) => (
                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{new Date(a.fecha).toLocaleDateString('es-AR')}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{a.descripcion}</td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-medium">{formatCurrency(a.totalDebe)}</td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-medium">{formatCurrency(a.totalHaber)}</td>
                </tr>
              ))}
              {(stats?.asientosRecientes ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay asientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
