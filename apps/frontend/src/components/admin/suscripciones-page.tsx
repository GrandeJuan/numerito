'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function SuscripcionesPage() {
  return (
    <EmptyState
      icon={Icons.receipt}
      title="Suscripciones"
      description="Gestión de suscripciones y billing de estudios próximamente."
    />
  );
}
