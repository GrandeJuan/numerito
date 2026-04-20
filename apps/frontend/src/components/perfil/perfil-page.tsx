'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api-client';
import { parseApiResponse } from '@/lib/parse-api-response';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/card';
import { Section } from '@/components/section';
import { Button } from '@/components/button';
import { AvatarUpload } from '@/components/avatar-upload';
import { Field, FieldRow } from '@/components/field';
import { KvList } from '@/components/kv-list';
import { Pill } from '@/components/pill';

export function PerfilPage() {
  const { user, estudioActual, refreshUser } = useAuth();

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [apellido, setApellido] = useState(user?.apellido ?? '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dirty) return;
    setNombre(user?.nombre ?? '');
    setApellido(user?.apellido ?? '');
  }, [user?.nombre, user?.apellido, dirty]);

  const touch =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setDirty(true);
      setError(null);
      setter(v);
    };

  const reset = () => {
    setNombre(user?.nombre ?? '');
    setApellido(user?.apellido ?? '');
    setDirty(false);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch('/v1/usuarios/me', {
        method: 'PATCH',
        body: JSON.stringify({ nombre, apellido }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? body?.message ?? 'No se pudo guardar');
      }
      await refreshUser();
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiFetch('/v1/usuarios/me/avatar', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? body?.message ?? 'No se pudo subir el avatar');
      }
      await parseApiResponse(res).catch(() => null);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir avatar');
    }
  };

  const displayName = `${nombre} ${apellido}`.trim() || user?.email || 'Usuario';

  return (
    <PageStateGuard loading={false} error={null} icon="user">
      <PageHeader
        title="Mi perfil"
        subtitle="Actualizá tus datos personales. El resto los administra tu administrador."
      />

      <form onSubmit={submit} className="max-w-[720px]">
        <Card className="mb-4 overflow-hidden">
          <Section title="" className="!py-5">
            <div className="flex items-center gap-4">
              <AvatarUpload
                name={displayName}
                src={user?.avatarUrl ?? null}
                size={72}
                onFileSelected={uploadAvatar}
              />
              <div className="min-w-0">
                <div className="text-[16px] font-semibold text-[var(--text)] tracking-[-0.01em]">
                  {displayName}
                </div>
                <div className="text-[12.5px] text-[var(--text-3)] truncate">
                  {user?.email ?? '—'}
                </div>
                {user?.rol && (
                  <div className="mt-1.5">
                    <Pill tone="brand">{user.rol}</Pill>
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Datos personales" subtitle="Estos campos los podés editar vos.">
            <FieldRow>
              <Field
                label="Nombre"
                value={nombre}
                onChange={(e) => touch(setNombre)(e.target.value)}
                autoComplete="given-name"
              />
              <Field
                label="Apellido"
                value={apellido}
                onChange={(e) => touch(setApellido)(e.target.value)}
                autoComplete="family-name"
              />
            </FieldRow>

            {error && <div className="mt-3 text-[12px] text-[var(--rose)]">{error}</div>}

            <div className="flex justify-end gap-2 mt-4 pt-3.5 border-t border-[var(--border)]">
              <Button type="button" variant="ghost" onClick={reset} disabled={!dirty || saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={!dirty || saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </Section>

          <Section
            title="Datos de la cuenta"
            subtitle="Los administra tu administrador del estudio."
          >
            <KvList
              rows={[
                { key: 'Email', value: user?.email ?? '—' },
                { key: 'Rol', value: user?.rol ?? '—' },
                { key: 'Estudio', value: estudioActual?.nombre ?? '—' },
                {
                  key: 'Miembro desde',
                  value: user?.createdAt ? (
                    <span className="font-mono">{formatDate(user.createdAt)}</span>
                  ) : (
                    '—'
                  ),
                },
              ]}
            />
          </Section>
        </Card>
      </form>
    </PageStateGuard>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
