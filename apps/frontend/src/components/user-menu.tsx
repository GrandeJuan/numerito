'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Avatar } from './avatar';

export interface UserMenuUser {
  nombre: string;
  email: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface UserMenuStudio {
  nombre: string;
  count?: number;
}

export interface UserMenuProps {
  user: UserMenuUser;
  studio?: UserMenuStudio;
  onSwitchStudio?: () => void;
  onLogout?: () => void;
  profileHref?: string;
  helpHref?: string;
}

export function UserMenu({
  user,
  studio,
  onSwitchStudio,
  onLogout,
  profileHref = '/perfil',
  helpHref = '/support',
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menú de usuario"
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full border border-transparent hover:border-[var(--border-strong)] transition-colors cursor-pointer p-0 bg-transparent"
      >
        <Avatar name={user.nombre} src={user.avatarUrl} size={34} gradient />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[42px] right-0 w-[260px] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.6)] overflow-hidden z-50"
        >
          <div className="p-4 flex items-center gap-3 border-b border-[var(--border)]">
            <Avatar name={user.nombre} src={user.avatarUrl} size={36} gradient />
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[var(--text)] truncate">
                {user.nombre}
              </div>
              <div className="text-[11.5px] text-[var(--text-3)] truncate">{user.email}</div>
              {user.role && (
                <div className="text-[10.5px] text-[var(--text-3)] tracking-[0.06em] uppercase mt-0.5">
                  {user.role}
                </div>
              )}
            </div>
          </div>

          {studio && (
            <div className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center gap-2.5">
              <div className="w-[22px] h-[22px] rounded-[5px] bg-[var(--brand-soft)] text-[var(--brand)] grid place-items-center text-[10.5px] font-bold">
                {studio.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] text-[var(--text)] truncate">{studio.nombre}</div>
                {typeof studio.count === 'number' && studio.count > 1 && (
                  <div className="text-[10px] text-[var(--text-3)] uppercase tracking-[0.08em]">
                    {studio.count} estudios disponibles
                  </div>
                )}
              </div>
              {onSwitchStudio && (
                <button
                  type="button"
                  onClick={() => {
                    onSwitchStudio();
                    close();
                  }}
                  className="text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)] bg-transparent border-0 cursor-pointer font-[inherit]"
                >
                  Cambiar
                </button>
              )}
            </div>
          )}

          <div className="py-1 border-b border-[var(--border)]">
            <MenuLink href={profileHref} onSelect={close} icon={<IconUser />}>
              Ver mi perfil
            </MenuLink>
            <MenuLink href={helpHref} onSelect={close} icon={<IconHelp />}>
              Ayuda y soporte
            </MenuLink>
          </div>

          {onLogout && (
            <div className="py-1">
              <MenuButton
                onSelect={() => {
                  onLogout();
                  close();
                }}
                icon={<IconLogout />}
                danger
              >
                Cerrar sesión
              </MenuButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function itemCls(danger?: boolean) {
  return `flex items-center gap-2.5 px-4 py-2 text-[13px] cursor-pointer no-underline transition-colors ${
    danger
      ? 'text-[var(--rose)] hover:bg-[var(--rose-soft)]'
      : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
  }`;
}

function MenuLink({
  href,
  onSelect,
  icon,
  children,
}: {
  href: string;
  onSelect: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} role="menuitem" onClick={onSelect} className={itemCls()}>
      <span className="text-[var(--text-3)] flex">{icon}</span>
      {children}
    </Link>
  );
}

function MenuButton({
  onSelect,
  icon,
  children,
  danger,
}: {
  onSelect: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={`w-full text-left bg-transparent border-0 font-[inherit] ${itemCls(danger)}`}
    >
      <span className={`${danger ? 'text-[var(--rose)]' : 'text-[var(--text-3)]'} flex`}>
        {icon}
      </span>
      {children}
    </button>
  );
}

function IconUser() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
function IconHelp() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" />
      <path d="M12 17v.01" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
