'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from './icons';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const DEFAULT_NAV: NavItem[] = [
  { key: 'inicio', label: 'Inicio', href: '/', icon: Icons.home },
  { key: 'clientes', label: 'Clientes', href: '/clientes', icon: Icons.people },
  { key: 'obligaciones', label: 'Obligaciones', href: '/obligaciones', icon: Icons.event },
  { key: 'facturacion', label: 'Facturación', href: '/facturacion', icon: Icons.receipt },
  { key: 'contabilidad', label: 'Contabilidad', href: '/contabilidad', icon: Icons.bank },
  { key: 'tareas', label: 'Tareas', href: '/tareas', icon: Icons.task },
  { key: 'configuracion', label: 'Configuración', href: '/configuracion', icon: Icons.settings },
];

export interface SidebarProps {
  items?: NavItem[];
  estudioNombre: string;
  estudioIniciales: string;
  estudioUsuarios?: number;
  userName: string;
  userEmail: string;
  userIniciales: string;
  role?: string;
}

export function Sidebar({
  items = DEFAULT_NAV,
  estudioNombre,
  estudioIniciales,
  estudioUsuarios,
  userName,
  userEmail,
  userIniciales,
  role,
}: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href) ?? false;

  return (
    <aside className="w-[232px] flex-shrink-0 flex flex-col bg-[var(--sidebar)] text-[var(--sidebar-text)] border-r border-[var(--sidebar-border)]">
      {/* Brand */}
      <div className="px-4 pt-[18px] pb-[14px] border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-lg bg-[rgba(46,230,168,0.18)] text-[var(--brand)] flex items-center justify-center">
            {Icons.logo}
          </div>
          <div className="text-[15px] font-semibold text-white tracking-[-0.01em]">Numerito</div>
        </div>
        {role && (
          <span className="inline-block mt-2.5 px-[7px] py-[2px] text-[9.5px] font-semibold tracking-[0.1em] rounded bg-white/[0.07] text-[var(--sidebar-muted)]">
            {role}
          </span>
        )}
      </div>

      {/* Estudio selector */}
      <div className="px-3 pt-3 pb-2">
        <button
          type="button"
          className="w-full py-[9px] px-3 flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] rounded-[9px] text-white text-left hover:bg-white/[0.06] transition-colors"
        >
          <div className="w-[26px] h-[26px] rounded-md bg-[var(--brand)] text-[var(--brand-on)] flex items-center justify-center text-[11px] font-semibold">
            {estudioIniciales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-medium text-white truncate">{estudioNombre}</div>
            {estudioUsuarios != null && (
              <div className="text-[10px] text-[var(--sidebar-muted)]">
                {estudioUsuarios} usuarios
              </div>
            )}
          </div>
          <span className="text-[var(--sidebar-muted)]">{Icons.chevD}</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-1 flex flex-col gap-px overflow-y-auto">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-[7px] text-[12.5px] transition-colors ${
                active
                  ? 'text-white bg-[rgba(46,230,168,0.12)] font-medium'
                  : 'text-[var(--sidebar-muted)] font-normal hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {active && (
                <span className="absolute -left-2.5 top-1.5 bottom-1.5 w-[2px] bg-[var(--brand)] rounded" />
              )}
              <span className={active ? 'text-[var(--brand)]' : 'text-[var(--sidebar-muted)]'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[var(--sidebar-border)] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[var(--brand)] text-[var(--brand-on)] flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
          {userIniciales}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium text-white truncate">{userName}</div>
          <div className="text-[10px] text-[var(--sidebar-muted)] truncate">{userEmail}</div>
        </div>
      </div>
    </aside>
  );
}
