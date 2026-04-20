'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface AdminSidebarProps {
  counts?: { estudios?: number | string; usuarios?: number | string };
  userName: string;
  userEmail: string;
  userIniciales: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  tail?: string;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function buildGroups(counts: AdminSidebarProps['counts'] = {}): NavGroup[] {
  return [
    {
      label: 'Plataforma',
      items: [
        { href: '/admin', label: 'Dashboard', icon: <DashIcon />, exact: true },
        {
          href: '/admin/estudios',
          label: 'Estudios',
          icon: <StudioIcon />,
          tail: counts.estudios != null ? String(counts.estudios) : undefined,
        },
        {
          href: '/admin/usuarios',
          label: 'Usuarios',
          icon: <UserIcon />,
          tail: counts.usuarios != null ? String(counts.usuarios) : undefined,
        },
        { href: '/admin/suscripciones', label: 'Suscripciones', icon: <BillingIcon /> },
      ],
    },
    {
      label: 'Operaciones',
      items: [
        { href: '/admin/facturacion', label: 'Facturación', icon: <ReceiptIcon /> },
        { href: '/admin/metricas', label: 'Métricas', icon: <ChartIcon /> },
        { href: '/admin/integraciones', label: 'Integraciones', icon: <PlugIcon /> },
        { href: '/admin/import-excel', label: 'Import Excel', icon: <ImportIcon /> },
        { href: '/admin/reglas-propuestas', label: 'Reglas Propuestas', icon: <ProposalIcon /> },
        { href: '/admin/logs', label: 'Logs', icon: <LogIcon /> },
      ],
    },
    {
      label: 'Config',
      items: [{ href: '/admin/configuracion', label: 'Plataforma', icon: <GearIcon /> }],
    },
  ];
}

export function AdminSidebar({ counts, userName, userEmail, userIniciales }: AdminSidebarProps) {
  const pathname = usePathname() ?? '/';
  const groups = buildGroups(counts);

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <aside className="sticky top-0 h-screen w-[232px] flex-shrink-0 bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] p-[18px_12px] flex flex-col gap-3.5 overflow-y-auto">
      <div className="flex items-center gap-2.5 px-2 pb-3.5 border-b border-white/[0.06]">
        <div className="w-[30px] h-[30px] bg-[rgba(46,230,168,0.18)] text-[var(--brand)] rounded-[7px] grid place-items-center font-bold">
          N
        </div>
        <div>
          <div className="text-[13.5px] font-semibold text-white flex items-center gap-1.5">
            Numerito
            <span className="bg-[var(--rose-soft)] text-[var(--rose)] text-[9px] tracking-[0.08em] px-[5px] py-0.5 rounded uppercase font-bold">
              Admin
            </span>
          </div>
          <div className="text-[10.5px] text-[var(--sidebar-muted)] tracking-[0.08em] uppercase">
            Panel interno
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3.5 min-h-0">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="text-[10px] text-[var(--sidebar-muted)] opacity-70 tracking-[0.1em] uppercase px-2.5 py-1 pt-1.5 font-semibold">
              {g.label}
            </div>
            <nav className="flex flex-col gap-px">
              {g.items.map((it) => {
                const active = isActive(it);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-[7px] text-[12.5px] no-underline transition-colors ${
                      active
                        ? 'text-white bg-white/[0.04] font-medium'
                        : 'text-[var(--sidebar-muted)] hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <span
                      className={`flex ${active ? 'text-[var(--brand)]' : 'text-[var(--sidebar-muted)] opacity-70'}`}
                    >
                      {it.icon}
                    </span>
                    <span className="flex-1">{it.label}</span>
                    {it.tail && (
                      <span className="text-[10.5px] text-[var(--sidebar-muted)] opacity-70 font-mono">
                        {it.tail}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-[var(--sidebar-border)] flex items-center gap-2.5">
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

const common = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function DashIcon() {
  return (
    <svg {...common}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function StudioIcon() {
  return (
    <svg {...common}>
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg {...common}>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21a6 6 0 0 1 12 0" />
      <circle cx="17" cy="7" r="3" />
      <path d="M21 21a5 5 0 0 0-8-4" />
    </svg>
  );
}
function BillingIcon() {
  return (
    <svg {...common}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}
function ReceiptIcon() {
  return (
    <svg {...common}>
      <path d="M4 2h16v20l-4-2-4 2-4-2-4 2z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg {...common}>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 5-6" />
    </svg>
  );
}
function PlugIcon() {
  return (
    <svg {...common}>
      <path d="M9 2v5M15 2v5M8 7h8v5a4 4 0 0 1-8 0z" />
      <path d="M12 16v6" />
    </svg>
  );
}
function LogIcon() {
  return (
    <svg {...common}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  );
}
function ImportIcon() {
  return (
    <svg {...common}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function ProposalIcon() {
  return (
    <svg {...common}>
      <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z" />
      <path d="M16 3v5h5M9 14l2 2 4-4" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
