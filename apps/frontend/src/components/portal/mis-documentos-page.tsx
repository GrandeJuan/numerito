'use client';

import { EmptyState } from '@/components/states/empty-state';
import { Icons } from '@/components';

export function MisDocumentosPage() {
  return (
    <EmptyState
      icon={Icons.file}
      title="Mis documentos"
      description="Repositorio documental próximamente. Por ahora los documentos recientes aparecen en el portal."
    />
  );
}
