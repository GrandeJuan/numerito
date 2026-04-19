'use client';

import { KpiCard } from '../kpi-card';
import { formatCurrency } from '@/lib/formatters';

const moneyK = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${Math.round(n / 1_000)}k` : `$${n}`;

export interface FacturacionKpisProps {
  facturado: number;
  cobrado: number;
  vencidas: number;
  vencidasMonto: number;
  pendientesCount: number;
  deltaFacturado?: number;
}

export function FacturacionKpis({
  facturado,
  cobrado,
  vencidas,
  vencidasMonto,
  pendientesCount,
  deltaFacturado,
}: FacturacionKpisProps) {
  const pct = facturado > 0 ? Math.round((cobrado / facturado) * 100) : 0;
  const saldo = Math.max(0, facturado - cobrado);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <KpiCard
        label="Facturado 12m"
        value={moneyK(facturado)}
        title={formatCurrency(facturado)}
        delta={
          deltaFacturado !== undefined
            ? {
                tone: deltaFacturado >= 0 ? 'brand' : 'rose',
                text: `${deltaFacturado >= 0 ? '▲' : '▼'} ${Math.abs(deltaFacturado).toFixed(1)}%`,
              }
            : undefined
        }
      />
      <KpiCard
        label="Cobrado"
        value={moneyK(cobrado)}
        title={formatCurrency(cobrado)}
        delta={{ tone: 'brand', text: `${pct}%` }}
      />
      <KpiCard
        label="Saldo pendiente"
        value={moneyK(saldo)}
        title={formatCurrency(saldo)}
        delta={pendientesCount > 0 ? { tone: 'amber', text: `${pendientesCount} facturas` } : undefined}
      />
      <KpiCard
        label="Vencidas"
        value={vencidas}
        delta={vencidas > 0 ? { tone: 'rose', text: formatCurrency(vencidasMonto) } : undefined}
      />
    </div>
  );
}
