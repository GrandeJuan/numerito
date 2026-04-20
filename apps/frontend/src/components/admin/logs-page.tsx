'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function LogsPage() {
  return (
    <EmptyState
      icon={Icons.file}
      title="Logs"
      description="Auditoría y eventos del sistema próximamente."
    />
  );
}
