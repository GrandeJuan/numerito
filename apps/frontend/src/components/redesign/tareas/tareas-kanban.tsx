'use client';

import { IconButton } from '../icon-button';
import { Icons } from '../icons';
import type { Tarea } from '@numerito/shared';
import { TaskCard } from './task-card';

const COLS: { key: Tarea['estado']; label: string; color: string }[] = [
  { key: 'PENDIENTE', label: 'Pendiente', color: 'var(--amber)' },
  { key: 'EN_PROGRESO', label: 'En Progreso', color: 'var(--indigo)' },
  { key: 'COMPLETADO', label: 'Completada', color: 'var(--brand)' },
];

export interface TareasKanbanProps {
  items: Tarea[];
  onTaskClick?(t: Tarea): void;
  onAdd?(estado: Tarea['estado']): void;
}

export function TareasKanban({ items, onTaskClick, onAdd }: TareasKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {COLS.map((col) => {
        const rows = items.filter((t) => t.estado === col.key);
        return (
          <div
            key={col.key}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[12px] p-3 min-h-[300px]"
          >
            <div
              className="flex items-center justify-between mb-3 pb-2.5"
              style={{ borderBottom: `2px solid ${col.color}` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: col.color }}
                />
                <span className="text-[12.5px] font-semibold text-[var(--text)]">
                  {col.label}
                </span>
                <span className="font-mono text-[11px] text-[var(--text-3)] bg-[var(--surface)] px-[7px] py-px rounded-[10px] border border-[var(--border)]">
                  {rows.length}
                </span>
              </div>
              <IconButton size={24} label="Agregar" onClick={() => onAdd?.(col.key)}>
                {Icons.plus}
              </IconButton>
            </div>
            <div className="flex flex-col gap-2">
              {rows.map((t) => (
                <TaskCard key={t.id} task={t} onClick={onTaskClick} />
              ))}
              {rows.length === 0 && (
                <div className="text-[11.5px] text-[var(--text-4)] text-center py-6">
                  Sin tareas
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
