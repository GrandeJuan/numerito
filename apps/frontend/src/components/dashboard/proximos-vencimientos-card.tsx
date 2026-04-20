'use client';

import Link from 'next/link';
import { Card } from '../card';
import { Pill } from '../pill';
import { formatFecha } from '@/lib/formatters';

export interface ProximoVencimiento {
  id: string;
  cliente: string;
  obligacion: string;
  fecha: string;
  estado: string;
}

export interface ProximosVencimientosCardProps {
  items: ProximoVencimiento[];
}

export function ProximosVencimientosCard({ items }: ProximosVencimientosCardProps) {
  const relevant = items.filter((i) => i.estado !== 'PRESENTADO').slice(0, 5);
  return (
    <Card
      title="Próximos Vencimientos"
      right={
        <Link
          href="/vencimientos"
          className="text-[12px] text-[var(--brand-ink)] font-medium no-underline hover:underline"
        >
          Ver todos →
        </Link>
      }
    >
      {relevant.length === 0 ? (
        <p className="text-[var(--text-3)] text-[12.5px]">Sin vencimientos próximos.</p>
      ) : (
        relevant.map((r, i, a) => (
          <div
            key={r.id}
            className={`grid grid-cols-[2fr_2fr_1fr_auto] gap-2.5 py-2.5 items-center ${
              i < a.length - 1 ? 'border-b border-[var(--border)]' : ''
            }`}
          >
            <div className="text-[12.5px] font-medium text-[var(--text)] truncate">{r.cliente}</div>
            <div className="text-[11.5px] text-[var(--text-2)]">{r.obligacion}</div>
            <div className="font-mono text-[11px] text-[var(--text-3)]">{formatFecha(r.fecha)}</div>
            <Pill tone={r.estado.toUpperCase() === 'VENCIDO' ? 'rose' : 'amber'} dot>
              {r.estado.toUpperCase() === 'VENCIDO' ? 'Vencido' : 'Pendiente'}
            </Pill>
          </div>
        ))
      )}
    </Card>
  );
}
