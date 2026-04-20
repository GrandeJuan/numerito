'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { PageHeader } from '../page-header';
import { Card } from '../card';
import { Button } from '../button';
import { Pill } from '../pill';
import { DataTable } from '../data-table';
import { Icons } from '../icons';
import { formatFecha } from '@/lib/formatters';
import type { Cliente, Obligacion } from '@numerito/shared';

const ESTADO_VENC: Record<string, { tone: 'amber' | 'rose' | 'brand'; label: string }> = {
  PENDIENTE: { tone: 'amber', label: 'Pendiente' },
  VENCIDO: { tone: 'rose', label: 'Vencido' },
  PRESENTADO: { tone: 'brand', label: 'Presentado' },
};

function currentPeriodo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 2).padStart(2, '0'); // next month
  return m === '13' ? `${y + 1}-01` : `${y}-${m}`;
}

export function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { estudioActual } = useAuth();
  const {
    data: cliente,
    loading,
    error,
    refetch: refetchCliente,
  } = useFetchWithEstudio<Cliente>(`/v1/clientes/${id}`);

  const {
    data: vencimientosRaw,
    loading: loadingVenc,
    refetch: refetchVenc,
  } = useFetchWithEstudio<Obligacion[]>(`/v1/vencimientos?clienteId=${id}&limit=100`);

  const vencimientos = vencimientosRaw ?? [];

  const [proyectando, setProyectando] = useState(false);
  const [proyeccionResult, setProyeccionResult] = useState<{
    proyectados: number;
    omitidos: number;
    errores: string[];
  } | null>(null);
  const [proyeccionError, setProyeccionError] = useState<string | null>(null);

  const handleProyectar = useCallback(async () => {
    setProyectando(true);
    setProyeccionResult(null);
    setProyeccionError(null);
    try {
      const periodo = currentPeriodo();
      const res = await apiFetch('/v1/vencimientos/calendario/proyectar', {
        method: 'POST',
        body: JSON.stringify({ clienteId: id, periodo }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${res.status}`);
      }
      const body = await res.json();
      setProyeccionResult(body.data);
      refetchVenc();
    } catch (err) {
      setProyeccionError(err instanceof Error ? err.message : 'Error al proyectar');
    } finally {
      setProyectando(false);
    }
  }, [id, refetchVenc]);

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="users">
      <PageHeader
        title={cliente?.razonSocial ?? 'Cliente'}
        subtitle={cliente?.cuit}
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push('/clientes')}>
              Volver
            </Button>
            <Button
              variant="brand"
              icon={Icons.calendar}
              disabled={proyectando}
              onClick={handleProyectar}
            >
              {proyectando ? 'Proyectando...' : 'Proyectar calendario'}
            </Button>
          </>
        }
      />

      {/* Projection feedback */}
      {proyeccionError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
          {proyeccionError}
        </div>
      )}
      {proyeccionResult && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
          Calendario proyectado: {proyeccionResult.proyectados} nuevo(s)
          {proyeccionResult.omitidos > 0 && `, ${proyeccionResult.omitidos} ya existente(s)`}
          {proyeccionResult.errores.length > 0 && (
            <ul className="mt-1 list-disc pl-4">
              {proyeccionResult.errores.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Client info */}
      {cliente && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card title="Datos generales">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-[var(--text-3)]">CUIT</dt>
              <dd className="text-[var(--text)]">{cliente.cuit}</dd>
              <dt className="text-[var(--text-3)]">Condici&oacute;n IVA</dt>
              <dd className="text-[var(--text)]">{cliente.condicionIva}</dd>
              <dt className="text-[var(--text-3)]">Tipo</dt>
              <dd className="text-[var(--text)]">{cliente.tipo}</dd>
              <dt className="text-[var(--text-3)]">Responsable</dt>
              <dd className="text-[var(--text)]">{cliente.responsable ?? '—'}</dd>
            </dl>
          </Card>
          <Card title="Perfil fiscal">
            {(cliente as any).inscripciones?.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {((cliente as any).inscripciones as Array<{ jurisdiccion: string; regimen: string; activa: boolean }>).map(
                  (ins, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Pill tone={ins.activa ? 'brand' : 'amber'} dot>
                        {ins.jurisdiccion}
                      </Pill>
                      <span className="text-[var(--text-2)]">{ins.regimen}</span>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="text-sm text-[var(--text-3)]">
                Sin inscripciones configuradas. Configure el perfil fiscal para proyectar el
                calendario.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Vencimientos table */}
      <Card
        title="Vencimientos"
        subtitle={`${vencimientos.length} vencimiento(s)`}
        padding={0}
      >
        <DataTable<Obligacion>
          rows={vencimientos}
          columns={[
            {
              header: 'Obligaci\u00f3n',
              render: (o) => (
                <span className="text-[var(--text)] font-medium">{o.tipo}</span>
              ),
            },
            {
              header: 'Per\u00edodo',
              render: (o) => (
                <span className="font-mono text-[11.5px] text-[var(--text-2)]">
                  {o.periodo}
                </span>
              ),
            },
            {
              header: 'Vencimiento',
              render: (o) => (
                <span className="font-mono text-[11.5px] text-[var(--text-2)]">
                  {formatFecha(o.fecha)}
                </span>
              ),
            },
            {
              header: 'Estado',
              render: (o) => {
                const e = ESTADO_VENC[o.estado] ?? { tone: 'amber' as const, label: o.estado };
                return (
                  <Pill tone={e.tone} dot>
                    {e.label}
                  </Pill>
                );
              },
            },
          ]}
        />
      </Card>
    </PageStateGuard>
  );
}
