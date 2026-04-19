'use client';

import { PageHeader, Card, Button, Pill } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';

interface Integracion {
  key: string;
  nombre: string;
  descripcion: string;
  estado: 'CONECTADO' | 'DESCONECTADO' | 'ERROR';
  ultimaSincro?: string;
}

const ESTADO_TONE: Record<Integracion['estado'], 'brand' | 'neutral' | 'rose'> = {
  CONECTADO: 'brand',
  DESCONECTADO: 'neutral',
  ERROR: 'rose',
};

const ESTADO_LABEL: Record<Integracion['estado'], string> = {
  CONECTADO: 'Conectado',
  DESCONECTADO: 'No conectado',
  ERROR: 'Error',
};

export function IntegracionesPage() {
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<Integracion[]>('/v1/estudio/integraciones');

  return (
    <>
      <PageHeader title="Integraciones" subtitle="Conexiones con servicios externos" />
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
                    <Pill tone={ESTADO_TONE[i.estado]} small>{ESTADO_LABEL[i.estado]}</Pill>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <span className="text-[11.5px] text-[var(--text-3)]">
                      {i.ultimaSincro ? `Última sincro · ${i.ultimaSincro}` : 'Sin actividad'}
                    </span>
                    <Button variant={i.estado === 'CONECTADO' ? 'ghost' : 'primary'} size="sm">
                      {i.estado === 'CONECTADO' ? 'Configurar' : 'Conectar'}
                    </Button>
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
