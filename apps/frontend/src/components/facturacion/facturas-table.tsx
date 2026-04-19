'use client';

import { Card } from '../card';
import { DataTable } from '../data-table';
import { Pill } from '../pill';
import { IconButton } from '../icon-button';
import { Icons } from '../icons';
import type { Factura } from '@numerito/shared';
import { formatCurrency, formatFecha } from '@/lib/formatters';

const ESTADO: Record<string, { tone: 'brand' | 'amber' | 'rose' | 'indigo'; label: string }> = {
  PAGADA: { tone: 'brand', label: 'Pagada' },
  PENDIENTE: { tone: 'amber', label: 'Pendiente' },
  VENCIDA: { tone: 'rose', label: 'Vencida' },
  PARCIAL: { tone: 'indigo', label: 'Parcial' },
};

export function FacturasTable({ rows }: { rows: Factura[] }) {
  return (
    <Card title="Facturas" padding={0}>
      <DataTable<Factura>
        rows={rows}
        columns={[
          {
            header: 'Número',
            render: (f) => (
              <span className="font-mono text-[11px] text-[var(--text)]">{f.numero}</span>
            ),
          },
          {
            header: 'Cliente',
            render: (f) => <span className="text-[var(--text)] font-medium">{f.cliente}</span>,
          },
          {
            header: 'Fecha',
            render: (f) => (
              <span className="font-mono text-[11.5px] text-[var(--text-2)]">
                {formatFecha(f.fecha)}
              </span>
            ),
          },
          {
            header: 'Monto',
            align: 'right',
            render: (f) => (
              <span className="font-mono text-[12.5px] font-semibold text-[var(--text)]">
                {formatCurrency(f.total)}
              </span>
            ),
          },
          {
            header: 'Estado',
            render: (f) => {
              const e = ESTADO[f.estado] ?? { tone: 'neutral' as const, label: f.estado };
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
            render: () => (
              <IconButton size={26} label="Acciones">
                {Icons.more}
              </IconButton>
            ),
          },
        ]}
      />
    </Card>
  );
}
