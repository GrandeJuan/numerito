'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function RolesPermisosPage() {
  return (
    <EmptyState
      icon={Icons.shield}
      title="Roles y permisos"
      description="La matriz de permisos por rol está en desarrollo. Próximamente vas a poder configurar qué puede hacer cada rol del estudio."
    />
  );
}
