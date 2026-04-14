'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useDarkMode } from '@/lib/use-dark-mode';
import { EstudioSelector } from './estudio-selector';
import { Breadcrumbs } from './breadcrumbs';
import { Can } from './can';
import { NotificationBell } from './notification-bell';
import { GlobalSearch } from './global-search';
import { UserAvatar } from './user-avatar';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
}

const DASHBOARD_NAV: NavItem[] = [
  { label: 'Inicio', href: '/', icon: 'home' },
  { label: 'Clientes', href: '/clientes', icon: 'people' },
  { label: 'Obligaciones', href: '/obligaciones', icon: 'event' },
  {
    label: 'Facturación',
    href: '/facturacion',
    icon: 'receipt_long',
    permission: 'VER_FACTURACION',
  },
  {
    label: 'Contabilidad',
    href: '/contabilidad',
    icon: 'account_balance',
    permission: 'VER_CONTABILIDAD',
  },
  { label: 'Tareas', href: '/tareas', icon: 'task_alt', permission: 'VER_TAREAS' },
  {
    label: 'Configuracion',
    href: '/configuracion',
    icon: 'settings',
    permission: 'GESTIONAR_CONFIGURACION',
  },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
  { label: 'Estudios', href: '/admin/estudios', icon: 'business' },
  { label: 'Usuarios', href: '/admin/usuarios', icon: 'manage_accounts' },
  { label: 'Suscripciones', href: '/admin/suscripciones', icon: 'card_membership' },
  { label: 'Facturación', href: '/admin/facturacion', icon: 'receipt_long' },
  { label: 'Métricas', href: '/admin/metricas', icon: 'bar_chart' },
  { label: 'Integraciones', href: '/admin/integraciones', icon: 'extension' },
  { label: 'Logs', href: '/admin/logs', icon: 'list_alt' },
  { label: 'Configuración', href: '/admin/configuracion', icon: 'settings' },
];

const PORTAL_NAV: NavItem[] = [
  { label: 'Mi Portal', href: '/portal', icon: 'dashboard' },
  { label: 'Mis Documentos', href: '/portal/documentos', icon: 'folder' },
  { label: 'Mis Obligaciones', href: '/portal/obligaciones', icon: 'event' },
];

function getNavItems(pathname: string): NavItem[] {
  if (pathname.startsWith('/admin')) return ADMIN_NAV;
  if (pathname.startsWith('/portal')) return PORTAL_NAV;
  return DASHBOARD_NAV;
}

function isPortalRoute(pathname: string): boolean {
  return pathname.startsWith('/portal');
}

function getRoleLabel(pathname: string, userRol?: string): string | null {
  if (pathname.startsWith('/admin')) return 'SUPERADMIN';
  if (pathname.startsWith('/portal')) return 'CLIENTE';
  return userRol ?? null;
}

function NavItemLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
      }`}
    >
      <span className="material-symbols-outlined text-lg">{item.icon}</span>
      {item.label}
    </Link>
  );

  if (item.permission) {
    return <Can permission={item.permission}>{link}</Can>;
  }

  return link;
}

/* ── User dropdown menu ── */
interface UserDropdownProps {
  user: { email: string; nombre?: string; apellido?: string; avatarUrl?: string | null };
  onLogout: () => void;
}

function UserDropdown({ user, onLogout }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const displayName = user.nombre
    ? `${user.nombre} ${user.apellido ?? ''}`.trim()
    : user.email;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#091426]/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Menú de usuario"
      >
        <UserAvatar
          nombre={user.nombre}
          apellido={user.apellido}
          email={user.email}
          avatarUrl={user.avatarUrl}
          size="sm"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#162a4a] rounded-xl shadow-xl border border-[#e2e8f0] dark:border-white/10 z-50 py-1">
          <div className="px-4 py-3 border-b border-[#e2e8f0] dark:border-white/10">
            <p className="text-sm font-medium text-[#091426] dark:text-white truncate">{displayName}</p>
            {user.nombre && (
              <p className="text-xs text-[#45474c] dark:text-[#c5c6cd] truncate mt-0.5">{user.email}</p>
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              router.push('/perfil');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#45474c] dark:text-[#c5c6cd] hover:bg-[#f0f4f8] dark:hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">person</span>
            Perfil
          </button>

          <button
            onClick={() => {
              setOpen(false);
              router.push('/configuracion');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#45474c] dark:text-[#c5c6cd] hover:bg-[#f0f4f8] dark:hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            Configuración
          </button>

          <div className="border-t border-[#e2e8f0] dark:border-white/10 mt-1">
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const navItems = getNavItems(pathname);
  const showEstudioSelector = !isPortalRoute(pathname) && !pathname.startsWith('/admin');
  const roleLabel = getRoleLabel(pathname, user?.rol);

  return (
    <div className="flex h-screen bg-[#faf8ff] dark:bg-[#0d1f3c]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always dark */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-white/10 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #091426 100%)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo + role indicator */}
          <div className="px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#4edea3]/20 rounded-lg flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[#4edea3] text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance
                </span>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">Numerito</span>
            </div>
            {roleLabel && (
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-white/10 text-white/60">
                {roleLabel}
              </span>
            )}
          </div>

          {/* Estudio Selector — hidden on portal/admin routes */}
          {showEstudioSelector && <EstudioSelector />}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
          </nav>

          {/* Sidebar footer — user info */}
          {user && (
            <div className="px-4 py-3 border-t border-white/10">
              <div className="flex items-center gap-3">
                <UserAvatar
                  nombre={user.nombre}
                  apellido={user.apellido}
                  email={user.email}
                  avatarUrl={user.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {user.nombre ? `${user.nombre} ${user.apellido ?? ''}`.trim() : user.email}
                  </p>
                  {user.nombre && (
                    <p className="text-xs text-white/50 truncate">{user.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#faf8ff]/80 dark:bg-[#162a4a]/80 backdrop-blur-xl border-b border-[#e2e8f0] dark:border-white/10 flex items-center justify-between px-4 lg:px-6 shrink-0">
          {/* Left side: mobile menu + breadcrumbs */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[#091426]/5 dark:hover:bg-white/5"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Abrir menú"
            >
              <span className="material-symbols-outlined text-[#091426] dark:text-[#c5c6cd]">
                menu
              </span>
            </button>

            <div className="hidden lg:block">
              <Breadcrumbs />
            </div>
          </div>

          {/* Right side: search + notification bell + dark mode + avatar dropdown */}
          <div className="flex items-center gap-2">
            {pathname.startsWith('/admin') && (
              <div className="hidden md:block">
                <GlobalSearch />
              </div>
            )}

            <NotificationBell />

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-[#091426]/5 dark:hover:bg-white/5 transition-colors"
              aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              <span className="material-symbols-outlined text-[#45474c] dark:text-[#c5c6cd]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {user && <UserDropdown user={user} onLogout={logout} />}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
