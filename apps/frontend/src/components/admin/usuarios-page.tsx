'use client';

import { useState } from 'react';
import { PageHeader, DataTable, Avatar, Pill, Button, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetch } from '@/lib/use-fetch';
import { apiFetch } from '@/lib/api-client';

interface UsuarioPlatform {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  provider: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE = 20;

const ROLES_INVITACION = [
  { value: 'SUPERADMIN', label: 'Super Administrador' },
  { value: 'SOCIO', label: 'Socio' },
  { value: 'RESPONSABLE', label: 'Responsable' },
];

export function UsuariosAdminPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(PAGE_SIZE));
  if (search.trim()) params.set('search', search.trim());

  const { data, meta, loading, error, refetch } = useFetch<UsuarioPlatform[]>(
    `/v1/admin/usuarios?${params.toString()}`,
  );

  const totalPages = meta?.totalPages ?? 1;

  const columns: Column<UsuarioPlatform>[] = [
    {
      header: 'Usuario',
      render: (r) => {
        const full = `${r.nombre} ${r.apellido}`.trim();
        return (
          <div className="flex items-center gap-3">
            <Avatar name={full || r.email} size={28} />
            <div>
              <div className="text-[13px] font-medium text-[var(--text)]">{full || '—'}</div>
              <div className="text-[11.5px] text-[var(--text-3)] font-mono">{r.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Rol',
      render: (r) => (
        <Pill tone={r.rol === 'SUPERADMIN' ? 'brand' : r.rol === 'SOCIO' ? 'indigo' : 'neutral'}>
          {r.rol}
        </Pill>
      ),
    },
    {
      header: 'Verificado',
      render: (r) => (
        <Pill tone={r.emailVerified ? 'brand' : 'amber'} dot>
          {r.emailVerified ? 'Sí' : 'Pendiente'}
        </Pill>
      ),
    },
    {
      header: 'Estado',
      render: (r) => (
        <Pill tone={r.isActive ? 'brand' : 'neutral'} dot>
          {r.isActive ? 'Activo' : 'Suspendido'}
        </Pill>
      ),
    },
    {
      header: 'Creado',
      render: (r) => (
        <span className="font-mono text-[11.5px] text-[var(--text-3)]">
          {r.createdAt.slice(0, 10)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Equipo de plataforma y accesos"
        actions={
          <Button variant="primary" onClick={() => setShowInvite(true)}>
            Invitar
          </Button>
        }
      />
      <div className="flex items-center gap-3 mb-3">
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-8 w-[280px] bg-[var(--surface)] border border-[var(--border)] rounded-[7px] px-2.5 text-[12.5px] text-[var(--text)] outline-none focus:border-[var(--brand)]"
        />
        {meta && (
          <span className="text-[11.5px] text-[var(--text-3)]">
            {meta.total} usuario{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <PageStateGuard loading={loading} error={error}>
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(r) => r.id}
          footer={
            totalPages > 1 && (
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            )
          }
        />
      </PageStateGuard>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => {
            setShowInvite(false);
            refetch();
          }}
        />
      )}
    </>
  );
}

function InviteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('SUPERADMIN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/v1/admin/usuarios/invitaciones', {
        method: 'POST',
        body: JSON.stringify({
          email,
          ...(nombre.trim() && { nombre: nombre.trim() }),
          rol,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${res.status}`);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message ?? 'Error al enviar invitación');
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
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-1">Invitar usuario</h2>
        <p className="text-[12px] text-[var(--text-3)] mb-5">
          Enviar invitación a un nuevo administrador de plataforma.
        </p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-email" className={labelClass}>Email</label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="admin@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="invite-nombre" className={labelClass}>Nombre (opcional)</label>
            <input
              id="invite-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
              placeholder="Nombre del usuario"
            />
          </div>

          <div>
            <label htmlFor="invite-rol" className={labelClass}>Rol</label>
            <select
              id="invite-rol"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className={inputClass}
            >
              {ROLES_INVITACION.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enviando…' : 'Enviar invitación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-2 py-1 text-[12px] rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← Anterior
      </button>
      <span className="text-[12px] text-[var(--text-3)]">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-2 py-1 text-[12px] rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Siguiente →
      </button>
    </div>
  );
}
