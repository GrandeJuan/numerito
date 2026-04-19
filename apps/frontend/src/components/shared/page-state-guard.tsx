'use client';

import type { ReactNode } from 'react';
import type { EstudioInfo } from '@/lib/auth-context';
import { LoadingSkeleton } from '@/components/redesign/states/loading-skeleton';
import { ErrorState } from '@/components/redesign/states/error-state';

interface PageStateGuardProps {
  estudioActual?: EstudioInfo | null;
  loading: boolean;
  error: string | null;
  icon?: string;
  children: ReactNode;
}

export function PageStateGuard({
  estudioActual,
  loading,
  error,
  children,
}: PageStateGuardProps) {
  if (estudioActual === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--text-3)]">Cargando estudio...</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return <>{children}</>;
}
