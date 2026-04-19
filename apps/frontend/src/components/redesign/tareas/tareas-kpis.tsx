'use client';

import { KpiCard } from '../kpi-card';
import type { Tarea } from '@numerito/shared';

export function TareasKpis({ items }: { items: Tarea[] }) {
  const pend = items.filter((t) => t.estado === 'PENDIENTE').length;
  const prog = items.filter((t) => t.estado === 'EN_PROGRESO').length;
  const done = items.filter((t) => t.estado === 'COMPLETADO').length;
  const horas = items.reduce((s, t) => s + (t.horas ?? 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <KpiCard label="Pendientes" value={pend} />
      <KpiCard
        label="En progreso"
        value={prog}
        delta={prog > 0 ? { tone: 'indigo', text: 'Activo' } : undefined}
      />
      <KpiCard
        label="Completadas mes"
        value={done}
        delta={done > 0 ? { tone: 'brand', text: '▲' } : undefined}
      />
      <KpiCard
        label="Horas registradas"
        value={`${horas.toFixed(1)}h`}
        delta={{ tone: 'neutral', text: 'esta semana' }}
      />
    </div>
  );
}
