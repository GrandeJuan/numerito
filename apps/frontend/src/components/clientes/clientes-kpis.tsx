'use client';

import { KpiCard } from '../kpi-card';
import type { Cliente } from '@numerito/shared';
import { formatCurrency } from '@/lib/formatters';

const moneyK = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${Math.round(n / 1_000)}k` : `$${n}`;

export function ClientesKpis({ rows }: { rows: Cliente[] }) {
  const total = rows.length;
  const empresas = rows.filter((c) => c.tipo === 'EMPRESA').length;
  const monotrib = rows.filter((c) => c.condicionIva === 'MONOTRIBUTO').length;
  const saldo = rows.reduce((s, c) => s + (c.saldo ?? 0), 0);
  const conDeuda = rows.filter((c) => (c.saldo ?? 0) > 0).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <KpiCard label="Total clientes" value={total} />
      <KpiCard label="Empresas" value={empresas} />
      <KpiCard label="Monotributistas" value={monotrib} />
      <KpiCard
        label="Saldo total"
        value={<span title={formatCurrency(saldo)}>{moneyK(saldo)}</span>}
        delta={conDeuda > 0 ? { tone: 'amber', text: `${conDeuda} con deuda` } : undefined}
      />
    </div>
  );
}
