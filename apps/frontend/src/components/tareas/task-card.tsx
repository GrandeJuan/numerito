'use client';

import { Pill, type PillTone } from '../pill';
import { Icons } from '../icons';
import type { Tarea } from '@numerito/shared';
import { formatFecha } from '@/lib/formatters';

const PRIO: Record<string, { tone: PillTone; label: string }> = {
  URGENTE: { tone: 'rose', label: 'Urgente' },
  ALTA: { tone: 'amber', label: 'Alta' },
  MEDIA: { tone: 'indigo', label: 'Media' },
  BAJA: { tone: 'neutral', label: 'Baja' },
};

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

export interface TaskCardProps {
  task: Tarea;
  onClick?(t: Tarea): void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = task.estado !== 'COMPLETADO' && !!task.fecha && task.fecha < today;
  const prio = PRIO[task.prioridad] ?? { tone: 'neutral' as const, label: task.prioridad };

  return (
    <div
      onClick={() => onClick?.(task)}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 cursor-grab shadow-[var(--shadow-sm)] transition hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-[12.5px] font-medium text-[var(--text)] leading-[1.3]">
          {task.titulo}
        </div>
        <Pill tone={prio.tone} dot>
          {prio.label}
        </Pill>
      </div>
      <div className="text-[11px] text-[var(--text-3)] mb-2.5">{task.cliente}</div>
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-[18px] h-[18px] rounded-full bg-[var(--brand-soft)] text-[var(--brand-ink)] flex items-center justify-center text-[9px] font-semibold">
            {initials(task.responsable ?? '')}
          </div>
          <span className="text-[var(--text-2)]">{(task.responsable ?? '').split(' ')[0]}</span>
        </div>
        <div
          className="flex items-center gap-2"
          style={{ color: overdue ? 'var(--rose)' : 'var(--text-3)' }}
        >
          {(task.horas ?? 0) > 0 && <span className="font-mono">{task.horas}h</span>}
          {task.fecha && (
            <span className="font-mono inline-flex items-center gap-[3px]">
              {Icons.clock}
              {formatFecha(task.fecha).slice(0, 5)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
