'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { formatCurrency } from '@/lib/formatters';
import { CARD_CLASSES, TABLE_CLASSES, KPI_ICON_STYLE } from '@/lib/design-tokens';

interface ClienteRow {
  id: string;
  razonSocial: string;
  cuit: string;
  tipo: string;
  condicionIva: string;
  responsable: { id: string; nombre: string } | null;
  vencimientosPendientes: number;
  vencimientosVencidos: number;
  saldoPendiente: number;
  isActive: boolean;
}

interface ClientesSummary {
  total: number;
  porCondicionIva: Record<string, number>;
}

const CONDICION_IVA_LABELS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTO: 'Monotributista',
  EXENTO: 'Exento',
  NO_RESPONSABLE: 'No Responsable',
  CONSUMIDOR_FINAL: 'Consumidor Final',
};

const TIPO_LABELS: Record<string, string> = {
  PERSONA_FISICA: 'Persona Fisica',
  PERSONA_JURIDICA: 'Persona Juridica',
  SOCIEDAD: 'Sociedad',
};

export default function ClientesPage() {
  const { estudioActual } = useAuth();
  const {
    data: clientes,
    loading: loadingClientes,
    error: errorClientes,
  } = useFetchWithEstudio<ClienteRow[]>('/v1/clientes');
  const { data: summary } = useFetchWithEstudio<ClientesSummary>('/v1/clientes/summary');

  // Filters
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [condicionIvaFilter, setCondicionIvaFilter] = useState('');

  const filtered = useMemo(() => {
    let result = clientes ?? [];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.razonSocial.toLowerCase().includes(q) || c.cuit.includes(q));
    }
    if (tipoFilter) {
      result = result.filter((c) => c.tipo === tipoFilter);
    }
    if (condicionIvaFilter) {
      result = result.filter((c) => c.condicionIva === condicionIvaFilter);
    }
    return result;
  }, [clientes, search, tipoFilter, condicionIvaFilter]);

  return (
    <PageStateGuard
      estudioActual={estudioActual}
      loading={loadingClientes}
      error={errorClientes}
      icon="group"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Clientes</h1>
          <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
            Gestion de clientes del estudio.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${CARD_CLASSES.full} p-6`}>
            <div className="flex items-center gap-3">
              <div className={`${KPI_ICON_STYLE.className} rounded-lg p-2.5`}>
                <span className={`material-symbols-outlined ${KPI_ICON_STYLE.text} text-xl`}>
                  group
                </span>
              </div>
              <div>
                <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">Total Clientes</p>
                <p className="text-2xl font-bold text-[#091426] dark:text-white">
                  {summary?.total ?? clientes?.length ?? 0}
                </p>
              </div>
            </div>
          </div>
          {summary?.porCondicionIva &&
            Object.entries(summary.porCondicionIva)
              .slice(0, 3)
              .map(([key, count]) => (
                <div key={key} className={`${CARD_CLASSES.full} p-6`}>
                  <div className="flex items-center gap-3">
                    <div className={`${KPI_ICON_STYLE.className} rounded-lg p-2.5`}>
                      <span className={`material-symbols-outlined ${KPI_ICON_STYLE.text} text-xl`}>
                        badge
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">
                        {CONDICION_IVA_LABELS[key] ?? key}
                      </p>
                      <p className="text-2xl font-bold text-[#091426] dark:text-white">{count}</p>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Filter Bar */}
        <div className={`${CARD_CLASSES.full} p-4`}>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Buscar por razon social o CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-[#e2e8f0] dark:border-white/10 rounded-lg bg-white dark:bg-[#162a4a] text-[#091426] dark:text-white placeholder-gray-400 dark:placeholder-[#75777d] focus:ring-2 focus:ring-[#00a472] focus:border-transparent"
            />
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[#e2e8f0] dark:border-white/10 rounded-lg bg-white dark:bg-[#162a4a] text-[#091426] dark:text-white"
            >
              <option value="">Todos los tipos</option>
              <option value="PERSONA_FISICA">Persona Fisica</option>
              <option value="PERSONA_JURIDICA">Persona Juridica</option>
              <option value="SOCIEDAD">Sociedad</option>
            </select>
            <select
              value={condicionIvaFilter}
              onChange={(e) => setCondicionIvaFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[#e2e8f0] dark:border-white/10 rounded-lg bg-white dark:bg-[#162a4a] text-[#091426] dark:text-white"
            >
              <option value="">Todas las condiciones</option>
              <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
              <option value="MONOTRIBUTO">Monotributista</option>
              <option value="EXENTO">Exento</option>
              <option value="NO_RESPONSABLE">No Responsable</option>
              <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className={`${CARD_CLASSES.full} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={`border-b border-gray-200 dark:border-white/10 ${TABLE_CLASSES.header}`}
                >
                  <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>
                    Razon Social
                  </th>
                  <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>CUIT</th>
                  <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>Tipo</th>
                  <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>
                    Condicion IVA
                  </th>
                  <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>Responsable</th>
                  <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>
                    Vencimientos
                  </th>
                  <th className={`text-right py-3 px-4 ${TABLE_CLASSES.headerText}`}>Saldo</th>
                  <th className={`text-right py-3 px-4 ${TABLE_CLASSES.headerText}`}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-[#e2e8f0]/50 dark:border-white/5 ${TABLE_CLASSES.rowHover}`}
                  >
                    <td className="py-3 px-4 text-[#091426] dark:text-white font-medium">
                      {c.razonSocial}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-[#c5c6cd] font-mono text-xs">
                      {c.cuit}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {TIPO_LABELS[c.tipo] ?? c.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {CONDICION_IVA_LABELS[c.condicionIva] ?? c.condicionIva}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.responsable ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {c.responsable.nombre.charAt(0)}
                          </div>
                          <span className="text-[#091426] dark:text-white text-sm">
                            {c.responsable.nombre}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-[#75777d] text-sm">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        {c.vencimientosPendientes > 0 && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            {c.vencimientosPendientes} pendientes
                          </span>
                        )}
                        {c.vencimientosVencidos > 0 && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {c.vencimientosVencidos} vencidos
                          </span>
                        )}
                        {c.vencimientosPendientes === 0 && c.vencimientosVencidos === 0 && (
                          <span className="text-xs text-gray-400 dark:text-[#75777d]">Al dia</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-[#091426] dark:text-white font-medium">
                      {c.saldoPendiente > 0 ? formatCurrency(c.saldoPendiente) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#45474c] dark:text-[#a0a3a8]">
                      No se encontraron clientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
            <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">{filtered.length} clientes</p>
          </div>
        </div>
      </div>
    </PageStateGuard>
  );
}
