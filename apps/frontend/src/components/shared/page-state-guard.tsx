'use client';

import type { ReactNode } from 'react';
import type { EstudioInfo } from '@/lib/auth-context';

interface PageStateGuardProps {
  estudioActual: EstudioInfo | null;
  loading: boolean;
  error: string | null;
  icon?: string;
  children: ReactNode;
}

export function PageStateGuard({
  estudioActual,
  loading,
  error,
  icon = 'hourglass_empty',
  children,
}: PageStateGuardProps) {
  if (!estudioActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-[#75777d]">
            {icon}
          </span>
          <p className="mt-2 text-[#45474c] dark:text-[#a0a3a8]">Cargando estudio...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#45474c] dark:text-[#a0a3a8]">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return <>{children}</>;
}
