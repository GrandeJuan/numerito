'use client';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  slices: DonutSlice[];
  centerValue: string | number;
  centerLabel: string;
  size?: number;
  stroke?: number;
}

export function DonutChart({
  slices,
  centerValue,
  centerLabel,
  size = 180,
  stroke = 18,
}: DonutChartProps) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;

  let offset = 0;
  const arcs = slices.map((s) => {
    const len = (s.value / total) * circ;
    const el = (
      <circle
        key={s.label}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={s.color}
        strokeWidth={stroke}
        strokeDasharray={`${len} ${circ}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += len;
    return el;
  });

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        {arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[22px] font-semibold tracking-[-0.01em]">{centerValue}</div>
        <div className="text-[11px] text-[var(--text-3)] uppercase tracking-[0.08em] mt-0.5">
          {centerLabel}
        </div>
      </div>
    </div>
  );
}

export function DonutLegend({
  rows,
}: {
  rows: Array<{ label: string; value: string | number; percent: string; color: string }>;
}) {
  return (
    <div className="flex-1 flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2.5 text-[12.5px] py-1">
          <span className="w-[9px] h-[9px] rounded-[2px]" style={{ background: r.color }} />
          <span className="flex-1 text-[var(--text-2)]">{r.label}</span>
          <span className="font-mono font-medium text-[var(--text)]">{r.value}</span>
          <span className="font-mono text-[11px] text-[var(--text-3)] min-w-[40px] text-right">
            {r.percent}
          </span>
        </div>
      ))}
    </div>
  );
}
