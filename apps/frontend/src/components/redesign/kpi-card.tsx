import type { ReactNode } from 'react';
import { Pill, type PillTone } from './pill';

export interface KpiDelta {
  text: string;
  tone: PillTone;
}

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  delta?: KpiDelta;
  icon?: ReactNode;
  size?: 'sm' | 'md';
  /** HTML title attribute — useful for full-precision values on hover. */
  title?: string;
}

export function KpiCard({ label, value, delta, icon, size = 'md', title }: KpiCardProps) {
  const padding = size === 'md' ? 'px-[18px] py-[16px]' : 'px-4 py-[14px]';
  const valueSize = size === 'md' ? 'text-[24px]' : 'text-[20px]';
  return (
    <div
      title={title}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] ${padding}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10.5px] text-[var(--text-3)] uppercase tracking-[0.08em] font-medium">
          {label}
        </div>
        {icon && <div className="text-[var(--text-4)]">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 mt-2 flex-wrap">
        <div
          className={`font-mono font-semibold tracking-[-0.03em] leading-none text-[var(--text)] ${valueSize}`}
        >
          {value}
        </div>
        {delta && (
          <Pill tone={delta.tone} dot>
            {delta.text}
          </Pill>
        )}
      </div>
    </div>
  );
}
