'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function IntegracionesConfigPage() {
  return (
    <EmptyState
      icon={Icons.plug}
      title="Integraciones"
      description="ARCA, ARBA, AGIP y notificaciones van a aparecer acá cuando la capa de integraciones esté habilitada."
    />
  );
}
