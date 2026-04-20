'use client';

import { Topbar } from '@/components';
import { useAuth } from '@/lib/auth-context';
import { AdminSidebar } from './admin-sidebar';

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userName = user?.nombre ?? 'Admin';
  const userEmail = user?.email ?? '';
  const userIniciales = initials(userName);

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <AdminSidebar userName={userName} userEmail={userEmail} userIniciales={userIniciales} />
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar estudioNombre="Admin" userIniciales={userIniciales} />
        <div className="flex-1 px-8 py-7 max-w-[1400px] w-full">{children}</div>
      </main>
    </div>
  );
}
