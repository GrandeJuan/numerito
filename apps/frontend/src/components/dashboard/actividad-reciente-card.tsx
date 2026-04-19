'use client';

import { Card } from '../card';
import { formatFecha } from '@/lib/formatters';

export interface ActividadItem {
  tipo: string;
  descripcion: string;
  fecha: string;
  usuario?: string | null;
}

const Check = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
);

export interface ActividadRecienteCardProps {
  items: ActividadItem[];
}

export function ActividadRecienteCard({ items }: ActividadRecienteCardProps) {
  return (
    <Card title="Actividad Reciente">
      {items.length === 0 ? (
        <p className="text-[var(--text-3)] text-[12.5px]">Sin actividad reciente.</p>
      ) : (
        items.map((a, i, arr) => (
          <div
            key={i}
            className={`flex gap-2.5 items-start py-2.5 ${
              i < arr.length - 1 ? 'border-b border-[var(--border)]' : ''
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-[var(--brand-softer)] text-[var(--brand-ink)] flex items-center justify-center flex-shrink-0 mt-0.5">
              {Check}
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] text-[var(--text)] leading-[1.4] truncate">
                {a.descripcion}
              </div>
              <div className="text-[10.5px] text-[var(--text-3)] mt-0.5 font-mono">
                {formatFecha(a.fecha)}
                {a.usuario ? ` · ${a.usuario}` : ''}
              </div>
            </div>
          </div>
        ))
      )}
    </Card>
  );
}
