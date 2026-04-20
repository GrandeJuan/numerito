'use client';

import type { ReactNode } from 'react';
import { Pill } from '@/components/pill';

export type StudioPlan = 'pro' | 'starter' | 'enterprise' | 'trial';
export type StudioStatus = 'active' | 'trial' | 'risk' | 'suspended' | 'payment_failed';

export interface StudioRow {
  id: string;
  nombre: string;
  cuit: string;
  initialsColor: 'brand' | 'indigo' | 'amber' | 'neutral';
  plan: StudioPlan;
  usuarios: number;
  clientes: number;
  clientesMax?: number;
  mrr: number | null;
  actividad: number;
  status: StudioStatus;
}

const PLAN_LABEL: Record<StudioPlan, { label: string; tone: 'brand' | 'indigo' | 'neutral' }> = {
  pro: { label: 'Pro', tone: 'brand' },
  starter: { label: 'Starter', tone: 'neutral' },
  enterprise: { label: 'Enterprise', tone: 'indigo' },
  trial: { label: 'Trial', tone: 'neutral' },
};

const STATUS_LABEL: Record<
  StudioStatus,
  { label: string; tone: 'brand' | 'amber' | 'rose' | 'indigo' }
> = {
  active: { label: 'Activo', tone: 'brand' },
  trial: { label: 'Trial · 7d', tone: 'indigo' },
  risk: { label: 'Riesgo', tone: 'amber' },
  suspended: { label: 'Suspendido', tone: 'rose' },
  payment_failed: { label: 'Pago rechazado', tone: 'rose' },
};

const INITIALS_BG: Record<StudioRow['initialsColor'], { bg: string; fg: string }> = {
  brand: { bg: 'var(--brand-soft)', fg: 'var(--brand)' },
  indigo: { bg: 'var(--indigo-soft)', fg: 'var(--indigo)' },
  amber: { bg: 'var(--amber-soft)', fg: 'var(--amber)' },
  neutral: { bg: 'var(--surface-3)', fg: 'var(--text-3)' },
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => w && !['&', 'y', 'de'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function fmtCurrency(v: number) {
  return '$' + v.toLocaleString('es-AR');
}

export interface AdminStudiosTableProps {
  rows: StudioRow[];
  onView?: (r: StudioRow) => void;
  onImpersonate?: (r: StudioRow) => void;
  onMore?: (r: StudioRow) => void;
}

export function AdminStudiosTable({ rows, onView, onImpersonate, onMore }: AdminStudiosTableProps) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <Th>Estudio</Th>
          <Th>Plan</Th>
          <Th>Usuarios</Th>
          <Th>Clientes</Th>
          <Th align="right">MRR</Th>
          <Th>Actividad</Th>
          <Th>Estado</Th>
          <Th className="w-[60px]">{null}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const plan = PLAN_LABEL[r.plan];
          const status = STATUS_LABEL[r.status];
          const initialsStyle = INITIALS_BG[r.initialsColor];
          return (
            <tr key={r.id} className="group">
              <Td>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-[30px] h-[30px] rounded-[7px] grid place-items-center text-[11px] font-semibold flex-shrink-0"
                    style={{ background: initialsStyle.bg, color: initialsStyle.fg }}
                  >
                    {initials(r.nombre)}
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <div className="text-[13px] text-[var(--text)] font-medium truncate">
                      {r.nombre}
                    </div>
                    <div className="text-[11.5px] text-[var(--text-3)] font-mono">{r.cuit}</div>
                  </div>
                </div>
              </Td>
              <Td>
                <Pill tone={plan.tone} small>
                  {plan.label}
                </Pill>
              </Td>
              <Td className="font-mono">{r.usuarios}</Td>
              <Td className="font-mono">
                {r.clientes}
                {r.clientesMax && r.clientes / r.clientesMax > 0.9 && (
                  <span className="text-[var(--amber)] text-[11px] ml-1">/ {r.clientesMax}</span>
                )}
              </Td>
              <Td align="right">
                <span
                  className={`font-mono ${
                    r.mrr === null
                      ? r.status === 'payment_failed'
                        ? 'text-[var(--rose)]'
                        : 'text-[var(--text-3)]'
                      : 'text-[var(--text)] font-medium'
                  }`}
                >
                  {r.mrr === null ? '—' : fmtCurrency(r.mrr)}
                </span>
              </Td>
              <Td>
                <ActivityBar value={r.actividad} status={r.status} />
              </Td>
              <Td>
                <Pill tone={status.tone} small>
                  <span
                    className="w-[5px] h-[5px] rounded-full"
                    style={{ background: 'currentColor' }}
                  />
                  {status.label}
                </Pill>
              </Td>
              <Td>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <RowBtn title="Ver" onClick={() => onView?.(r)}>
                    <EyeIcon />
                  </RowBtn>
                  <RowBtn title="Impersonar" onClick={() => onImpersonate?.(r)}>
                    <ImpersonateIcon />
                  </RowBtn>
                  <RowBtn title="Más" onClick={() => onMore?.(r)}>
                    <MoreIcon />
                  </RowBtn>
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Th({
  children,
  align,
  className = '',
}: {
  children: ReactNode;
  align?: 'right';
  className?: string;
}) {
  return (
    <th
      className={`text-left text-[10.5px] text-[var(--text-3)] tracking-[0.08em] uppercase font-medium px-3.5 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 ${
        align === 'right' ? 'text-right' : ''
      } ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  className = '',
}: {
  children: ReactNode;
  align?: 'right';
  className?: string;
}) {
  return (
    <td
      className={`px-3.5 py-3 border-b border-[var(--border)] last:border-b-0 text-[13px] text-[var(--text)] group-hover:bg-[var(--surface-2)] ${
        align === 'right' ? 'text-right' : ''
      } ${className}`}
    >
      {children}
    </td>
  );
}

function ActivityBar({ value, status }: { value: number; status: StudioStatus }) {
  const color =
    status === 'payment_failed' || status === 'suspended'
      ? 'var(--rose)'
      : status === 'risk'
        ? 'var(--amber)'
        : status === 'trial'
          ? 'var(--indigo)'
          : 'var(--brand)';
  return (
    <div className="h-1 min-w-[80px] bg-[var(--surface-3)] rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function RowBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-[26px] h-[26px] rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-3)] cursor-pointer grid place-items-center hover:text-[var(--text)] hover:border-[var(--border-strong)]"
    >
      {children}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ImpersonateIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6M14 10l7-7M9 21H3v-6M10 14l-7 7" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}
