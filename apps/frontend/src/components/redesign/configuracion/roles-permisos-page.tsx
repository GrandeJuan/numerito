'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Card, Button } from '@/components/redesign';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';

interface PermisoMatrix {
  roles: string[];
  permisos: Array<{ key: string; label: string; grupo: string }>;
  matrix: Record<string, Record<string, boolean>>; // rol -> permiso -> allowed
}

export function RolesPermisosPage() {
  // TODO: verificar endpoint
  const { data, loading, error } = useFetchWithEstudio<PermisoMatrix>('/v1/estudio/roles-permisos');
  const [matrix, setMatrix] = useState<PermisoMatrix['matrix']>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setMatrix(data.matrix);
  }, [data]);

  function toggle(rol: string, permiso: string) {
    setMatrix((m) => ({ ...m, [rol]: { ...m[rol], [permiso]: !m[rol]?.[permiso] } }));
  }

  async function save() {
    setSaving(true);
    try {
      // TODO: verificar endpoint
      await apiFetch('/v1/estudio/roles-permisos', { method: 'PUT', body: JSON.stringify({ matrix }) });
    } finally {
      setSaving(false);
    }
  }

  const grupos: Record<string, PermisoMatrix['permisos']> = {};
  data?.permisos.forEach((p) => {
    (grupos[p.grupo] ||= []).push(p);
  });

  return (
    <>
      <PageHeader
        title="Roles y permisos"
        subtitle="Qué puede hacer cada rol en el estudio"
        actions={<Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>}
      />
      <PageStateGuard loading={loading} error={error}>
        {data && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                    <th className="px-4 py-3 text-left text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)]">Permiso</th>
                    {data.roles.map((r) => (
                      <th key={r} className="px-4 py-3 text-center text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)]">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grupos).map(([grupo, perms]) => (
                    <>
                      <tr key={`g-${grupo}`} className="bg-[var(--surface-2)]">
                        <td colSpan={data.roles.length + 1} className="px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-[var(--text-3)] font-medium">
                          {grupo}
                        </td>
                      </tr>
                      {perms.map((p) => (
                        <tr key={p.key} className="border-b border-[var(--border)]">
                          <td className="px-4 py-[11px] text-[var(--text)]">{p.label}</td>
                          {data.roles.map((rol) => (
                            <td key={rol} className="px-4 py-[11px] text-center">
                              <input
                                type="checkbox"
                                checked={!!matrix[rol]?.[p.key]}
                                onChange={() => toggle(rol, p.key)}
                                className="accent-[var(--brand)] w-4 h-4 cursor-pointer"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </PageStateGuard>
    </>
  );
}
