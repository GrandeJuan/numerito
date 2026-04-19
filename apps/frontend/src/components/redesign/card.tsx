import type { CSSProperties, ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  padding?: number;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  className?: string;
}

export function Card({
  children,
  title,
  subtitle,
  right,
  padding = 20,
  style,
  bodyStyle,
  className = '',
}: CardProps) {
  const hasHeader = title || right;
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] ${className}`}
      style={style}
    >
      {hasHeader && (
        <div
          className="flex items-start justify-between gap-4"
          style={{
            padding: subtitle ? '16px 20px 16px' : '16px 20px 10px',
            borderBottom: subtitle ? '1px solid var(--border)' : 'none',
          }}
        >
          <div className="min-w-0">
            {title && (
              <div className="text-[14.5px] font-semibold text-[var(--text)] tracking-[-0.01em]">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[12px] text-[var(--text-3)] mt-[3px]">{subtitle}</div>
            )}
          </div>
          {right}
        </div>
      )}
      <div
        style={{
          padding: hasHeader ? `14px ${padding}px ${padding}px` : padding,
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
