'use client';

import { Card } from '../card';
import { DataTable } from '../data-table';
import { Pill } from '../pill';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { Icons } from '../icons';
import type { Obligacion } from '@numerito/shared';
import { formatFecha } from '@/lib/formatters';

const ESTADO: Record<Obligacion['estado'], { tone: 'amber' | 'rose' | 'brand'; label: string }> = {
  PENDIENTE: { tone: 'amber', label: 'Pendiente' },
  VENCIDO: { tone: 'rose', label: 'Vencido' },
  PRESENTADO: { tone: 'brand', label: 'Presentado' },
};

export interface VencimientosTableProps {
  rows: Obligacion[];
  presentandoId?: string | null;
  onPresentar(o: Obligacion): void;
  onMore(o: Obligacion): void;
}

export function VencimientosTable({ rows, presentandoId, onPresentar, onMore }: VencimientosTableProps) {
  return (
    <Card title="Próximos Vencimientos" subtitle="Orden por fecha de vencimiento" padding={0}>
      <DataTable<Obligacion>
        rows={rows}
        columns={[
          {
            header: 'Cliente',
            render: (o) => <span className="text-[var(--text)] font-medium">{o.cliente}</span>,
          },
          {
            header: 'Obligación',
            render: (o) => <span className="text-[var(--text-2)]">{o.tipo}</span>,
          },
          {
            header: 'Período',
            render: (o) => (
              <span className="font-mono text-[11.5px] text-[var(--text-2)]">{o.periodo}</span>
            ),
          },
          {
            header: 'Vencimiento',
            render: (o) => (
              <span className="font-mono text-[11.5px] text-[var(--text-2)]">
                {formatFecha(o.fecha)}
              </span>
            ),
          },
          {
            header: 'Estado',
            render: (o) => {
              const e = ESTADO[o.estado];
              return (
                <Pill tone={e.tone} dot>
                  {e.label}
                </Pill>
              );
            },
          },
          {
            header: '',
            align: 'right',
            render: (o) =>
              o.estado === 'PENDIENTE' ? (
                <Button
                  size="sm"
                  variant="primary"
                  disabled={presentandoId === o.id}
                  onClick={() => onPresentar(o)}
                >
                  {presentandoId === o.id ? 'Presentando…' : 'Presentar'}
                </Button>
              ) : (
                <IconButton size={26} onClick={() => onMore(o)} label="Acciones">
                  {Icons.more}
                </IconButton>
              ),
          },
        ]}
      />
    </Card>
  );
}
