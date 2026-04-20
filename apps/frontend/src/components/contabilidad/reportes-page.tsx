'use client';

import { PageHeader, Card } from '@/components';
import { Icons } from '@/components/icons';

interface Reporte {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const REPORTES: Reporte[] = [
  { key: 'balance', title: 'Balance general', description: 'Activo, pasivo y patrimonio a la fecha', icon: Icons.bank },
  { key: 'resultados', title: 'Estado de resultados', description: 'Ingresos y egresos del período', icon: Icons.receipt },
  { key: 'mayor', title: 'Libro mayor', description: 'Movimientos detallados por cuenta', icon: Icons.task },
  { key: 'iva', title: 'Posición IVA', description: 'Débito, crédito y saldo del período', icon: Icons.event },
];

export function ReportesPage() {
  return (
    <>
      <PageHeader title="Reportes" subtitle="Informes contables disponibles" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTES.map((r) => (
          <Card key={r.key} className="h-full">
            <div className="p-5">
              <div className="w-10 h-10 rounded-lg bg-[var(--brand-softer)] text-[var(--brand)] flex items-center justify-center mb-4">
                {r.icon}
              </div>
              <div className="text-[15px] font-semibold text-[var(--text)] tracking-[-0.01em] mb-1">{r.title}</div>
              <div className="text-[12.5px] text-[var(--text-3)]">{r.description}</div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
