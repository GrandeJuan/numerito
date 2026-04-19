'use client';

import { Card } from '../card';

export interface EstadoSlice {
  label: string;
  count: number;
  color: string;
}

export function EstadoDonutCard({ slices }: { slices: EstadoSlice[] }) {
  const total = slices.reduce((s, v) => s + v.count, 0);
  const size = 140;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let off = 0;

  return (
    <Card title="Estado de Facturas" subtitle="Distribución actual">
      <div className="flex gap-5 items-center">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--surface-2)"
              strokeWidth={stroke}
            />
            {slices.map((v) => {
              const len = total > 0 ? (v.count / total) * c : 0;
              const el = (
                <circle
                  key={v.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={v.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${len} ${c}`}
                  strokeDashoffset={-off}
                />
              );
              off += len;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-[24px] font-semibold tracking-[-0.03em]">{total}</div>
            <div className="text-[10px] text-[var(--text-3)] uppercase tracking-[0.08em]">
              Total
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {slices.map((v, i, a) => (
            <div
              key={v.label}
              className={`flex items-center py-[7px] ${
                i < a.length - 1 ? 'border-b border-[var(--border)]' : ''
              }`}
            >
              <div
                className="w-[3px] h-[18px] rounded-[2px] mr-2.5"
                style={{ background: v.color }}
              />
              <div className="text-[12px] text-[var(--text)]">{v.label}</div>
              <div className="ml-auto font-mono text-[13px] font-semibold text-[var(--text)]">
                {v.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
