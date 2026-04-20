'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function MisDocumentosPage() {
  return (
    <EmptyState
      icon={Icons.file}
      title="Mis documentos"
      description="Los documentos compartidos por el estudio aparecen en el resumen del portal."
    />
  );
}
