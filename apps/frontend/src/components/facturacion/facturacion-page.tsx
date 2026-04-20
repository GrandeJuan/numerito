'use client';

import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { Can } from '@/components/shared/can';
import type { Factura } from '@numerito/shared';

import { PageHeader } from '../page-header';
import { Button } from '../button';
import { Icons } from '../icons';

import { FacturacionKpis } from './facturacion-kpis';
import { FacturacionChartCard, type FacturacionPoint } from './facturacion-chart-card';
import { EstadoDonutCard } from './estado-donut-card';
import { FacturasTable } from './facturas-table';

interface FacturacionStats {
  serie: FacturacionPoint[];
  porEstado: { estado: string; count: number }[];
  kpis: {
    facturado: number;
    cobrado: number;
    vencidas: number;
    vencidasMonto: number;
    pendientesCount: number;
    deltaFacturado?: number;
  };
  facturas: Factura[];
}

const ESTADO_COLOR: Record<string, string> = {
  PAGADA: 'var(--brand)',
  PENDIENTE: 'var(--amber)',
  VENCIDA: 'var(--rose)',
  PARCIAL: 'var(--indigo)',
};
const ESTADO_LABEL: Record<string, string> = {
  PAGADA: 'Pagada',
  PENDIENTE: 'Pendiente',
  VENCIDA: 'Vencida',
  PARCIAL: 'Parcial',
};

interface BackendStats {
  facturado: number;
  cobrado: number;
  cobradoPorcentaje: number;
  saldoPendiente: number;
  facturasVencidas: number;
  porEstado: { estado: string; count: number; monto?: number }[];
  mensual: FacturacionPoint[];
}

export function FacturacionPage() {
  const { estudioActual } = useAuth();
  const statsRes = useFetchWithEstudio<BackendStats>('/v1/facturacion/stats');
  const facturasRes = useFetchWithEstudio<Factura[]>('/v1/facturacion/facturas');
  const loading = statsRes.loading || facturasRes.loading;
  const error = statsRes.error ?? facturasRes.error;

  const data: FacturacionStats | null = statsRes.data
    ? {
        serie: statsRes.data.mensual ?? [],
        porEstado: statsRes.data.porEstado ?? [],
        kpis: {
          facturado: statsRes.data.facturado,
          cobrado: statsRes.data.cobrado,
          vencidas: statsRes.data.facturasVencidas,
          vencidasMonto: statsRes.data.porEstado?.find((e) => e.estado === 'VENCIDA')?.monto ?? 0,
          pendientesCount:
            statsRes.data.porEstado?.find((e) => e.estado === 'PENDIENTE')?.count ?? 0,
        },
        facturas: facturasRes.data ?? [],
      }
    : null;

  const slices = (data?.porEstado ?? []).map((s) => ({
    label: ESTADO_LABEL[s.estado] ?? s.estado,
    count: s.count,
    color: ESTADO_COLOR[s.estado] ?? 'var(--text-3)',
  }));

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="receipt">
      <Can permission="VER_FACTURACION">
        <PageHeader
          title="Facturación"
          subtitle="Gestión de facturación y cobranzas"
          actions={
            <>
              <Button variant="ghost" icon={Icons.download}>
                Exportar
              </Button>
              <Button variant="brand" icon={Icons.plus}>
                Nueva factura
              </Button>
            </>
          }
        />

        {data && (
          <>
            <FacturacionKpis {...data.kpis} />

            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3.5 mb-4">
              <FacturacionChartCard data={data.serie} />
              <EstadoDonutCard slices={slices} />
            </div>

            <FacturasTable rows={data.facturas} />
          </>
        )}
      </Can>
    </PageStateGuard>
  );
}
