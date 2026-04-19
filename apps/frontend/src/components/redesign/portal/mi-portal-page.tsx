'use client';

import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { PageHeader } from '../page-header';
import { KpiCard } from '../kpi-card';
import { Card } from '../card';
import { Pill } from '../pill';
import { Avatar } from '../avatar';
import { formatFecha, formatCurrency } from '@/lib/formatters';

interface PortalData {
  proximosVencimientos: number;
  documentosRecientes: number;
  saldoPendiente: number;
  contador?: { nombre: string; email: string; telefono?: string };
  proximos: Array<{ id: string; titulo: string; fecha: string; tipo: string }>;
}

export function MiPortalPage() {
  const { user, estudioActual } = useAuth();
  const { data, loading, error } = useFetchWithEstudio<PortalData>('/v1/portal/stats');

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="home">
      <PageHeader
        title={`Hola, ${user?.nombre?.split(' ')[0] ?? ''}`}
        subtitle="Resumen de tu situación"
      />

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <KpiCard
              label="Próximos vencimientos"
              value={data.proximosVencimientos}
              delta={{ tone: 'amber', text: '30 días' }}
            />
            <KpiCard label="Documentos recientes" value={data.documentosRecientes} />
            <KpiCard
              label="Saldo pendiente"
              value={formatCurrency(data.saldoPendiente)}
              delta={data.saldoPendiente > 0 ? { tone: 'rose', text: 'Pagar' } : undefined}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3.5">
            {data.contador && (
              <Card title="Mi contador" subtitle="Tu responsable en el estudio">
                <div className="flex items-center gap-3">
                  <Avatar name={data.contador.nombre} size={48} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[var(--text)]">
                      {data.contador.nombre}
                    </div>
                    <div className="text-[12px] text-[var(--text-3)] font-mono truncate">
                      {data.contador.email}
                    </div>
                    {data.contador.telefono && (
                      <div className="text-[12px] text-[var(--text-3)] font-mono">
                        {data.contador.telefono}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <Card title="Próximos eventos" subtitle="Obligaciones y documentos">
              {data.proximos.length === 0 ? (
                <p className="text-[var(--text-3)] text-[12.5px]">Sin eventos próximos.</p>
              ) : (
                data.proximos.slice(0, 5).map((e, i, a) => (
                  <div
                    key={e.id}
                    className={`flex items-center gap-3 py-2.5 ${
                      i < a.length - 1 ? 'border-b border-[var(--border)]' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-[var(--text)] truncate">
                        {e.titulo}
                      </div>
                      <div className="text-[11px] text-[var(--text-3)]">{e.tipo}</div>
                    </div>
                    <Pill tone="amber" dot>
                      {formatFecha(e.fecha)}
                    </Pill>
                  </div>
                ))
              )}
            </Card>
          </div>
        </>
      )}
    </PageStateGuard>
  );
}
