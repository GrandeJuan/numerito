'use client';

import { DataTable } from '../data-table';
import { Pill, type PillTone } from '../pill';
import type { Tarea } from '@numerito/shared';
import { formatFecha } from '@/lib/formatters';

const PRIO: Record<string, { tone: PillTone; label: string }> = {
  URGENTE: { tone: 'rose', label: 'Urgente' },
  ALTA: { tone: 'amber', label: 'Alta' },
  MEDIA: { tone: 'indigo', label: 'Media' },
  BAJA: { tone: 'neutral', label: 'Baja' },
};

const ESTADO: Record<string, { tone: PillTone; label: string }> = {
  PENDIENTE: { tone: 'amber', label: 'Pendiente' },
  EN_PROGRESO: { tone: 'indigo', label: 'En progreso' },
  COMPLETADO: { tone: 'brand', label: 'Completada' },
};

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

export interface TareasListProps {
  rows: Tarea[];
  onRowClick?(t: Tarea): void;
}

export function TareasList({ rows, onRowClick }: TareasListProps) {
  return (
    <DataTable<Tarea>
      rows={rows}
      onRowClick={onRowClick}
      columns={[
        {
          header: 'Título',
          render: (t) => <span className="text-[var(--text)] font-medium">{t.titulo}</span>,
        },
        {
          header: 'Cliente',
          render: (t) => <span className="text-[var(--text-2)]">{t.cliente}</span>,
        },
        {
          header: 'Prioridad',
          render: (t) => {
            const p = PRIO[t.prioridad] ?? { tone: 'neutral' as const, label: t.prioridad };
            return (
              <Pill tone={p.tone} dot>
                {p.label}
              </Pill>
            );
          },
        },
        {
          header: 'Estado',
          render: (t) => {
            const e = ESTADO[t.estado] ?? { tone: 'neutral' as const, label: t.estado };
            return (
              <Pill tone={e.tone} dot>
                {e.label}
              </Pill>
            );
          },
        },
        {
          header: 'Responsable',
          render: (t) => (
            <div className="flex items-center gap-1.5">
              <div className="w-[22px] h-[22px] rounded-full bg-[var(--brand-soft)] text-[var(--brand-ink)] flex items-center justify-center text-[10px] font-semibold">
                {initials(t.responsable)}
              </div>
              <span className="text-[12px] text-[var(--text)]">{t.responsable}</span>
            </div>
          ),
        },
        {
          header: 'Vencimiento',
          render: (t) => (
            <span className="font-mono text-[11.5px] text-[var(--text-2)]">
              {formatFecha(t.fecha)}
            </span>
          ),
        },
        {
          header: 'Horas',
          align: 'right',
          render: (t) => (
            <span className="font-mono text-[12px] text-[var(--text-2)]">{t.horas}h</span>
          ),
        },
      ]}
    />
  );
}
