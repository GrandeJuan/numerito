'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { EstudioSelector } from './estudio-selector';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const DASHBOARD_NAV: NavItem[] = [
  { label: 'Inicio', href: '/dashboard', icon: 'home' },
  { label: 'Clientes', href: '/dashboard/clientes', icon: 'people' },
  { label: 'Obligaciones', href: '/dashboard/obligaciones', icon: 'event' },
  { label: 'Facturación', href: '/dashboard/facturacion', icon: 'receipt_long' },
  { label: 'Tareas', href: '/dashboard/tareas', icon: 'task_alt' },
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

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = getNavItems(pathname);

  return (
    <div className="flex h-screen bg-[#f5f5f7]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
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

          {/* Estudio Selector */}
          <EstudioSelector />

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
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
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="hidden lg:block" />

          {/* User info + logout */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
