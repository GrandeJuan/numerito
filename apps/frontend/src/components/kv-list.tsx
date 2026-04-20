'use client';

import type { ReactNode } from 'react';

export interface KvRow {
  key: string;
  value: ReactNode;
}

export interface KvListProps {
  rows: KvRow[];
  className?: string;
}

export function KvList({ rows, className = '' }: KvListProps) {
  return (
    <dl className={`m-0 ${className}`}>
      {rows.map((r, i) => (
        <div
          key={r.key}
          className={`grid grid-cols-[180px_1fr] gap-3 items-baseline py-2.5 text-[13px] ${
            i === 0 ? '' : 'border-t border-[var(--border)]'
          }`}
        >
          <dt className="text-[12px] text-[var(--text-3)] m-0">{r.key}</dt>
          <dd className="text-[var(--text)] m-0">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
