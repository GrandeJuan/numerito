'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useDarkMode } from '@/lib/use-dark-mode';
import { EstudioSelector } from './estudio-selector';
import { Breadcrumbs } from './breadcrumbs';
import { Can } from './can';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
}

const DASHBOARD_NAV: NavItem[] = [
  { label: 'Inicio', href: '/dashboard', icon: 'home' },
  { label: 'Clientes', href: '/dashboard/clientes', icon: 'people' },
  { label: 'Obligaciones', href: '/dashboard/obligaciones', icon: 'event' },
  { label: 'Facturación', href: '/dashboard/facturacion', icon: 'receipt_long', permission: 'VER_FACTURACION' },
  { label: 'Contabilidad', href: '/dashboard/contabilidad', icon: 'account_balance', permission: 'VER_CONTABILIDAD' },
  { label: 'Tareas', href: '/dashboard/tareas', icon: 'task_alt', permission: 'VER_TAREAS' },
  { label: 'Configuracion', href: '/dashboard/configuracion', icon: 'settings', permission: 'GESTIONAR_CONFIGURACION' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Panel Admin', href: '/admin', icon: 'admin_panel_settings' },
  { label: 'Estudios', href: '/admin/estudios', icon: 'business' },
  { label: 'Usuarios', href: '/admin/usuarios', icon: 'manage_accounts' },
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

function NavItemLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const link = (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[#4edea3]/15 text-[#4edea3]'
          : 'text-white/70 hover:bg-white/5 hover:text-white'
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

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const navItems = getNavItems(pathname);
  const showEstudioSelector = !isPortalRoute(pathname);

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#091426] text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
            <div className="w-8 h-8 bg-[#4edea3]/20 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[#4edea3] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance
              </span>
            </div>
            <span className="text-lg font-bold tracking-tight">Numerito</span>
          </div>

          {/* Estudio Selector — hidden on portal routes */}
          {showEstudioSelector && <EstudioSelector />}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </nav>

          {/* Notification bell */}
          <div className="px-3 py-4 border-t border-white/10">
            <button
              aria-label="Notificaciones"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors w-full"
            >
              <span className="material-symbols-outlined text-lg relative">
                notifications
              </span>
              Notificaciones
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 shrink-0">
          {/* Left side: mobile menu + breadcrumbs */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Abrir menú"
            >
              <span className="material-symbols-outlined dark:text-gray-300">menu</span>
            </button>

            <div className="hidden lg:block">
              <Breadcrumbs />
            </div>
          </div>

          {/* Right side: dark mode toggle + user info + logout */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
