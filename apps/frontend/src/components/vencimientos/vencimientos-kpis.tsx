'use client';

import { KpiCard } from '../kpi-card';
import type { Obligacion } from '@numerito/shared';
import { formatFecha } from '@/lib/formatters';

export function VencimientosKpis({ items }: { items: Obligacion[] }) {
  const pend = items.filter((o) => o.estado === 'PENDIENTE').length;
  const venc = items.filter((o) => o.estado === 'VENCIDO').length;
  const pres = items.filter((o) => o.estado === 'PRESENTADO').length;

  const upcoming = items
    .filter((o) => o.estado === 'PENDIENTE')
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <KpiCard label="Pendientes" value={pend} delta={{ tone: 'amber', text: '7 días' }} />
      <KpiCard
        label="Vencidos"
        value={venc}
        delta={venc > 0 ? { tone: 'rose', text: 'Acción' } : undefined}
      />
      <KpiCard label="Presentados mes" value={pres} delta={{ tone: 'brand', text: '▲ 8%' }} />
      <KpiCard
        label="Próximo"
        value={upcoming ? formatFecha(upcoming.fecha).slice(0, 5) : '—'}
        delta={upcoming ? { tone: 'neutral', text: upcoming.tipo } : undefined}
      />
    </div>
  );
}
