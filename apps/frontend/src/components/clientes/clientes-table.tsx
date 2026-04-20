'use client';

import { useState, useRef, useEffect } from 'react';
import { DataTable } from '../data-table';
import { Pill } from '../pill';
import { IconButton } from '../icon-button';
import { Icons } from '../icons';
import {
  TIPO_CLIENTE_LABELS,
  CONDICION_IVA_LABELS,
  type Cliente,
  type TipoCliente,
  type CondicionIVA,
} from '@numerito/shared';
import { formatCurrency } from '@/lib/formatters';

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

export interface ClientesTableProps {
  rows: Cliente[];
  total: number;
  page: number;
  totalPages: number;
  onRowClick?(c: Cliente): void;
  onPageChange(p: number): void;
  onArchivar(c: Cliente): void;
  onReactivar(c: Cliente): void;
}

function RowMenu({
  cliente,
  onEdit,
  onArchivar,
  onReactivar,
}: {
  cliente: Cliente;
  onEdit: () => void;
  onArchivar: () => void;
  onReactivar: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <IconButton
        size={26}
        label="Acciones"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {Icons.more}
      </IconButton>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1">
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 text-[12.5px] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
          >
            Ver detalle
          </button>
          {cliente.isActive !== false ? (
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-[12.5px] text-[var(--rose-ink)] hover:bg-[var(--surface-2)] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onArchivar();
              }}
            >
              Archivar
            </button>
          ) : (
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-[12.5px] text-[var(--brand-ink)] hover:bg-[var(--surface-2)] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onReactivar();
              }}
            >
              Reactivar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ClientesTable({
  rows,
  total,
  page,
  totalPages,
  onRowClick,
  onPageChange,
  onArchivar,
  onReactivar,
}: ClientesTableProps) {
  return (
    <DataTable<Cliente>
      rows={rows}
      onRowClick={onRowClick}
      columns={[
        {
          header: 'Razón Social',
          render: (c) => <span className="text-[var(--text)] font-medium">{c.razonSocial}</span>,
        },
        {
          header: 'CUIT',
          render: (c) => (
            <span className="font-mono text-[11.5px] text-[var(--text-2)]">{c.cuit}</span>
          ),
        },
        {
          header: 'Tipo',
          render: (c) => (
            <Pill tone="indigo">{TIPO_CLIENTE_LABELS[c.tipo as TipoCliente] ?? c.tipo}</Pill>
          ),
        },
        {
          header: 'Condición IVA',
          render: (c) => (
            <Pill tone="blue">
              {CONDICION_IVA_LABELS[c.condicionIva as CondicionIVA] ?? c.condicionIva}
            </Pill>
          ),
        },
        {
          header: 'Responsable',
          render: (c) =>
            c.responsable ? (
              <div className="flex items-center gap-1.5">
                <div className="w-[22px] h-[22px] rounded-full bg-[var(--brand-soft)] text-[var(--brand-ink)] flex items-center justify-center text-[10px] font-semibold">
                  {initials(c.responsable)}
                </div>
                <span className="text-[12px] text-[var(--text)]">{c.responsable}</span>
              </div>
            ) : (
              <span className="text-[12px] text-[var(--text-4)]">Sin asignar</span>
            ),
        },
        {
          header: 'Vencimientos',
          render: (c) => {
            const venc = c.vencimientosVencidos ?? 0;
            const pend = c.vencimientosPendientes ?? 0;
            if (venc > 0)
              return (
                <Pill tone="rose" dot>
                  {venc} vencido{venc > 1 ? 's' : ''}
                </Pill>
              );
            if (pend > 0)
              return (
                <Pill tone="amber" dot>
                  {pend} pendiente{pend > 1 ? 's' : ''}
                </Pill>
              );
            return (
              <Pill tone="brand" dot>
                Al día
              </Pill>
            );
          },
        },
        {
          header: 'Saldo',
          align: 'right',
          render: (c) => {
            const saldo = c.saldo ?? 0;
            return (
              <span
                className="font-mono text-[12.5px]"
                style={{
                  fontWeight: saldo > 0 ? 600 : 400,
                  color: saldo > 0 ? 'var(--text)' : 'var(--text-4)',
                }}
              >
                {saldo > 0 ? formatCurrency(saldo) : '—'}
              </span>
            );
          },
        },
        {
          header: '',
          align: 'right',
          render: (c) => (
            <RowMenu
              cliente={c}
              onEdit={() => onRowClick?.(c)}
              onArchivar={() => onArchivar(c)}
              onReactivar={() => onReactivar(c)}
            />
          ),
        },
      ]}
      footer={
        <>
          <span>
            {rows.length} de {total} clientes
          </span>
          <div className="flex items-center gap-2">
            <IconButton
              size={26}
              label="Página anterior"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              {Icons.chevL}
            </IconButton>
            <span className="text-[11.5px] text-[var(--text-3)]">
              {page} / {totalPages}
            </span>
            <IconButton
              size={26}
              label="Página siguiente"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              {Icons.chevR}
            </IconButton>
          </div>
        </>
      }
    />
  );
}
