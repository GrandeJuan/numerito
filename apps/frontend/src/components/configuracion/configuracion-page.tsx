'use client';

import { usePathname } from 'next/navigation';
import { PageHeader, SideNav } from '@/components';

const NAV = [
  { href: '/configuracion/estudio', label: 'Estudio' },
  { href: '/configuracion/usuarios', label: 'Usuarios' },
  { href: '/configuracion/roles-permisos', label: 'Roles y permisos' },
  { href: '/configuracion/integraciones', label: 'Integraciones' },
];

export function ConfiguracionPage({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  return (
    <>
      <PageHeader title="Configuración" subtitle="Preferencias del estudio" />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <SideNav items={NAV} activeHref={pathname} />
        <div>{children}</div>
      </div>
    </>
  );
}
