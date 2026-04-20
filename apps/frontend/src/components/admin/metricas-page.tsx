'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function MetricasAdminPage() {
  return (
    <EmptyState
      icon={Icons.chart}
      title="Métricas"
      description="Métricas de uso agregado de la plataforma próximamente."
    />
  );
}
