'use client';

import { useAuth } from '@/lib/auth-context';
import { useFetch } from '@/lib/use-fetch';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { PageHeader } from '../page-header';
import { KpiCard } from '../kpi-card';
import { Card } from '../card';
import { Pill } from '../pill';
import { formatFecha, formatCurrency } from '@/lib/formatters';

interface VencimientoReciente {
  id: string;
  obligacion: string;
  fecha: string;
  estado: string;
}

interface FacturaReciente {
  id: string;
  numero: string;
  monto: number;
  estado: string;
  fecha: string;
}

interface DocumentoReciente {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
}

interface PortalStats {
  clienteNombre: string;
  kpis: {
    vencimientosPendientes: number;
    facturasPendientes: number;
    documentos: number;
  };
  vencimientosRecientes: VencimientoReciente[];
  facturasRecientes: FacturaReciente[];
  documentosRecientes: DocumentoReciente[];
}

export function MiPortalPage() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch<PortalStats>('/v1/portal/dashboard/stats');

  return (
    <PageStateGuard loading={loading} error={error} icon="home">
      <PageHeader
        title={`Hola, ${user?.nombre?.split(' ')[0] ?? ''}`}
        subtitle={
          data?.clienteNombre ? `Portal de ${data.clienteNombre}` : 'Resumen de tu situación'
        }
      />

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <KpiCard
              label="Vencimientos pendientes"
              value={data.kpis.vencimientosPendientes}
              delta={
                data.kpis.vencimientosPendientes > 0
                  ? { tone: 'amber', text: 'pendientes' }
                  : { tone: 'brand', text: 'al día' }
              }
            />
            <KpiCard
              label="Facturas pendientes"
              value={data.kpis.facturasPendientes}
              delta={
                data.kpis.facturasPendientes > 0
                  ? { tone: 'rose', text: 'pagar' }
                  : { tone: 'brand', text: 'al día' }
              }
            />
            <KpiCard label="Documentos" value={data.kpis.documentos} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-4">
            <Card title="Próximos vencimientos" subtitle="Obligaciones activas">
              {data.vencimientosRecientes.length === 0 ? (
                <p className="text-[var(--text-3)] text-[12.5px]">Sin vencimientos próximos.</p>
              ) : (
                data.vencimientosRecientes.slice(0, 5).map((v, i, arr) => (
                  <div
                    key={v.id}
                    className={`grid grid-cols-[2fr_1fr_auto] gap-2.5 py-2.5 items-center ${
                      i < arr.length - 1 ? 'border-b border-[var(--border)]' : ''
                    }`}
                  >
                    <div className="text-[12.5px] font-medium text-[var(--text)] truncate">
                      {v.obligacion}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--text-3)]">
                      {formatFecha(v.fecha)}
                    </div>
                    <Pill tone={v.estado.toUpperCase() === 'VENCIDO' ? 'rose' : 'amber'} dot>
                      {v.estado.toUpperCase() === 'VENCIDO' ? 'Vencido' : 'Pendiente'}
                    </Pill>
                  </div>
                ))
              )}
            </Card>

            <Card title="Facturas recientes" subtitle="Últimos movimientos">
              {data.facturasRecientes.length === 0 ? (
                <p className="text-[var(--text-3)] text-[12.5px]">Sin facturas recientes.</p>
              ) : (
                data.facturasRecientes.slice(0, 5).map((f, i, arr) => (
                  <div
                    key={f.id}
                    className={`grid grid-cols-[1fr_1fr_auto_auto] gap-2.5 py-2.5 items-center ${
                      i < arr.length - 1 ? 'border-b border-[var(--border)]' : ''
                    }`}
                  >
                    <div className="font-mono text-[11.5px] text-[var(--text-2)]">{f.numero}</div>
                    <div className="font-mono text-[11px] text-[var(--text-3)]">
                      {formatFecha(f.fecha)}
                    </div>
                    <div className="font-mono text-[12.5px] text-[var(--text)] text-right">
                      {formatCurrency(f.monto)}
                    </div>
                    <Pill
                      tone={
                        f.estado.toUpperCase() === 'PAGADA'
                          ? 'brand'
                          : f.estado.toUpperCase() === 'VENCIDA'
                            ? 'rose'
                            : 'amber'
                      }
                      dot
                    >
                      {f.estado}
                    </Pill>
                  </div>
                ))
              )}
            </Card>
          </div>

          <Card title="Documentos recientes" subtitle="Compartidos por el estudio">
            {data.documentosRecientes.length === 0 ? (
              <p className="text-[var(--text-3)] text-[12.5px]">Sin documentos recientes.</p>
            ) : (
              data.documentosRecientes.slice(0, 5).map((d, i, arr) => (
                <div
                  key={d.id}
                  className={`grid grid-cols-[2fr_1fr_auto] gap-2.5 py-2.5 items-center ${
                    i < arr.length - 1 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  <div className="text-[12.5px] font-medium text-[var(--text)] truncate">
                    {d.nombre}
                  </div>
                  <Pill tone="indigo">{d.tipo}</Pill>
                  <div className="font-mono text-[11px] text-[var(--text-3)]">
                    {formatFecha(d.fecha)}
                  </div>
                </div>
              ))
            )}
          </Card>
        </>
      )}
    </PageStateGuard>
  );
}
