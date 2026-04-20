'use client';

import { useState, useMemo } from 'react';
import { PageHeader, Card, Button } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';

interface CuentaNode {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'EGRESO';
  hijos?: CuentaNode[];
}

function CuentaRow({ node, depth = 0, filter }: { node: CuentaNode; depth?: number; filter: string }) {
  const [open, setOpen] = useState(true);
  const hasChildren = !!node.hijos?.length;
  const matches = !filter || node.codigo.toLowerCase().includes(filter) || node.nombre.toLowerCase().includes(filter);

  return (
    <>
      {matches && (
        <div
          className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-[var(--surface-2)] cursor-pointer"
          style={{ paddingLeft: 12 + depth * 20 }}
          onClick={() => hasChildren && setOpen(!open)}
        >
          {hasChildren ? <span className="text-[var(--text-3)] text-[10px] w-3">{open ? '▾' : '▸'}</span> : <span className="w-3" />}
          <span className="mono text-[12px] text-[var(--text-3)] min-w-[70px]">{node.codigo}</span>
          <span className="text-[13px] text-[var(--text)]">{node.nombre}</span>
          <span className="ml-auto text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-3)]">{node.tipo}</span>
        </div>
      )}
      {open && hasChildren && node.hijos!.map((h) => <CuentaRow key={h.id} node={h} depth={depth + 1} filter={filter} />)}
    </>
  );
}

export function PlanCuentasPage() {
  const [q, setQ] = useState('');
  const { data, loading, error } = useFetchWithEstudio<CuentaNode[]>('/v1/contabilidad/plan-cuentas');
  const filter = useMemo(() => q.toLowerCase().trim(), [q]);

  return (
    <>
      <PageHeader
        title="Plan de cuentas"
        subtitle="Estructura jerárquica del plan contable"
        actions={
          <>
            <input
              type="search"
              placeholder="Buscar cuenta…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 px-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] w-[220px] outline-none focus:border-[var(--brand)]"
            />
            <Button variant="primary">Nueva cuenta</Button>
          </>
        }
      />
      <PageStateGuard loading={loading} error={error}>
        {data && (
          <Card>
            <div className="py-1">
              {data.map((c) => <CuentaRow key={c.id} node={c} filter={filter} />)}
            </div>
          </Card>
        )}
      </PageStateGuard>
    </>
  );
}
