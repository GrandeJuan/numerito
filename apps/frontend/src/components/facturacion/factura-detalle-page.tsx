'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { Can } from '@/components/shared/can';
import { PageHeader } from '../page-header';
import { Card } from '../card';
import { Button } from '../button';
import { Pill } from '../pill';
import { formatCurrency, formatFecha } from '@/lib/formatters';
import type { Factura } from '@numerito/shared';

const ESTADO: Record<string, { tone: 'brand' | 'amber' | 'rose' | 'indigo'; label: string }> = {
  PAGADA: { tone: 'brand', label: 'Pagada' },
  PENDIENTE: { tone: 'amber', label: 'Pendiente' },
  VENCIDA: { tone: 'rose', label: 'Vencida' },
  PARCIAL: { tone: 'indigo', label: 'Parcial' },
};

export function FacturaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { estudioActual } = useAuth();
  const { data: factura, loading, error, refetch } = useFetchWithEstudio<Factura>(
    `/v1/facturacion/facturas/${id}`,
  );

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const [showPago, setShowPago] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoRef, setPagoRef] = useState('');
  const [pagoMedio, setPagoMedio] = useState('1');

  const handleAnular = useCallback(async () => {
    if (!confirm('¿Seguro que querés anular esta factura?')) return;
    setActing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await apiFetch(`/v1/facturacion/facturas/${id}/anular`, { method: 'PATCH' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${res.status}`);
      }
      setActionSuccess('Factura anulada correctamente.');
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al anular');
    } finally {
      setActing(false);
    }
  }, [id, refetch]);

  const handlePago = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setActing(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        const res = await apiFetch(`/v1/facturacion/facturas/${id}/pago`, {
          method: 'POST',
          body: JSON.stringify({
            monto: Number(pagoMonto),
            medioPagoId: Number(pagoMedio),
            referencia: pagoRef || undefined,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message ?? `Error ${res.status}`);
        }
        setActionSuccess('Pago registrado correctamente.');
        setShowPago(false);
        setPagoMonto('');
        setPagoRef('');
        refetch();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Error al registrar pago');
      } finally {
        setActing(false);
      }
    },
    [id, pagoMonto, pagoMedio, pagoRef, refetch],
  );

  const e = factura ? (ESTADO[factura.estado] ?? { tone: 'neutral' as const, label: factura.estado }) : null;

  const inputClass =
    'w-full h-9 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 text-[13px] text-[var(--text)] outline-none focus:border-[var(--brand)] transition-colors';
  const labelClass = 'block text-[12px] font-medium text-[var(--text-2)] mb-1.5';

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="receipt">
      <Can permission="VER_FACTURACION">
        <PageHeader
          title={factura ? `Factura ${factura.numero}` : 'Factura'}
          subtitle={factura?.cliente ?? ''}
          actions={
            <Button variant="ghost" onClick={() => router.push('/facturacion')}>
              ← Volver
            </Button>
          }
        />

        {actionError && (
          <div role="alert" className="mb-4 text-[12.5px] text-[var(--rose-ink)] bg-[var(--rose-soft)] border border-[var(--rose)] rounded-[8px] px-3 py-2">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div role="status" className="mb-4 text-[12.5px] text-[var(--brand-ink)] bg-[var(--brand-soft)] border border-[var(--brand)] rounded-[8px] px-3 py-2">
            {actionSuccess}
          </div>
        )}

        {factura && (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <Card>
              <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1">Número</div>
                    <div className="font-mono text-[14px] text-[var(--text)]">{factura.numero}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1">Estado</div>
                    {e && <Pill tone={e.tone} dot>{e.label}</Pill>}
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1">Cliente</div>
                    <div className="text-[13px] text-[var(--text)]">{factura.cliente}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1">Total</div>
                    <div className="font-mono text-[16px] font-semibold text-[var(--text)]">{formatCurrency(factura.total)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1">Fecha emisión</div>
                    <div className="font-mono text-[13px] text-[var(--text-2)]">{formatFecha(factura.fechaEmision ?? factura.fecha)}</div>
                  </div>
                  {factura.fechaVencimiento && (
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1">Vencimiento</div>
                      <div className="font-mono text-[13px] text-[var(--text-2)]">{formatFecha(factura.fechaVencimiento)}</div>
                    </div>
                  )}
                  {factura.saldo != null && (
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1">Saldo</div>
                      <div className="font-mono text-[14px] text-[var(--text)]">{formatCurrency(factura.saldo)}</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Card title="Acciones">
                <div className="space-y-2">
                  {factura.estado !== 'PAGADA' && (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setShowPago(true)}
                      disabled={acting}
                    >
                      Registrar pago
                    </Button>
                  )}
                  {factura.estado !== 'PAGADA' && (
                    <Button
                      variant="ghost"
                      className="w-full text-[var(--rose)]"
                      onClick={handleAnular}
                      disabled={acting}
                    >
                      Anular factura
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {showPago && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowPago(false)} />
            <div className="relative w-full max-w-sm bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-lg p-6">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-1">Registrar pago</h2>
              <p className="text-[12px] text-[var(--text-3)] mb-5">
                Saldo actual: {factura && formatCurrency(factura.saldo ?? factura.total)}
              </p>
              <form onSubmit={handlePago} className="space-y-4">
                <div>
                  <label htmlFor="pago-monto" className={labelClass}>Monto</label>
                  <input id="pago-monto" type="number" min="0.01" step="0.01" required value={pagoMonto} onChange={(e) => setPagoMonto(e.target.value)} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label htmlFor="pago-medio" className={labelClass}>Medio de pago</label>
                  <select id="pago-medio" required value={pagoMedio} onChange={(e) => setPagoMedio(e.target.value)} className={inputClass}>
                    <option value="1">Transferencia</option>
                    <option value="2">Efectivo</option>
                    <option value="3">Cheque</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pago-ref" className={labelClass}>Referencia (opcional)</label>
                  <input id="pago-ref" type="text" value={pagoRef} onChange={(e) => setPagoRef(e.target.value)} className={inputClass} placeholder="N° comprobante" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" type="button" onClick={() => setShowPago(false)}>Cancelar</Button>
                  <Button type="submit" disabled={acting}>{acting ? 'Registrando…' : 'Registrar pago'}</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Can>
    </PageStateGuard>
  );
}
