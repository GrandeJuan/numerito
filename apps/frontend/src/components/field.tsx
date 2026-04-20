'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, className = '', id, ...rest }: FieldProps) {
  const inputId = id ?? `f-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={inputId}
        className="text-[11.5px] text-[var(--text-3)] font-medium tracking-[0.02em]"
      >
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        className={`h-9 px-3 bg-[var(--surface-2)] border rounded-lg text-[var(--text)] text-[13px] font-[inherit] outline-none transition-colors placeholder:text-[var(--text-4)] focus:bg-[var(--surface-3)] ${
          error ? 'border-[var(--rose)]' : 'border-[var(--border)] focus:border-[var(--brand)]'
        }`}
      />
      {error ? (
        <span className="text-[11.5px] text-[var(--rose)]">{error}</span>
      ) : hint ? (
        <span className="text-[11.5px] text-[var(--text-3)]">{hint}</span>
      ) : null}
    </div>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}
