'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Icons } from '../icons';
import { ThemeToggle } from '../theme-toggle';
import { UserMenu } from '../user-menu';

const NAV = [
  { href: '/portal', label: 'Mi portal', icon: Icons.home },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, estudioActual, logout } = useAuth();

  const displayName =
    [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.email || 'Cliente';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-20 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto h-[56px] px-5 flex items-center gap-4">
          <Link href="/portal" className="flex items-center gap-2.5 no-underline">
            <div className="w-7 h-7 rounded-[7px] bg-[var(--brand)] text-[var(--brand-on)] flex items-center justify-center font-bold text-[13px]">
              N
            </div>
            <div>
              <div className="text-[13.5px] font-semibold text-[var(--text)] leading-none">
                {estudioActual?.nombre ?? 'Numerito'}
              </div>
              <div className="text-[10.5px] text-[var(--text-3)] mt-0.5">Portal del cliente</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 ml-6">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[13px] no-underline transition"
                  style={{
                    color: active ? 'var(--text)' : 'var(--text-2)',
                    background: active ? 'var(--surface-2)' : 'transparent',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <span style={{ color: active ? 'var(--brand-ink)' : 'var(--text-3)' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserMenu
              user={{
                nombre: displayName,
                email: user?.email ?? '',
                role: user?.rol,
                avatarUrl: user?.avatarUrl,
              }}
              studio={estudioActual ? { nombre: estudioActual.nombre } : undefined}
              onLogout={logout}
              profileHref="/portal/perfil"
            />
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-5 py-6">{children}</main>
    </div>
  );
}
