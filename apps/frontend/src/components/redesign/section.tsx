'use client';

import type { ReactNode } from 'react';

export interface SectionProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, subtitle, right, children, className = '' }: SectionProps) {
  return (
    <section className={`py-4 border-b border-[var(--border)] last:border-b-0 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--text)] m-0">{title}</h3>
          {subtitle && (
            <p className="text-[12px] text-[var(--text-3)] mt-0.5 m-0">{subtitle}</p>
          )}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}
