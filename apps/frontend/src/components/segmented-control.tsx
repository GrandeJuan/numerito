'use client';

import type { ReactNode } from 'react';

export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps<V extends string> {
  options: ReadonlyArray<SegmentedOption<V>>;
  value: V;
  onChange: (value: V) => void;
  size?: 'sm' | 'md';
}

export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: SegmentedControlProps<V>) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11.5px]' : 'px-3 py-[5px] text-[12px]';
  return (
    <div className="inline-flex bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-[2px]">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-colors ${pad} ${
              active
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
