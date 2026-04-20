'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function MisVencimientosPage() {
  return (
    <EmptyState
      icon={Icons.calendar}
      title="Mis vencimientos"
      description="Calendario de vencimientos fiscales próximamente. Por ahora los próximos vencimientos aparecen en el portal."
    />
  );
}
