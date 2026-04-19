'use client';

export interface TabsProps<T extends string> {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange(v: T): void;
}

export function Tabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className="flex gap-1 border-b border-[var(--border)] mb-4"
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className="px-3.5 py-2.5 text-[13px] font-medium bg-transparent border-none cursor-pointer transition"
            style={{
              color: active ? 'var(--text)' : 'var(--text-3)',
              borderBottom: active ? '2px solid var(--brand)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className="ml-1.5 font-mono text-[11px] px-1.5 py-px rounded-[6px]"
                style={{
                  background: active ? 'var(--brand-softer)' : 'var(--surface-2)',
                  color: active ? 'var(--brand-ink)' : 'var(--text-3)',
                  border: '1px solid var(--border)',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
