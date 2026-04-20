'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { DEFAULT_NAV } from './sidebar';

export interface TopbarProps {
  estudioNombre: string;
  userIniciales: string;
}

function deriveCrumbs(pathname: string, estudioNombre: string): string[] {
  const section = DEFAULT_NAV.find((n) =>
    n.href === '/' ? pathname === '/' : pathname.startsWith(n.href),
  );
  return [estudioNombre, section?.label ?? 'Inicio'];
}

export function Topbar({ estudioNombre }: TopbarProps) {
  const pathname = usePathname() ?? '/';
  const crumbs = deriveCrumbs(pathname, estudioNombre);
  const { user, estudioActual, estudios, logout } = useAuth();

  const displayName =
    [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.email || 'Usuario';
  const profileHref =
    user?.rol === 'SUPERADMIN'
      ? '/admin/perfil'
      : user?.rol === 'CLIENTE'
        ? '/portal/perfil'
        : '/perfil';

  return (
    <div className="h-[58px] bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-7 flex-shrink-0">
      <div className="flex items-center gap-2 text-[12.5px] text-[var(--text-3)]">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-[var(--text-4)]">/</span>}
            <span
              className={
                i === crumbs.length - 1 ? 'text-[var(--text)] font-medium' : 'text-[var(--text-3)]'
              }
            >
              {c}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <UserMenu
          user={{
            nombre: displayName,
            email: user?.email ?? '',
            role: user?.rol,
            avatarUrl: user?.avatarUrl,
          }}
          studio={
            estudioActual ? { nombre: estudioActual.nombre, count: estudios.length } : undefined
          }
          onLogout={logout}
          profileHref={profileHref}
        />
      </div>
    </div>
  );
}
