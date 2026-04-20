'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function FacturacionAdminPage() {
  return (
    <EmptyState
      icon={Icons.receipt}
      title="Facturación"
      description="Facturación de la plataforma a estudios suscriptos próximamente."
    />
  );
}
