'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/states/error-state';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
      <ErrorState
        title="Algo salió mal"
        message={error.message || 'Se produjo un error inesperado. Intentá de nuevo.'}
        onRetry={reset}
      />
    </div>
  );
}
