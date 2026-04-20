'use client';

import type { ReactNode } from 'react';

export interface KpiAdminCardProps {
  label: string;
  value: ReactNode;
  delta?: { text: string; tone: 'up' | 'down' | 'flat' };
  icon?: ReactNode;
  spark?: ReactNode;
}

/**
 * KPI card del admin — label + valor grande mono + delta + sparkline a la derecha.
 * Distinto del KpiCard normal (que es centrado); este es side-by-side.
 */
export function KpiAdminCard({ label, value, delta, icon, spark }: KpiAdminCardProps) {
  const toneCls =
    delta?.tone === 'up'
      ? 'text-[var(--brand)]'
      : delta?.tone === 'down'
        ? 'text-[var(--rose)]'
        : 'text-[var(--text-3)]';
  const arrow = delta?.tone === 'up' ? '▲' : delta?.tone === 'down' ? '▼' : '■';

  return (
    <div className="relative overflow-hidden bg-[var(--surface)] border border-[var(--border)] rounded-xl px-[18px] py-4">
      <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-3)] tracking-[0.02em] mb-2">
        {icon && <span className="w-3.5 h-3.5 text-[var(--text-4)] flex">{icon}</span>}
        {label}
      </div>
      <div className="text-[26px] font-semibold tracking-[-0.02em] leading-none font-mono">
        {value}
      </div>
      {delta && (
        <div className={`text-[11.5px] mt-1.5 font-medium ${toneCls}`}>
          {arrow} {delta.text}
        </div>
      )}
      {spark && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-[0.85] pointer-events-none">
          {spark}
        </div>
      )}
    </div>
  );
}
