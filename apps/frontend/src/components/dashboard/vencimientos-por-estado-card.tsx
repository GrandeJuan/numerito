'use client';

import { Card } from '../card';
import { Pill } from '../pill';

interface Item {
  estado: string;
  cantidad: number;
}

const LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PRESENTADO: 'Presentado',
  VENCIDO: 'Vencido',
};

const TONE: Record<string, string> = {
  PENDIENTE: 'var(--amber)',
  PRESENTADO: 'var(--brand)',
  VENCIDO: 'var(--rose)',
};

export interface VencimientosPorEstadoCardProps {
  data: Item[];
}

export function VencimientosPorEstadoCard({ data }: VencimientosPorEstadoCardProps) {
  const normalized = data.map((v) => ({ ...v, _key: v.estado.toUpperCase() }));
  const total = normalized.reduce((s, v) => s + v.cantidad, 0);
  const max = Math.max(1, ...normalized.map((v) => v.cantidad));
  const vencidos = normalized.find((v) => v._key === 'VENCIDO')?.cantidad ?? 0;

  return (
    <Card
      title="Vencimientos por Estado"
      subtitle="Obligaciones activas"
      right={<Pill tone="neutral">30 días</Pill>}
    >
      <div className="flex items-baseline gap-3 mb-5">
        <div className="font-mono text-[30px] font-semibold tracking-[-0.03em] text-[var(--text)]">
          {total}
        </div>
        <div className="text-[12.5px] text-[var(--text-3)]">obligaciones totales</div>
        {vencidos > 0 && (
          <div className="ml-auto">
            <Pill tone="rose" dot>
              {vencidos} vencidas
            </Pill>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {normalized.map((v) => (
          <div key={v._key}>
            <div className="flex items-center mb-1.5">
              <div
                className="w-2 h-2 rounded-[2px] mr-2"
                style={{ background: TONE[v._key] ?? 'var(--text-3)' }}
              />
              <div className="text-[12.5px] font-medium text-[var(--text)]">
                {LABEL[v._key] ?? v.estado}
              </div>
              <div className="ml-auto flex items-center gap-2.5">
                <span className="font-mono text-[11.5px] text-[var(--text-3)]">
                  {Math.round((v.cantidad / Math.max(1, total)) * 100)}%
                </span>
                <span className="font-mono text-[13.5px] font-semibold text-[var(--text)] min-w-[22px] text-right">
                  {v.cantidad}
                </span>
              </div>
            </div>
            <div className="h-[6px] bg-[var(--surface-2)] border border-[var(--border)] rounded-[3px] overflow-hidden">
              <div
                className="h-full rounded-[3px] transition-[width] duration-500"
                style={{
                  width: `${(v.cantidad / max) * 100}%`,
                  background: TONE[v._key] ?? 'var(--text-3)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
