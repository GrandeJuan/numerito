import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'neutral' | 'brand';
  size?: number;
  /** Accessible label. Maps to `aria-label` on the underlying `<button>`. */
  label?: string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { tone = 'neutral', size = 32, label, children, className = '', ...rest },
  ref,
) {
  const ariaLabel = label ?? rest['aria-label'];
  const toneClasses =
    tone === 'brand'
      ? 'bg-[var(--brand)] border-[var(--brand)] text-[var(--brand-on)]'
      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-2)]';
  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-lg border shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] ${toneClasses} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
