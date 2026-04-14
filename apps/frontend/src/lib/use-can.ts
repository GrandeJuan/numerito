'use client';

import { useAuth } from '@/lib/auth-context';

/**
 * Hook for conditional permission checks without JSX wrapping.
 * Complement to the <Can> component for logic-only use cases.
 *
 * @example
 * const canEdit = useCan('EDITAR_CLIENTES');
 * if (canEdit) { ... }
 */
export function useCan(permission: string): boolean {
  const { tienePermiso } = useAuth();
  return tienePermiso(permission);
}
