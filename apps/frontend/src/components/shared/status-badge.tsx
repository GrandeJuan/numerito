import { STATUS_COLORS } from '@/lib/design-tokens';

const FALLBACK = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-[#a0a3a8]';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? FALLBACK}`}
    >
      {label ?? status}
    </span>
  );
}
