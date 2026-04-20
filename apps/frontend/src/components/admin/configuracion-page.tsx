'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function ConfiguracionAdminPage() {
  return (
    <EmptyState
      icon={Icons.settings}
      title="Configuración"
      description="Parámetros globales de la plataforma próximamente."
    />
  );
}
