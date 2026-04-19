import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'brand';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--text)] text-[var(--surface)] border-[var(--text)]',
  ghost: 'bg-[var(--surface)] text-[var(--text-2)] border-[var(--border)] shadow-[var(--shadow-sm)]',
  brand: 'bg-[var(--brand)] text-[var(--brand-on)] border-[var(--brand)]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-[5px] text-[11.5px]',
  md: 'px-3.5 py-[7px] text-[12.5px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, children, className = '', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});
