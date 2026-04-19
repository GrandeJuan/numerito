'use client';

import type { ReactNode } from 'react';
import { Button } from '../button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-[14px] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-3)] mb-4">
          <span style={{ transform: 'scale(1.4)', display: 'inline-flex' }}>{icon}</span>
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-[var(--text)] m-0">{title}</h3>
      {description && (
        <p className="text-[13px] text-[var(--text-3)] mt-1.5 mb-0 max-w-[420px] leading-[1.5]">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex items-center h-9 px-4 bg-[var(--brand)] text-[var(--brand-on)] rounded-lg text-[13px] font-medium no-underline hover:opacity-90 transition-opacity"
            >
              {action.label}
            </a>
          ) : (
            <Button onClick={action.onClick} variant="brand">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
