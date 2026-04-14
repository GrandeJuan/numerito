'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { formatFecha } from '@/lib/formatters';
import { StatusBadge } from '@/components/shared/status-badge';
import { PrioridadBadge } from '@/components/shared/prioridad-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FilterBar, FilterSelect } from '@/components/shared/filter-bar';
import { ESTADO_TAREA_LABELS, PRIORIDAD_LABELS } from '@numerito/shared';

interface TareaRow {
  id: string;
  titulo: string;
  clienteNombre: string | null;
  prioridad: string;
  estado: string;
  responsableNombre: string | null;
  fechaVencimiento: string | null;
  horasRegistradas: number;
}

const ESTADO_COLUMN_COLORS: Record<string, string> = {
  PENDIENTE: 'border-yellow-400',
  EN_PROGRESO: 'border-blue-400',
  COMPLETADO: 'border-emerald-400',
};

const COLUMNS: { key: string; label: string }[] = [
  { key: 'PENDIENTE', label: 'Pendiente' },
  { key: 'EN_PROGRESO', label: 'En Progreso' },
  { key: 'COMPLETADO', label: 'Completada' },
];

function isOverdue(fecha: string | null): boolean {
  if (!fecha) return false;
  return new Date(fecha) < new Date();
}

function TaskCard({ tarea }: { tarea: TareaRow }) {
  const overdue = tarea.estado !== 'COMPLETADO' && isOverdue(tarea.fechaVencimiento);

  return (
    <div
      data-testid={`task-card-${tarea.id}`}
      className="bg-white dark:bg-[#162a4a] rounded-lg border border-[#e2e8f0] dark:border-white/10 p-4 cursor-grab hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-[#091426] dark:text-white leading-tight">
          {tarea.titulo}
        </h4>
        <PrioridadBadge
          prioridad={tarea.prioridad}
          label={
            PRIORIDAD_LABELS[tarea.prioridad as keyof typeof PRIORIDAD_LABELS] ?? tarea.prioridad
          }
        />
      </div>

      {tarea.clienteNombre && (
        <p className="text-xs text-[#45474c] dark:text-[#a0a3a8] mb-2">{tarea.clienteNombre}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {tarea.responsableNombre ? (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                {tarea.responsableNombre.charAt(0)}
              </div>
              <span className="text-[#45474c] dark:text-[#c5c6cd]">
                {tarea.responsableNombre.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 dark:text-[#75777d]">Sin asignar</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {tarea.horasRegistradas > 0 && (
            <span className="text-[#45474c] dark:text-[#a0a3a8]">{tarea.horasRegistradas}h</span>
          )}
          {tarea.fechaVencimiento && (
            <span
              className={
                overdue
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : 'text-[#45474c] dark:text-[#a0a3a8]'
              }
            >
              {formatFecha(tarea.fechaVencimiento)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TareasPage() {
  const { estudioActual } = useAuth();
  const { data: tareas, loading, error } = useFetchWithEstudio<TareaRow[]>('/v1/tareas');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [prioridadFilter, setPrioridadFilter] = useState('');
  const [responsableFilter, setResponsableFilter] = useState('');

  const filtered = useMemo(() => {
    let result = tareas ?? [];
    if (prioridadFilter) {
      result = result.filter((t) => t.prioridad === prioridadFilter);
    }
    if (responsableFilter) {
      result = result.filter((t) => t.responsableNombre === responsableFilter);
    }
    return result;
  }, [tareas, prioridadFilter, responsableFilter]);

  const responsables = useMemo(() => {
    const names = new Set(
      (tareas ?? []).map((t) => t.responsableNombre).filter(Boolean) as string[],
    );
    return Array.from(names).sort();
  }, [tareas]);

  const byEstado = useMemo(() => {
    const map: Record<string, TareaRow[]> = { PENDIENTE: [], EN_PROGRESO: [], COMPLETADO: [] };
    for (const t of filtered) {
      if (map[t.estado]) map[t.estado].push(t);
    }
    return map;
  }, [filtered]);

  const tareaColumns: Column<TareaRow>[] = [
    {
      key: 'titulo',
      header: 'Titulo',
      render: (t) => <span className="text-[#091426] dark:text-white font-medium">{t.titulo}</span>,
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (t) => (
        <span className="text-[#45474c] dark:text-[#c5c6cd]">{t.clienteNombre ?? '-'}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (t) => (
        <StatusBadge
          status={t.estado}
          label={ESTADO_TAREA_LABELS[t.estado as keyof typeof ESTADO_TAREA_LABELS] ?? t.estado}
        />
      ),
    },
    {
      key: 'prioridad',
      header: 'Prioridad',
      render: (t) => (
        <PrioridadBadge
          prioridad={t.prioridad}
          label={PRIORIDAD_LABELS[t.prioridad as keyof typeof PRIORIDAD_LABELS] ?? t.prioridad}
        />
      ),
    },
    {
      key: 'responsable',
      header: 'Responsable',
      render: (t) => (
        <span className="text-[#45474c] dark:text-[#c5c6cd]">
          {t.responsableNombre ?? 'Sin asignar'}
        </span>
      ),
    },
    {
      key: 'vencimiento',
      header: 'Vencimiento',
      render: (t) => {
        const overdue = t.estado !== 'COMPLETADO' && isOverdue(t.fechaVencimiento);
        return (
          <span
            className={
              overdue
                ? 'text-red-600 dark:text-red-400 font-medium'
                : 'text-[#45474c] dark:text-[#c5c6cd]'
            }
          >
            {t.fechaVencimiento ? formatFecha(t.fechaVencimiento) : '-'}
          </span>
        );
      },
    },
    {
      key: 'horas',
      header: 'Horas',
      align: 'right',
      render: (t) => (
        <span className="text-[#45474c] dark:text-[#c5c6cd]">{t.horasRegistradas}h</span>
      ),
    },
  ];

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="task_alt">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Tareas</h1>
            <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">
              Gestion de tareas del estudio.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              aria-label="Vista kanban"
              className={`p-1.5 rounded ${view === 'kanban' ? 'bg-white dark:bg-[#162a4a] shadow-sm' : ''}`}
            >
              <span className="material-symbols-outlined text-lg text-[#45474c] dark:text-[#c5c6cd]">
                view_column
              </span>
            </button>
            <button
              onClick={() => setView('list')}
              aria-label="Vista lista"
              className={`p-1.5 rounded ${view === 'list' ? 'bg-white dark:bg-[#162a4a] shadow-sm' : ''}`}
            >
              <span className="material-symbols-outlined text-lg text-[#45474c] dark:text-[#c5c6cd]">
                view_list
              </span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <FilterBar>
          <FilterSelect
            value={prioridadFilter}
            onChange={setPrioridadFilter}
            placeholder="Todas las prioridades"
            options={[
              { value: 'BAJA', label: 'Baja' },
              { value: 'MEDIA', label: 'Media' },
              { value: 'ALTA', label: 'Alta' },
              { value: 'URGENTE', label: 'Urgente' },
            ]}
          />
          <FilterSelect
            value={responsableFilter}
            onChange={setResponsableFilter}
            placeholder="Todos los responsables"
            options={responsables.map((r) => ({ value: r, label: r }))}
          />
        </FilterBar>

        {/* Kanban View */}
        {view === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <div
                key={col.key}
                className={`bg-[#f0f4f8] dark:bg-[#162a4a]/50 rounded-xl border-t-4 ${ESTADO_COLUMN_COLORS[col.key]} p-4`}
              >
                <div
                  data-testid={`column-${col.key}`}
                  className="flex items-center justify-between mb-4"
                >
                  <h3 className="font-semibold text-[#091426] dark:text-white">{col.label}</h3>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-[#162a4a] text-xs font-medium text-gray-700 dark:text-[#c5c6cd]">
                    {byEstado[col.key]?.length ?? 0}
                  </span>
                </div>
                <div className="space-y-3">
                  {(byEstado[col.key] ?? []).map((t) => (
                    <TaskCard key={t.id} tarea={t} />
                  ))}
                  {(byEstado[col.key] ?? []).length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-[#75777d] text-center py-4">
                      Sin tareas
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <DataTable<TareaRow>
            columns={tareaColumns}
            data={filtered}
            rowKey={(t) => t.id}
            emptyMessage="No se encontraron tareas."
          />
        )}
      </div>
    </PageStateGuard>
  );
}
