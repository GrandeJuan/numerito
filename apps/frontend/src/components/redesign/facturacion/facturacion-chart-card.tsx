'use client';

import { Card } from '../card';

export interface FacturacionPoint {
  mes: string;
  facturado: number;
  cobrado: number;
}

export function FacturacionChartCard({ data }: { data: FacturacionPoint[] }) {
  const w = 700;
  const h = 180;
  const pad = 12;
  const max = Math.max(1, ...data.map((d) => Math.max(d.facturado, d.cobrado)));

  const pts = (key: 'facturado' | 'cobrado') =>
    data.map((d, i) => ({
      x: pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2),
      y: h - pad - (d[key] / max) * (h - pad * 2),
    }));

  const p1 = pts('facturado');
  const p2 = pts('cobrado');
  const line1 = p1.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const line2 = p2.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const area1 = `${line1} L${p1[p1.length - 1]?.x ?? 0},${h - pad} L${p1[0]?.x ?? 0},${h - pad} Z`;

  return (
    <Card
      title="Facturación vs Cobranzas"
      subtitle="Últimos 12 meses"
      right={
        <div className="flex gap-3.5 text-[11.5px]">
          <span className="inline-flex items-center gap-1.5 text-[var(--text-2)]">
            <span className="w-2 h-2 rounded-[2px] bg-[var(--brand)]" />
            Facturado
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--text-2)]">
            <span className="w-2.5 h-0.5 bg-[var(--indigo)]" />
            Cobrado
          </span>
        </div>
      }
    >
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" className="block">
        <defs>
          <linearGradient id="facGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.25" />
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
        <path d={area1} fill="url(#facGrad)" />
        <path d={line1} fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinejoin="round" />
        <path
          d={line2}
          fill="none"
          stroke="var(--indigo)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-[var(--text-3)] font-mono">
            {d.mes}
          </div>
        ))}
      </div>
    </Card>
  );
}
