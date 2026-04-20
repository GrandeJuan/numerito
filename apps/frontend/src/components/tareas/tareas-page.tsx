'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Tarea } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';
import { PageStateGuard } from '@/components/shared/page-state-guard';

import { PageHeader } from '../page-header';
import { SegmentedControl } from '../segmented-control';
import { Button } from '../button';
import { Icons } from '../icons';

import { TareasKpis } from './tareas-kpis';
import { TareasKanban } from './tareas-kanban';
import { TareasList } from './tareas-list';

type View = 'kanban' | 'list';
const STORAGE = 'tareas:view';

const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'] as const;

export function TareasPage() {
  const { estudioActual } = useAuth();
  const { data, loading, error, refetch } = useFetchWithEstudio<Tarea[]>('/v1/tareas');
  const items = data ?? [];

  const [view, setView] = useState<View>('kanban');
  const [showNueva, setShowNueva] = useState(false);
  const [nuevaEstado, setNuevaEstado] = useState<Tarea['estado'] | null>(null);
  const [filtroPrioridad, setFiltroPrioridad] = useState<string | null>(null);
  const [filtroResponsable, setFiltroResponsable] = useState<string | null>(null);
  const [filtroCliente, setFiltroCliente] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE) as View | null;
    if (saved === 'kanban' || saved === 'list') setView(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE, view);
  }, [view]);

  const responsables = useMemo(
    () => [...new Set(items.map((t) => t.responsable).filter(Boolean) as string[])].sort(),
    [items],
  );
  const clientesList = useMemo(
    () => [...new Set(items.map((t) => t.cliente).filter(Boolean) as string[])].sort(),
    [items],
  );

  const filtered = useMemo(() => {
    let result = items;
    if (filtroPrioridad) result = result.filter((t) => t.prioridad === filtroPrioridad);
    if (filtroResponsable) result = result.filter((t) => t.responsable === filtroResponsable);
    if (filtroCliente) result = result.filter((t) => t.cliente === filtroCliente);
    return result;
  }, [items, filtroPrioridad, filtroResponsable, filtroCliente]);

  const handleAdd = useCallback(
    (estado: Tarea['estado']) => {
      setNuevaEstado(estado);
      setShowNueva(true);
    },
    [],
  );

  const handleNuevaClick = useCallback(() => {
    setNuevaEstado(null);
    setShowNueva(true);
  }, []);

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="check">
      <PageHeader
        title="Tareas"
        subtitle="Gestión del equipo del estudio"
        actions={
          <>
            <SegmentedControl<View>
              value={view}
              onChange={setView}
              options={[
                { value: 'kanban', label: 'Kanban' },
                { value: 'list', label: 'Lista' },
              ]}
            />
            <Button variant="brand" icon={Icons.plus} onClick={handleNuevaClick}>
              Nueva tarea
            </Button>
          </>
        }
      />

      <TareasKpis items={items} />

      <div className="flex gap-2 mb-3.5 flex-wrap">
        <FilterButton
          label="Prioridad"
          value={filtroPrioridad}
          options={PRIORIDADES as unknown as string[]}
          onChange={setFiltroPrioridad}
        />
        <FilterButton
          label="Responsable"
          value={filtroResponsable}
          options={responsables}
          onChange={setFiltroResponsable}
        />
        <FilterButton
          label="Cliente"
          value={filtroCliente}
          options={clientesList}
          onChange={setFiltroCliente}
        />
      </div>

      {view === 'kanban' ? (
        <TareasKanban items={filtered} onAdd={handleAdd} />
      ) : (
        <TareasList rows={filtered} />
      )}

      {showNueva && (
        <NuevaTareaModal
          defaultEstado={nuevaEstado}
          onClose={() => setShowNueva(false)}
          onSuccess={() => {
            setShowNueva(false);
            refetch();
          }}
        />
      )}
    </PageStateGuard>
  );
}

function FilterButton({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="ghost" icon={Icons.filter} onClick={() => setOpen(!open)}>
        {label}{' '}
        <span className="text-[var(--text-3)] ml-0.5">
          {value ?? (label === 'Prioridad' ? 'Todas' : 'Todos')}
        </span>
      </Button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-md z-30 min-w-[160px] py-1">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-[12.5px] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {label === 'Prioridad' ? 'Todas' : 'Todos'}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[12.5px] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              style={{ fontWeight: opt === value ? 600 : 400 }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NuevaTareaModal({
  defaultEstado,
  onClose,
  onSuccess,
}: {
  defaultEstado: Tarea['estado'] | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [prioridad, setPrioridad] = useState<string>('MEDIA');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await apiFetch('/v1/tareas', {
        method: 'POST',
        body: JSON.stringify({
          titulo,
          prioridad,
          descripcion: descripcion || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${res.status}`);
      }
      onSuccess();
    } catch (err: any) {
      setFormError(err.message ?? 'Error al crear tarea');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full h-9 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 text-[13px] text-[var(--text)] outline-none focus:border-[var(--brand)] transition-colors';
  const labelClass = 'block text-[12px] font-medium text-[var(--text-2)] mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-lg p-6">
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-1">Nueva tarea</h2>
        <p className="text-[12px] text-[var(--text-3)] mb-5">
          Crear una nueva tarea para el equipo.
          {defaultEstado ? ` Se creará como ${defaultEstado.replace('_', ' ').toLowerCase()}.` : ''}
        </p>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tarea-titulo" className={labelClass}>Título</label>
            <input id="tarea-titulo" type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputClass} placeholder="Liquidar IIBB cliente X" />
          </div>

          <div>
            <label htmlFor="tarea-prioridad" className={labelClass}>Prioridad</label>
            <select id="tarea-prioridad" required value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className={inputClass}>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          <div>
            <label htmlFor="tarea-desc" className={labelClass}>Descripción (opcional)</label>
            <textarea id="tarea-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClass + ' h-20 py-2 resize-none'} placeholder="Detalles adicionales…" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creando…' : 'Crear tarea'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
