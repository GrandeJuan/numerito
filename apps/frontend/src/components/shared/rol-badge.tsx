import { ROL_COLORS } from '@/lib/design-tokens';

const FALLBACK = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';

interface RolBadgeProps {
  rol: string;
  label?: string;
}

export function RolBadge({ rol, label }: RolBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROL_COLORS[rol] ?? FALLBACK}`}
    >
      {label ?? rol}
    </span>
  );
}
