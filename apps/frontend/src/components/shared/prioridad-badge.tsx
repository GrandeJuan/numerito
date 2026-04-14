import { PRIORIDAD_COLORS } from '@/lib/design-tokens';

const FALLBACK = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

interface PrioridadBadgeProps {
  prioridad: string;
  label?: string;
}

export function PrioridadBadge({ prioridad, label }: PrioridadBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORIDAD_COLORS[prioridad] ?? FALLBACK}`}
    >
      {label ?? prioridad}
    </span>
  );
}
