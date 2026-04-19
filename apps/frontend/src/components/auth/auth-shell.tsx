'use client';

import type { ReactNode } from 'react';

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[var(--bg)]">
      {/* Brand side */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-[var(--ink)] text-[var(--ink-text)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[var(--brand)] text-[var(--brand-on)] flex items-center justify-center font-bold text-[18px]">
            N
          </div>
          <div>
            <div className="text-[15px] font-semibold">Numerito</div>
            <div className="text-[11px] text-[var(--ink-text-3)] font-mono">
              Gestión para estudios contables
            </div>
          </div>
        </div>

        <div className="max-w-[420px]">
          <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] m-0">
            Tu estudio,
            <br />
            organizado como corresponde.
          </h1>
          <p className="text-[14px] text-[var(--ink-text-2)] mt-4 leading-[1.5]">
            Clientes, obligaciones, facturación y tareas en un solo lugar. Sin
            planillas, sin caos.
          </p>
        </div>

        <div className="text-[11.5px] text-[var(--ink-text-3)] font-mono">
          © {new Date().getFullYear()} Numerito
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          {/* Mobile brand */}
          <div className="md:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-[8px] bg-[var(--brand)] text-[var(--brand-on)] flex items-center justify-center font-bold text-[14px]">
              N
            </div>
            <div className="text-[14px] font-semibold text-[var(--text)]">Numerito</div>
          </div>

          <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-[var(--text)] m-0">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[13px] text-[var(--text-3)] mt-1.5 mb-6 leading-[1.5]">
              {subtitle}
            </p>
          )}
          {!subtitle && <div className="mb-6" />}

          {children}

          {footer && (
            <div className="mt-6 pt-5 border-t border-[var(--border)] text-[12.5px] text-[var(--text-3)] text-center">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
