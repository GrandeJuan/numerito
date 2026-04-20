'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function IntegracionesAdminPage() {
  return (
    <EmptyState
      icon={Icons.plug}
      title="Integraciones"
      description="Estado global de integraciones externas próximamente."
    />
  );
}
