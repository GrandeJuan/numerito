'use client';

import { PageHeader, KpiCard, Card } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';

interface ContabilidadStats {
  asientosDelPeriodo: number;
  librosRubricados: number;
  totalLibros: number;
  balanceCuadrado: boolean;
  libros: Array<{ id: string; nombre: string; rubricado: boolean }>;
  mensualDebeHaber: Array<{ mes: string; debe: number; haber: number }>;
  asientosRecientes: Array<{ id: string; fecha: string; concepto: string; monto: number }>;
}

export function ContabilidadPage() {
  const { data, loading, error } = useFetchWithEstudio<ContabilidadStats>('/v1/contabilidad/stats');

  return (
    <>
      <PageHeader title="Contabilidad" subtitle="Libros, asientos y cierre contable" />
      <PageStateGuard loading={loading} error={error}>
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard label="Asientos del período" value={String(data.asientosDelPeriodo)} />
              <KpiCard
                label="Libros rubricados"
                value={`${data.librosRubricados}/${data.totalLibros}`}
              />
              <KpiCard label="Total libros" value={String(data.totalLibros)} />
              <KpiCard
                label="Balance"
                value={data.balanceCuadrado ? 'Cuadrado' : 'Sin cuadrar'}
                delta={{
                  text: data.balanceCuadrado ? 'OK' : 'revisar',
                  tone: data.balanceCuadrado ? 'brand' : 'rose',
                }}
              />
            </div>
            <Card title="Libros contables">
              {data.libros.length === 0 ? (
                <div className="p-6 text-[13px] text-[var(--text-3)] text-center">
                  No hay libros cargados.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {data.libros.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between px-4 py-3 text-[13px]"
                    >
                      <span className="text-[var(--text)]">{l.nombre}</span>
                      <span
                        className="text-[11.5px]"
                        style={{ color: l.rubricado ? 'var(--brand)' : 'var(--text-3)' }}
                      >
                        {l.rubricado ? 'Rubricado' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </PageStateGuard>
    </>
  );
}
