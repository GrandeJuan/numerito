import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-[22px] flex-wrap">
      <div>
        <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">
          {title}
        </h1>
        {subtitle && <div className="text-[13px] text-[var(--text-3)] mt-[3px]">{subtitle}</div>}
      </div>
      {actions && <div className="flex gap-2 items-center">{actions}</div>}
    </div>
  );
}
