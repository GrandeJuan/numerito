'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

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

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En Progreso',
  COMPLETADO: 'Completada',
};

const PRIORIDAD_LABELS: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  MEDIA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ALTA: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  URGENTE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

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

function formatFecha(fecha: string): string {
  try {
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  } catch {
    return fecha;
  }
}

function TaskCard({ tarea }: { tarea: TareaRow }) {
  const overdue = tarea.estado !== 'COMPLETADO' && isOverdue(tarea.fechaVencimiento);

  return (
    <div
      data-testid={`task-card-${tarea.id}`}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-grab hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
          {tarea.titulo}
        </h4>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${PRIORIDAD_COLORS[tarea.prioridad] ?? ''}`}>
          {PRIORIDAD_LABELS[tarea.prioridad] ?? tarea.prioridad}
        </span>
      </div>

      {tarea.clienteNombre && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{tarea.clienteNombre}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {tarea.responsableNombre ? (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                {tarea.responsableNombre.charAt(0)}
              </div>
              <span className="text-gray-600 dark:text-gray-300">{tarea.responsableNombre.split(' ')[0]}</span>
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">Sin asignar</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {tarea.horasRegistradas > 0 && (
            <span className="text-gray-500 dark:text-gray-400">
              {tarea.horasRegistradas}h
            </span>
          )}
          {tarea.fechaVencimiento && (
            <span className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
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
  const [tareas, setTareas] = useState<TareaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [prioridadFilter, setPrioridadFilter] = useState('');
  const [responsableFilter, setResponsableFilter] = useState('');

  useEffect(() => {
    if (!estudioActual) {
      setLoading(false);
      return;
    }

    apiFetch('/v1/tareas')
      .then(async (res) => {
        if (!res.ok) throw new Error('Error al cargar tareas');
        const body = await res.json();
        setTareas(body.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [estudioActual]);

  const filtered = useMemo(() => {
    let result = tareas;
    if (prioridadFilter) {
      result = result.filter((t) => t.prioridad === prioridadFilter);
    }
    if (responsableFilter) {
      result = result.filter((t) => t.responsableNombre === responsableFilter);
    }
    return result;
  }, [tareas, prioridadFilter, responsableFilter]);

  const responsables = useMemo(() => {
    const names = new Set(tareas.map((t) => t.responsableNombre).filter(Boolean) as string[]);
    return Array.from(names).sort();
  }, [tareas]);

  const byEstado = useMemo(() => {
    const map: Record<string, TareaRow[]> = { PENDIENTE: [], EN_PROGRESO: [], COMPLETADO: [] };
    for (const t of filtered) {
      if (map[t.estado]) map[t.estado].push(t);
    }
    return map;
  }, [filtered]);

  if (!estudioActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">task_alt</span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Seleccione un estudio para ver las tareas.</p>
        </div>
      </div>
    );
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tareas</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Gestion de tareas del estudio.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setView('kanban')}
            aria-label="Vista kanban"
            className={`p-1.5 rounded ${view === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
          >
            <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-300">view_column</span>
          </button>
          <button
            onClick={() => setView('list')}
            aria-label="Vista lista"
            className={`p-1.5 rounded ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
          >
            <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-300">view_list</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={prioridadFilter}
            onChange={(e) => setPrioridadFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todas las prioridades</option>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
          <select
            value={responsableFilter}
            onChange={(e) => setResponsableFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los responsables</option>
            {responsables.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl border-t-4 ${ESTADO_COLUMN_COLORS[col.key]} p-4`}>
              <div data-testid={`column-${col.key}`} className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{col.label}</h3>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                  {byEstado[col.key]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-3">
                {(byEstado[col.key] ?? []).map((t) => (
                  <TaskCard key={t.id} tarea={t} />
                ))}
                {(byEstado[col.key] ?? []).length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Sin tareas</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Titulo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Prioridad</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Responsable</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Vencimiento</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Horas</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const overdue = t.estado !== 'COMPLETADO' && isOverdue(t.fechaVencimiento);
                  return (
                    <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{t.titulo}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{t.clienteNombre ?? '-'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {ESTADO_LABELS[t.estado] ?? t.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORIDAD_COLORS[t.prioridad] ?? ''}`}>
                          {PRIORIDAD_LABELS[t.prioridad] ?? t.prioridad}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{t.responsableNombre ?? 'Sin asignar'}</td>
                      <td className={`py-3 px-4 ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                        {t.fechaVencimiento ? formatFecha(t.fechaVencimiento) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{t.horasRegistradas}h</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron tareas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
