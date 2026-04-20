'use client';

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 18 | 22 | 28 | 34 | 36 | 48 | 72;
  className?: string;
  gradient?: boolean;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

const FONT: Record<number, number> = {
  18: 9,
  22: 10,
  28: 11,
  34: 12,
  36: 13,
  48: 16,
  72: 22,
};

export function Avatar({ name, src, size = 28, className = '', gradient = false }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const colorCls = gradient
    ? 'bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-white'
    : 'bg-[var(--brand-soft)] text-[var(--brand-ink)]';
  return (
    <div
      aria-label={name}
      title={name}
      className={`rounded-full ${colorCls} flex items-center justify-center font-semibold select-none ${className}`}
      style={{ width: size, height: size, fontSize: FONT[size] }}
    >
      {initials(name)}
    </div>
  );
}
