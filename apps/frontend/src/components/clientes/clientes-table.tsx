'use client';

import { DataTable } from '../data-table';
import { Pill } from '../pill';
import { IconButton } from '../icon-button';
import { Icons } from '../icons';
import type { Cliente } from '@numerito/shared';
import { formatCurrency } from '@/lib/formatters';

const TIPO: Record<string, string> = { EMPRESA: 'Empresa', PERSONA_FISICA: 'Persona Física' };
const IVA: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: 'Resp. Inscripto',
  MONOTRIBUTO: 'Monotributo',
  EXENTO: 'Exento',
};

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
  onRowClick?(c: Cliente): void;
}

export function ClientesTable({ rows, total, onRowClick }: ClientesTableProps) {
  return (
    <DataTable<Cliente>
      rows={rows}
      onRowClick={onRowClick}
      columns={[
        {
          header: 'Razón Social',
          render: (c) => (
            <span className="text-[var(--text)] font-medium">{c.razonSocial}</span>
          ),
        },
        {
          header: 'CUIT',
          render: (c) => (
            <span className="font-mono text-[11.5px] text-[var(--text-2)]">{c.cuit}</span>
          ),
        },
        { header: 'Tipo', render: (c) => <Pill tone="indigo">{TIPO[c.tipo] ?? c.tipo}</Pill> },
        {
          header: 'Condición IVA',
          render: (c) => <Pill tone="blue">{IVA[c.condicionIva] ?? c.condicionIva}</Pill>,
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
            <IconButton size={26} label="Acciones" onClick={() => console.log('more', c.id)}>
              {Icons.more}
            </IconButton>
          ),
        },
      ]}
      footer={
        <>
          <span>
            {rows.length} de {total} clientes
          </span>
          <div className="flex gap-1">
            <IconButton size={26}>{Icons.chevL}</IconButton>
            <IconButton size={26}>{Icons.chevR}</IconButton>
          </div>
        </>
      }
    />
  );
}
