'use client';

import { useAuth } from '@/lib/auth-context';
import type { ReactNode } from 'react';

interface CanProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { tienePermiso } = useAuth();
  return tienePermiso(permission) ? <>{children}</> : <>{fallback}</>;
}
