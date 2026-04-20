'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button, Pill, Card } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';
import { apiFetch } from '@/lib/api-client';

interface EstudioDetail {
  id: string;
  nombre: string;
  cuit: string;
  plan: string;
  maxClientes: number;
  maxUsuarios: number;
  isActive: boolean;
  createdAt: string;
}

export function EstudioDetailPage({ estudioId }: { estudioId: string }) {
  const router = useRouter();
  const { data, loading, error, refetch } = useFetch<EstudioDetail>(
    `/v1/admin/estudios/${estudioId}`,
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleToggleStatus() {
    if (!data) return;
    setActionLoading(true);
    setActionError(null);

    const action = data.isActive ? 'suspend' : 'reactivate';
    try {
      const res = await apiFetch(`/v1/admin/estudios/${estudioId}/${action}`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${res.status}`);
      }
      refetch();
    } catch (err: any) {
      setActionError(err.message ?? 'Error al cambiar estado');
    } finally {
      setActionLoading(false);
    }
  }

  const labelClass = 'text-[11.5px] text-[var(--text-3)] uppercase tracking-wide';
  const valueClass = 'text-[13px] text-[var(--text)] font-medium mt-0.5';

  return (
    <>
      <PageHeader
        title={data?.nombre ?? 'Estudio'}
        subtitle={data ? `CUIT ${data.cuit}` : ''}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push('/admin/estudios')}>
              ← Volver
            </Button>
            {data && (
              <Button
                variant={data.isActive ? 'ghost' : 'primary'}
                onClick={handleToggleStatus}
                disabled={actionLoading}
              >
                {actionLoading
                  ? 'Procesando…'
                  : data.isActive
                    ? 'Suspender'
                    : 'Reactivar'}
              </Button>
            )}
          </div>
        }
      />

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 mb-4">
          {actionError}
        </div>
      )}

      <PageStateGuard loading={loading} error={error}>
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="p-5 space-y-4">
                <h3 className="text-[13px] font-semibold text-[var(--text)]">Información general</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={labelClass}>Nombre</div>
                    <div className={valueClass}>{data.nombre}</div>
                  </div>
                  <div>
                    <div className={labelClass}>CUIT</div>
                    <div className={`${valueClass} font-mono`}>{data.cuit}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Estado</div>
                    <div className="mt-1">
                      <Pill tone={data.isActive ? 'brand' : 'neutral'} dot>
                        {data.isActive ? 'Activo' : 'Suspendido'}
                      </Pill>
                    </div>
                  </div>
                  <div>
                    <div className={labelClass}>Creado</div>
                    <div className={`${valueClass} font-mono`}>{data.createdAt.slice(0, 10)}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-5 space-y-4">
                <h3 className="text-[13px] font-semibold text-[var(--text)]">Plan y límites</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={labelClass}>Plan</div>
                    <div className="mt-1">
                      <Pill tone="indigo">{data.plan}</Pill>
                    </div>
                  </div>
                  <div>
                    <div className={labelClass}>Máx. clientes</div>
                    <div className={valueClass}>{data.maxClientes}</div>
                  </div>
                  <div>
                    <div className={labelClass}>Máx. usuarios</div>
                    <div className={valueClass}>{data.maxUsuarios}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </PageStateGuard>
    </>
  );
}
