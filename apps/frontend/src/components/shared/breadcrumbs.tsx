'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function formatSegment(segment: string): string {
  const replaced = segment.replace(/-/g, ' ');
  return replaced.charAt(0).toUpperCase() + replaced.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumbs" className="flex items-center gap-1 text-sm">
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = '/' + segments.slice(0, index + 1).join('/');

        return (
          <span key={href} className="flex items-center gap-1">
            {index > 0 && (
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-base">
                chevron_right
              </span>
            )}
            {isLast ? (
              <span className="text-gray-800 dark:text-gray-200 font-medium">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link
                href={href}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {formatSegment(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
