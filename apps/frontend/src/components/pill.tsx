import type { ReactNode } from 'react';

export type PillTone = 'neutral' | 'brand' | 'amber' | 'rose' | 'indigo' | 'blue';

export interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  /** Show a colored dot before the label */
  dot?: boolean;
  /** Small variant (default: true) */
  small?: boolean;
}

const TONE_CLASSES: Record<PillTone, string> = {
  neutral: 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)]',
  brand: 'bg-[var(--brand-softer)] text-[var(--brand-ink)] border-[var(--brand-soft)]',
  amber: 'bg-[var(--amber-soft)] text-[var(--amber-ink)] border-[var(--amber-soft)]',
  rose: 'bg-[var(--rose-soft)] text-[var(--rose-ink)] border-[var(--rose-soft)]',
  indigo: 'bg-[var(--indigo-soft)] text-[var(--indigo-ink)] border-[var(--indigo-soft)]',
  blue: 'bg-[var(--blue-soft)] text-[var(--blue-ink)] border-[var(--blue-soft)]',
};

const TONE_DOT: Record<PillTone, string> = {
  neutral: 'bg-[var(--text-3)]',
  brand: 'bg-[var(--brand)]',
  amber: 'bg-[var(--amber)]',
  rose: 'bg-[var(--rose)]',
  indigo: 'bg-[var(--indigo)]',
  blue: 'bg-[var(--blue)]',
};

export function Pill({ tone = 'neutral', children, dot = false, small = true }: PillProps) {
  const size = small ? 'px-2 py-[2px] text-[10.5px]' : 'px-2.5 py-[3px] text-[11.5px]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap ${size} ${TONE_CLASSES[tone]}`}
    >
      {dot && <span className={`inline-block w-[5px] h-[5px] rounded-full ${TONE_DOT[tone]}`} />}
      {children}
    </span>
  );
}
