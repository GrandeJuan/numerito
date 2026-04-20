'use client';

import { useState, useCallback } from 'react';
import type { Obligacion, Cliente } from '@numerito/shared';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';
import { PageStateGuard } from '@/components/shared/page-state-guard';

import { PageHeader } from '../page-header';
import { Button } from '../button';
import { Icons } from '../icons';

import { VencimientosKpis } from './vencimientos-kpis';
import { CalendarGrid } from './calendar-grid';
import { VencimientosTable } from './vencimientos-table';

interface VencimientoApi {
  id: string;
  clienteId: string;
  cliente: string;
  tipoObligacion: string;
  periodo: string;
  fechaVencimiento: string;
  descripcion?: string;
  estado: 'PENDIENTE' | 'PRESENTADO' | 'VENCIDO';
  monto?: number;
  responsable?: string | null;
}

function exportVencimientosCsv(items: Obligacion[]) {
  const rows: string[] = ['Cliente,Obligación,Período,Vencimiento,Estado'];
  for (const o of items) {
    rows.push(`"${o.cliente}","${o.tipo}","${o.periodo}","${o.fecha}","${o.estado}"`);
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vencimientos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function VencimientosPage() {
  const { estudioActual } = useAuth();
  const { data, loading, error, refetch } = useFetchWithEstudio<VencimientoApi[]>('/v1/vencimientos');
  const { data: clientes } = useFetchWithEstudio<Cliente[]>('/v1/clientes');
  const items: Obligacion[] = (data ?? []).map((v) => ({
    id: v.id,
    tipo: v.tipoObligacion,
    periodo: v.periodo,
    fecha: v.fechaVencimiento,
    fechaVencimiento: v.fechaVencimiento,
    descripcion: v.descripcion,
    estado: v.estado,
    cliente: v.cliente,
    monto: v.monto,
    responsable: v.responsable ?? null,
  }));

  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [presentandoId, setPresentandoId] = useState<string | null>(null);
  const [presentarError, setPresentarError] = useState<string | null>(null);
  const [presentarExito, setPresentarExito] = useState<string | null>(null);
  const [showNuevo, setShowNuevo] = useState(false);

  const handlePresentar = useCallback(
    async (o: Obligacion) => {
      setPresentandoId(o.id);
      setPresentarError(null);
      setPresentarExito(null);
      try {
        const res = await apiFetch(`/v1/vencimientos/${o.id}/presentar`, { method: 'PATCH' });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message ?? body?.message ?? 'No se pudo presentar el vencimiento');
        }
        setPresentarExito(`Vencimiento de ${o.tipo} (${o.periodo}) presentado correctamente.`);
        refetch();
      } catch (err) {
        setPresentarError(err instanceof Error ? err.message : 'Error al presentar el vencimiento');
      } finally {
        setPresentandoId(null);
      }
    },
    [refetch],
  );

  const handleMore = useCallback(
    async (o: Obligacion) => {
      if (o.estado === 'VENCIDO') {
        await handlePresentar(o);
      }
    },
    [handlePresentar],
  );

  return (
    <PageStateGuard estudioActual={estudioActual} loading={loading} error={error} icon="calendar">
      <PageHeader
        title="Vencimientos"
        subtitle="Calendario y gestión de vencimientos fiscales"
        actions={
          <>
            <Button variant="ghost" icon={Icons.download} onClick={() => exportVencimientosCsv(items)}>
              Exportar
            </Button>
            <Button variant="brand" icon={Icons.plus} onClick={() => setShowNuevo(true)}>
              Nuevo vencimiento
            </Button>
          </>
        }
      />

      {presentarError && (
        <div
          role="alert"
          className="mb-4 text-[12.5px] text-[var(--rose-ink)] bg-[var(--rose-soft)] border border-[var(--rose)] rounded-[8px] px-3 py-2"
        >
          {presentarError}
        </div>
      )}

      {presentarExito && (
        <div
          role="status"
          className="mb-4 text-[12.5px] text-[var(--brand-ink)] bg-[var(--brand-soft)] border border-[var(--brand)] rounded-[8px] px-3 py-2"
        >
          {presentarExito}
        </div>
      )}

      <VencimientosKpis items={items} />

      <CalendarGrid
        month={month}
        items={items}
        onPrev={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        onNext={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        onToday={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
      />

      <VencimientosTable
        rows={items}
        presentandoId={presentandoId}
        onPresentar={handlePresentar}
        onMore={handleMore}
      />

      {showNuevo && (
        <NuevoVencimientoModal
          clientes={clientes ?? []}
          onClose={() => setShowNuevo(false)}
          onSuccess={() => {
            setShowNuevo(false);
            refetch();
          }}
        />
      )}
    </PageStateGuard>
  );
}

function NuevoVencimientoModal({
  clientes,
  onClose,
  onSuccess,
}: {
  clientes: Cliente[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clienteId, setClienteId] = useState('');
  const [tipoObligacion, setTipoObligacion] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/v1/vencimientos', {
        method: 'POST',
        body: JSON.stringify({ clienteId, tipoObligacion, periodo, fechaVencimiento, descripcion }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${res.status}`);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? 'Error al crear vencimiento');
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
      <div className="relative w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-lg p-6">
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-1">Nuevo vencimiento</h2>
        <p className="text-[12px] text-[var(--text-3)] mb-5">
          Crear un nuevo vencimiento fiscal.
        </p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="venc-cliente" className={labelClass}>Cliente</label>
            <select
              id="venc-cliente"
              required
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className={inputClass}
            >
              <option value="">Seleccionar cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.razonSocial} ({c.cuit})</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="venc-tipo" className={labelClass}>Tipo de obligación</label>
            <input
              id="venc-tipo"
              type="text"
              required
              value={tipoObligacion}
              onChange={(e) => setTipoObligacion(e.target.value)}
              className={inputClass}
              placeholder="IVA, Ganancias, IIBB…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="venc-periodo" className={labelClass}>Período</label>
              <input
                id="venc-periodo"
                type="text"
                required
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className={inputClass}
                placeholder="2026-04"
              />
            </div>
            <div>
              <label htmlFor="venc-fecha" className={labelClass}>Fecha vencimiento</label>
              <input
                id="venc-fecha"
                type="date"
                required
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="venc-desc" className={labelClass}>Descripción</label>
            <input
              id="venc-desc"
              type="text"
              required
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={inputClass}
              placeholder="DDJJ IVA Abril 2026"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creando…' : 'Crear vencimiento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
