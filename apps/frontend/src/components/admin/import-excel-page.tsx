'use client';

import { useState, useRef } from 'react';
import { PageHeader, Button, DataTable, Pill, type Column } from '@/components';
import { apiFetch } from '@/lib/api-client';

type Step = 'upload' | 'preview' | 'done';

interface ClienteDiff {
  razonSocial: string;
  responsable: string | null;
  accion: 'CREAR' | 'EXISTENTE';
  clienteId?: string;
  vencimientosNuevos: number;
  vencimientosDuplicados: number;
}

interface ImportResult {
  dryRun: boolean;
  totalFilas: number;
  clientesNuevos: number;
  clientesExistentes: number;
  vencimientosCreados: number;
  vencimientosDuplicados: number;
  errores: string[];
  detalle: ClienteDiff[];
}

interface ParseInfo {
  headersReconocidos: string[];
  headersIgnorados: string[];
  erroresParser: string[];
}

interface ImportResponse {
  parseInfo: ParseInfo;
  importResult: ImportResult;
}

const columns: Column<ClienteDiff>[] = [
  { key: 'razonSocial', header: 'Cliente', render: (r) => r.razonSocial },
  { key: 'responsable', header: 'Responsable', render: (r) => r.responsable ?? '-' },
  {
    key: 'accion',
    header: 'Accion',
    render: (r) =>
      r.accion === 'CREAR' ? (
        <Pill tone="green">Nuevo</Pill>
      ) : (
        <Pill tone="blue">Existente</Pill>
      ),
  },
  {
    key: 'vencimientosNuevos',
    header: 'Vtos nuevos',
    render: (r) => String(r.vencimientosNuevos),
  },
  {
    key: 'vencimientosDuplicados',
    header: 'Duplicados',
    render: (r) =>
      r.vencimientosDuplicados > 0 ? (
        <Pill tone="yellow">{r.vencimientosDuplicados}</Pill>
      ) : (
        '0'
      ),
  },
];

export function ImportExcelPage() {
  const [step, setStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportResponse | null>(null);
  const [confirmed, setConfirmed] = useState<ImportResponse | null>(null);
  const [estadoHistoricos, setEstadoHistoricos] = useState<'PRESENTADO' | 'PENDIENTE'>('PRESENTADO');
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    selectedFileRef.current = file;

    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('dryRun', 'true');
      form.append('estadoHistoricos', estadoHistoricos);

      const res = await apiFetch('/v1/admin/clientes/import', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(err.error?.message ?? 'Error al procesar archivo');
      }

      const json = await res.json();
      setPreview(json.data as ImportResponse);
      setStep('preview');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    const file = selectedFileRef.current;
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('dryRun', 'false');
      form.append('estadoHistoricos', estadoHistoricos);

      const res = await apiFetch('/v1/admin/clientes/import', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(err.error?.message ?? 'Error al importar');
      }

      const json = await res.json();
      setConfirmed(json.data as ImportResponse);
      setStep('done');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep('upload');
    setPreview(null);
    setConfirmed(null);
    setError(null);
    selectedFileRef.current = null;
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Import Excel"
        subtitle="Importar clientes y vencimientos desde la planilla del estudio"
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-medium text-[var(--text)]">1. Seleccionar archivo</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Subi el archivo &quot;Vtos mensuales por responsable.xlsx&quot; del estudio.
            Se mostrara una vista previa antes de confirmar.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="text-sm text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--brand)] file:text-[var(--brand-on)] hover:file:opacity-90 file:cursor-pointer"
          />

          <div className="flex items-center gap-3">
            <label className="text-xs text-[var(--text-muted)]">Estado para vencimientos historicos:</label>
            <select
              value={estadoHistoricos}
              onChange={(e) => setEstadoHistoricos(e.target.value as 'PRESENTADO' | 'PENDIENTE')}
              className="bg-[var(--input)] border border-[var(--card-border)] text-[var(--text)] text-xs rounded-lg px-3 py-1.5"
            >
              <option value="PRESENTADO">PRESENTADO (ya cumplido)</option>
              <option value="PENDIENTE">PENDIENTE</option>
            </select>
          </div>

          <div>
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? 'Procesando...' : 'Vista previa'}
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Filas" value={preview.importResult.totalFilas} />
            <StatCard label="Clientes nuevos" value={preview.importResult.clientesNuevos} tone="green" />
            <StatCard label="Clientes existentes" value={preview.importResult.clientesExistentes} tone="blue" />
            <StatCard label="Vtos a crear" value={preview.importResult.vencimientosCreados} tone="green" />
          </div>

          {preview.importResult.vencimientosDuplicados > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg text-xs">
              {preview.importResult.vencimientosDuplicados} vencimientos duplicados seran omitidos (ya existen en el sistema).
            </div>
          )}

          {preview.parseInfo.headersIgnorados.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">
                Columnas ignoradas ({preview.parseInfo.headersIgnorados.length}):
              </p>
              <p className="text-xs text-[var(--text-muted)] opacity-70">
                {preview.parseInfo.headersIgnorados.join(', ')}
              </p>
            </div>
          )}

          {preview.parseInfo.erroresParser.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-yellow-400 mb-1">
                Advertencias del parser ({preview.parseInfo.erroresParser.length}):
              </p>
              {preview.parseInfo.erroresParser.slice(0, 10).map((e, i) => (
                <p key={i} className="text-xs text-yellow-400 opacity-70">{e}</p>
              ))}
            </div>
          )}

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4">
            <h3 className="text-sm font-medium text-[var(--text)] mb-3">Detalle por cliente</h3>
            <DataTable columns={columns} data={preview.importResult.detalle} />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? 'Importando...' : 'Confirmar importacion'}
            </Button>
            <Button variant="ghost" onClick={handleReset} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </>
      )}

      {step === 'done' && confirmed && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-lg">&#10003;</span>
            <h3 className="text-sm font-medium text-[var(--text)]">Importacion completada</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Clientes creados" value={confirmed.importResult.clientesNuevos} tone="green" />
            <StatCard label="Vtos creados" value={confirmed.importResult.vencimientosCreados} tone="green" />
            <StatCard label="Duplicados omitidos" value={confirmed.importResult.vencimientosDuplicados} tone="yellow" />
            <StatCard label="Total filas" value={confirmed.importResult.totalFilas} />
          </div>
          <div>
            <Button variant="ghost" onClick={handleReset}>
              Importar otro archivo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'green' | 'blue' | 'yellow';
}) {
  const colors = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
  };
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-3">
      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-semibold ${tone ? colors[tone] : 'text-[var(--text)]'}`}>
        {value}
      </div>
    </div>
  );
}
