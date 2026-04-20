'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { Can } from '@/components/shared/can';
import type { Factura, Cliente } from '@numerito/shared';

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

function exportFacturasCsv(rows: Factura[]) {
  const lines: string[] = ['Número,Cliente,Fecha,Monto,Estado'];
  for (const f of rows) {
    lines.push(`"${f.numero}","${f.cliente}","${f.fecha}","${f.total}","${f.estado}"`);
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `facturas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FacturacionPage() {
  const { estudioActual } = useAuth();
  const router = useRouter();
  const statsRes = useFetchWithEstudio<BackendStats>('/v1/facturacion/stats');
  const facturasRes = useFetchWithEstudio<Factura[]>('/v1/facturacion/facturas');
  const { data: clientes } = useFetchWithEstudio<Cliente[]>('/v1/clientes');
  const loading = statsRes.loading || facturasRes.loading;
  const error = statsRes.error ?? facturasRes.error;
  const [showNueva, setShowNueva] = useState(false);

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
              <Button variant="ghost" icon={Icons.download} onClick={() => data && exportFacturasCsv(data.facturas)}>
                Exportar
              </Button>
              <Button variant="brand" icon={Icons.plus} onClick={() => setShowNueva(true)}>
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

            <FacturasTable rows={data.facturas} onRowClick={(f) => router.push(`/facturacion/${f.id}`)} />
          </>
        )}
      </Can>

      {showNueva && (
        <NuevaFacturaModal
          clientes={clientes ?? []}
          onClose={() => setShowNueva(false)}
          onSuccess={() => {
            setShowNueva(false);
            facturasRes.refetch();
            statsRes.refetch();
          }}
        />
      )}
    </PageStateGuard>
  );
}

function NuevaFacturaModal({
  clientes,
  onClose,
  onSuccess,
}: {
  clientes: Cliente[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clienteId, setClienteId] = useState('');
  const [numero, setNumero] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [concepto, setConcepto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [alicuotaIva, setAlicuotaIva] = useState('21');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await apiFetch('/v1/facturacion/facturas', {
        method: 'POST',
        body: JSON.stringify({
          clienteId,
          numero,
          fechaEmision,
          fechaVencimiento,
          concepto,
          lineas: [
            {
              descripcion: descripcion || concepto,
              cantidad: Number(cantidad) || 1,
              precioUnitario: Number(precioUnitario) || 0,
              alicuotaIva: Number(alicuotaIva) || 21,
            },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${res.status}`);
      }
      onSuccess();
    } catch (err: any) {
      setFormError(err.message ?? 'Error al crear factura');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full h-9 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 text-[13px] text-[var(--text)] outline-none focus:border-[var(--brand)] transition-colors';
  const labelClass = 'block text-[12px] font-medium text-[var(--text-2)] mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-1">Nueva factura</h2>
        <p className="text-[12px] text-[var(--text-3)] mb-5">Emitir una nueva factura al cliente.</p>

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fact-cliente" className={labelClass}>Cliente</label>
            <select id="fact-cliente" required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={inputClass}>
              <option value="">Seleccionar cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.razonSocial} ({c.cuit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="fact-numero" className={labelClass}>Número</label>
              <input id="fact-numero" type="text" required value={numero} onChange={(e) => setNumero(e.target.value)} className={inputClass} placeholder="A-001-00000001" />
            </div>
            <div>
              <label htmlFor="fact-emision" className={labelClass}>Emisión</label>
              <input id="fact-emision" type="date" required value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="fact-venc" className={labelClass}>Vencimiento</label>
              <input id="fact-venc" type="date" required value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="fact-concepto" className={labelClass}>Concepto</label>
            <input id="fact-concepto" type="text" required value={concepto} onChange={(e) => setConcepto(e.target.value)} className={inputClass} placeholder="Servicios profesionales" />
          </div>

          <fieldset className="border border-[var(--border)] rounded-lg p-3">
            <legend className="text-[11px] font-medium text-[var(--text-3)] px-1">Línea de factura</legend>
            <div className="space-y-3">
              <div>
                <label htmlFor="fact-desc" className={labelClass}>Descripción</label>
                <input id="fact-desc" type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClass} placeholder="Descripción del ítem (opcional, usa concepto)" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="fact-qty" className={labelClass}>Cantidad</label>
                  <input id="fact-qty" type="number" min="1" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="fact-precio" className={labelClass}>Precio unitario</label>
                  <input id="fact-precio" type="number" min="0" step="0.01" required value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label htmlFor="fact-iva" className={labelClass}>Alícuota IVA %</label>
                  <input id="fact-iva" type="number" min="0" step="0.5" required value={alicuotaIva} onChange={(e) => setAlicuotaIva(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creando…' : 'Crear factura'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
