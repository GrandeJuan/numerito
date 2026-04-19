'use client';

import { Card } from '../card';
import { SegmentedControl } from '../segmented-control';
import { useState } from 'react';
import { formatCurrency } from '@/lib/formatters';

export interface FacturacionPoint {
  mes: string;
  monto: number;
}

const moneyK = (n: number) => {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
};

export interface FacturacionMensualCardProps {
  data: FacturacionPoint[];
}

export function FacturacionMensualCard({ data }: FacturacionMensualCardProps) {
  const [range, setRange] = useState<'3m' | '6m' | '12m'>('12m');
  const n = range === '3m' ? 3 : range === '6m' ? 6 : 12;
  const slice = data.slice(-n);

  const w = 600;
  const h = 140;
  const pad = 8;
  const max = Math.max(1, ...slice.map((d) => d.monto));
  const pts = slice.map((d, i) => ({
    x: pad + (i / Math.max(1, slice.length - 1)) * (w - pad * 2),
    y: h - pad - (d.monto / max) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1]?.x ?? 0},${h - pad} L${pts[0]?.x ?? 0},${h - pad} Z`;

  const total = slice.reduce((s, d) => s + d.monto, 0);
  const avg = slice.length ? total / slice.length : 0;
  const best = Math.max(0, ...slice.map((d) => d.monto));

  return (
    <Card
      title="Facturación Mensual"
      subtitle={`Últimos ${n} meses`}
      right={
        <SegmentedControl<'3m' | '6m' | '12m'>
          size="sm"
          value={range}
          onChange={setRange}
          options={[
            { value: '3m', label: '3M' },
            { value: '6m', label: '6M' },
            { value: '12m', label: '12M' },
          ]}
        />
      }
    >
      <div className="grid grid-cols-3 gap-4 mb-[18px] pb-4 border-b border-[var(--border)]">
        <KpiStrip label="Total" value={moneyK(total)} title={formatCurrency(total)} />
        <KpiStrip label="Promedio" value={moneyK(avg)} title={formatCurrency(avg)} />
        <KpiStrip label="Mejor mes" value={moneyK(best)} title={formatCurrency(best)} />
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        preserveAspectRatio="none"
        className="block"
      >
        <defs>
          <linearGradient id="dashAreaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={pad}
            x2={w - pad}
            y1={h * t}
            y2={h * t}
            stroke="var(--border)"
            strokeDasharray="2 3"
          />
        ))}
        <path d={area} fill="url(#dashAreaGrad)" />
        <path d={line} fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinejoin="round" />
        {pts.length > 0 && (
          <circle
            cx={pts[pts.length - 1].x}
            cy={pts[pts.length - 1].y}
            r="4"
            fill="var(--surface)"
            stroke="var(--brand)"
            strokeWidth="2"
          />
        )}
      </svg>
      <div className="flex mt-1.5">
        {slice.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] text-[var(--text-3)] font-mono"
          >
            {i % 2 === 0 ? d.mes : ''}
          </div>
        ))}
      </div>
    </Card>
  );
}

function KpiStrip({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div>
      <div className="text-[10.5px] text-[var(--text-3)] uppercase tracking-[0.08em]">{label}</div>
      <div
        className="font-mono text-[20px] font-semibold tracking-[-0.02em] mt-1"
        title={title}
      >
        {value}
      </div>
    </div>
  );
}
