'use client';

import type { ReactNode } from 'react';

export interface ActivityItem {
  id: string;
  tone: 'brand' | 'amber' | 'rose' | 'indigo';
  body: ReactNode;
  meta?: ReactNode;
  time: string;
}

const DOT: Record<ActivityItem['tone'], string> = {
  brand: 'bg-[var(--brand)]',
  amber: 'bg-[var(--amber)]',
  rose: 'bg-[var(--rose)]',
  indigo: 'bg-[var(--indigo)]',
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="py-1">
      {items.map((it, i) => (
        <div
          key={it.id}
          className={`flex gap-3 px-[18px] py-2.5 items-start text-[12.5px] ${
            i === 0 ? '' : 'border-t border-[var(--border)]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0 ${DOT[it.tone]}`} />
          <div className="flex-1 min-w-0">
            <div className="text-[var(--text-2)] [&_b]:font-medium [&_b]:text-[var(--text)]">
              {it.body}
            </div>
            {it.meta && (
              <div className="text-[11px] text-[var(--text-3)] mt-0.5 font-mono">{it.meta}</div>
            )}
          </div>
          <div className="text-[11px] text-[var(--text-4)] font-mono flex-shrink-0">{it.time}</div>
        </div>
      ))}
    </div>
  );
}
