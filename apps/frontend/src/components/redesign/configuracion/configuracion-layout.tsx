'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SideNav } from '@/components/redesign/side-nav';
import { PageHeader } from '@/components/redesign/page-header';
import { Icons } from '@/components/redesign/icons';

// This is a partial-layout helper used by /configuracion/*/page.tsx.
// It renders the sub-navigation column + the content area.

const ITEMS = [
  { href: '/configuracion/estudio', label: 'Estudio', icon: Icons.briefcase },
  { href: '/configuracion/usuarios', label: 'Usuarios', icon: Icons.users },
  { href: '/configuracion/roles-permisos', label: 'Roles y permisos', icon: Icons.shield },
  { href: '/configuracion/integraciones', label: 'Integraciones', icon: Icons.plug },
];

export interface ConfiguracionLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function ConfiguracionLayout({
  title,
  subtitle,
  actions,
  children,
}: ConfiguracionLayoutProps) {
  const pathname = usePathname();
  return (
    <>
      <PageHeader title="Configuración" subtitle="Ajustes del estudio" />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        <aside>
          <SideNav items={ITEMS} activeHref={pathname} />
        </aside>
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-[17px] font-semibold text-[var(--text)] m-0 tracking-[-0.01em]">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[12.5px] text-[var(--text-3)] mt-0.5 m-0">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
