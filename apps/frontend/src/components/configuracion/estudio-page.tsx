'use client';

import { Card, Section, KpiCard } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';

interface EstudioData {
  nombre: string;
  cuit: string;
  condicionIva: string;
}

interface PlanData {
  nombre: string;
  estado: string;
  clientesActuales: number;
  clientesMax: number;
  usuariosActuales: number;
  usuariosMax: number;
}

const FIELD_LABEL =
  'text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1.5 block font-medium';
const FIELD_VALUE = 'text-[14px] text-[var(--text)] mono';

export function EstudioConfigPage() {
  const meRes = useFetchWithEstudio<EstudioData>('/v1/estudios/me');
  const planRes = useFetchWithEstudio<PlanData>('/v1/estudios/plan');
  const loading = meRes.loading || planRes.loading;
  const error = meRes.error ?? planRes.error;

  return (
    <PageStateGuard loading={loading} error={error}>
      {meRes.data && (
        <Card>
          <Section title="Identificación" subtitle="Datos fiscales del estudio">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className={FIELD_LABEL}>Razón social</div>
                <div className={FIELD_VALUE}>{meRes.data.nombre}</div>
              </div>
              <div>
                <div className={FIELD_LABEL}>CUIT</div>
                <div className={FIELD_VALUE}>{meRes.data.cuit}</div>
              </div>
              <div>
                <div className={FIELD_LABEL}>Condición IVA</div>
                <div className={FIELD_VALUE}>{meRes.data.condicionIva.replace(/_/g, ' ')}</div>
              </div>
            </div>
          </Section>
        </Card>
      )}

      {planRes.data && (
        <>
          <div className="h-5" />
          <Section title="Plan y consumo" subtitle="Uso actual contra los límites del plan">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Plan" value={planRes.data.nombre} />
              <KpiCard
                label="Estado"
                value={planRes.data.estado.replace(/_/g, ' ')}
                delta={{
                  text: planRes.data.estado === 'ACTIVO' ? 'OK' : 'atención',
                  tone: planRes.data.estado === 'ACTIVO' ? 'brand' : 'amber',
                }}
              />
              <KpiCard
                label="Clientes"
                value={`${planRes.data.clientesActuales}/${planRes.data.clientesMax}`}
              />
              <KpiCard
                label="Usuarios"
                value={`${planRes.data.usuariosActuales}/${planRes.data.usuariosMax}`}
              />
            </div>
          </Section>
        </>
      )}
    </PageStateGuard>
  );
}
