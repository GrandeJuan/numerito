import { EmptyState } from '@/components/redesign/states/empty-state';
import { Icons } from '@/components/redesign';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
      <EmptyState
        icon={Icons.search}
        title="Página no encontrada"
        description="La ruta que buscás no existe o fue movida."
        action={{ label: 'Volver al inicio', href: '/' }}
      />
    </div>
  );
}
