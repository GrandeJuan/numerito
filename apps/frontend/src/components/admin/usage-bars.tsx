'use client';

export interface UsageBarsRow {
  label: string;
  value: number;
  tone?: 'brand' | 'indigo' | 'amber' | 'rose';
}

const TONE: Record<NonNullable<UsageBarsRow['tone']>, string> = {
  brand: 'var(--brand)',
  indigo: 'var(--indigo)',
  amber: 'var(--amber)',
  rose: 'var(--rose)',
};

/** Barras horizontales — uso por módulo, adopción de features, etc. */
export function UsageBars({ rows }: { rows: UsageBarsRow[] }) {
  return (
    <div className="flex flex-col gap-3.5 p-[18px] pt-3.5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex justify-between text-[12.5px] mb-1">
            <span className="text-[var(--text-2)]">{r.label}</span>
            <span className="font-mono text-[var(--text)]">{r.value}%</span>
          </div>
          <div className="h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${r.value}%`, background: TONE[r.tone ?? 'brand'] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
