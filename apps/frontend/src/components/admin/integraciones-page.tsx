'use client';

import { PageHeader, Card, Pill, Button } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';

interface IntegracionGlobal {
  key: string;
  nombre: string;
  descripcion: string;
  estado: 'OK' | 'DEGRADADO' | 'CAIDO';
  latenciaMs?: number;
  ultimoEvento?: string;
  estudiosAfectados?: number;
}

const TONE: Record<IntegracionGlobal['estado'], 'brand' | 'amber' | 'rose'> = {
  OK: 'brand',
  DEGRADADO: 'amber',
  CAIDO: 'rose',
};

export function IntegracionesAdminPage() {
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<IntegracionGlobal[]>('/v1/admin/integraciones');

  return (
    <>
      <PageHeader title="Integraciones" subtitle="Estado global de conexiones externas" />
      <PageStateGuard loading={loading} error={error}>
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((i) => (
              <Card key={i.key}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[15px] font-semibold text-[var(--text)] tracking-[-0.01em]">{i.nombre}</div>
                      <div className="text-[12.5px] text-[var(--text-3)] mt-0.5">{i.descripcion}</div>
                    </div>
                    <Pill tone={TONE[i.estado]} small>{i.estado}</Pill>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[11.5px] text-[var(--text-3)] pt-3 border-t border-[var(--border)]">
                    <div>
                      <div className="uppercase tracking-[0.08em] text-[10px] mb-1">Latencia</div>
                      <div className="mono text-[13px] text-[var(--text)]">{i.latenciaMs != null ? `${i.latenciaMs}ms` : '—'}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-[0.08em] text-[10px] mb-1">Último evento</div>
                      <div className="mono text-[13px] text-[var(--text)]">{i.ultimoEvento ?? '—'}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-[0.08em] text-[10px] mb-1">Afectados</div>
                      <div className="mono text-[13px] text-[var(--text)]">{i.estudiosAfectados ?? 0}</div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="ghost" size="sm">Ver detalle</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageStateGuard>
    </>
  );
}
