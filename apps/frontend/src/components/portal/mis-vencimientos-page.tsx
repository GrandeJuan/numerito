'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function MisVencimientosPage() {
  return (
    <EmptyState
      icon={Icons.calendar}
      title="Mis vencimientos"
      description="Los vencimientos fiscales aparecen en el resumen del portal."
    />
  );
}
