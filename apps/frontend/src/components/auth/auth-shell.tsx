'use client';

import type { ReactNode } from 'react';

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
  /** Chip contextual a la derecha del brand (ej: "Estudio", "Portal", "Admin"). */
  env?: string;
}

export function AuthShell({ title, subtitle, footer, children, env = 'Estudio' }: AuthShellProps) {
  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(46,230,168,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(46,230,168,0.035) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 -translate-x-1/2"
        style={{
          top: '-15%',
          width: 900,
          height: 900,
          background: 'radial-gradient(circle, rgba(46,230,168,0.10), transparent 60%)',
        }}
      />

      <main className="relative min-h-screen grid place-items-center px-5 py-8">
        <div
          className="relative w-full max-w-[420px] rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-9 pt-9 pb-8"
          style={{
            boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px rgba(0,0,0,0.35)',
          }}
        >
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-8 h-8 rounded-[8px] bg-[var(--brand)] text-[var(--brand-on)] grid place-items-center font-bold text-[16px] tracking-[-0.02em]">
              N
            </div>
            <div className="text-[14.5px] font-semibold tracking-[-0.01em] text-[var(--text)]">
              Numerito
            </div>
            <div className="w-1 h-1 rounded-full bg-[var(--text-3)]" />
            <div className="text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-3)] font-medium">
              {env}
            </div>
          </div>

          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)] m-0 mb-1.5">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-[var(--text-3)] m-0 mb-[26px] leading-[1.5]">
              {subtitle}
            </p>
          )}
          {!subtitle && <div className="mb-[26px]" />}

          {children}

          {footer && (
            <div className="mt-[26px] text-center text-[12px] text-[var(--text-3)]">{footer}</div>
          )}
        </div>
      </main>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-[18px] flex gap-4 font-mono text-[10.5px] tracking-[0.04em] text-[var(--text-3)]">
        <span>v{process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'}</span>
        <span className="text-[var(--brand)]">●</span>
        <span>ar-east-1</span>
        <span className="text-[var(--brand)]">●</span>
        <span>numerito.ar</span>
      </div>
    </div>
  );
}
