'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/** Derive 2-letter initials from a full name. */
function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export interface RedesignProtectedLayoutProps {
  children: ReactNode;
}

/**
 * New layout behind NEXT_PUBLIC_REDESIGN. The old layout remains unchanged
 * and is picked by the (dashboard)/layout.tsx switch when the flag is off.
 */
export function RedesignProtectedLayout({ children }: RedesignProtectedLayoutProps) {
  const { user, estudioActual } = useAuth();

  const estudioNombre = estudioActual?.nombre ?? 'Estudio';
  const estudioIniciales = initials(estudioNombre);
  const userName = user?.nombre ?? user?.email ?? 'Usuario';
  const userEmail = user?.email ?? '';
  const userIniciales = initials(userName);
  const role = user?.rol;

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar
        estudioNombre={estudioNombre}
        estudioIniciales={estudioIniciales}
        userName={userName}
        userEmail={userEmail}
        userIniciales={userIniciales}
        role={role}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar
          estudioNombre={estudioNombre}
          userIniciales={userIniciales}
          notifications={1}
        />
        <div className="flex-1 px-8 py-[26px] max-w-[1400px] w-full">{children}</div>
      </main>
    </div>
  );
}
