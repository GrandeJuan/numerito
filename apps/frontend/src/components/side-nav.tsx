'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export interface SideNavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export interface SideNavProps {
  items: SideNavItem[];
  activeHref: string;
}

export function SideNav({ items, activeHref }: SideNavProps) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.href === activeHref || activeHref.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] no-underline transition"
            style={{
              background: active ? 'var(--brand-softer)' : 'transparent',
              color: active ? 'var(--brand-ink)' : 'var(--text-2)',
              fontWeight: active ? 600 : 500,
            }}
          >
            {item.icon && (
              <span style={{ color: active ? 'var(--brand-ink)' : 'var(--text-3)' }}>
                {item.icon}
              </span>
            )}
            <span className="flex-1">{item.label}</span>
            {item.count !== undefined && (
              <span className="font-mono text-[11px] text-[var(--text-3)]">{item.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
