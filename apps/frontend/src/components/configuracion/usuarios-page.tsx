'use client';

import { useState } from 'react';
import { PageHeader, DataTable, Button, Pill, Avatar, type Column } from '@/components';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { apiFetch } from '@/lib/api-client';
import { Can } from '@/components/shared/can';

interface UsuarioEstudio {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: 'ACTIVO' | 'INVITADO' | 'SUSPENDIDO';
  ultimoAcceso?: string;
}

const ESTADO_TONE: Record<UsuarioEstudio['estado'], 'brand' | 'amber' | 'neutral'> = {
  ACTIVO: 'brand',
  INVITADO: 'amber',
  SUSPENDIDO: 'neutral',
};

const ROLES_ESTUDIO = [
  { value: 'SOCIO', label: 'Socio' },
  { value: 'RESPONSABLE', label: 'Responsable' },
  { value: 'EMPLEADO', label: 'Empleado' },
];

export function UsuariosConfigPage() {
  const { data, loading, error, refetch } = useFetchWithEstudio<UsuarioEstudio[]>('/v1/estudios/equipo');
  const [showInvite, setShowInvite] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioEstudio | null>(null);

  const columns: Column<UsuarioEstudio>[] = [
    {
      header: 'Usuario',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.nombre} size={28} />
          <div>
            <div className="text-[13px] font-medium text-[var(--text)]">{r.nombre}</div>
            <div className="text-[11.5px] text-[var(--text-3)]">{r.email}</div>
          </div>
        </div>
      ),
    },
    { header: 'Rol', key: 'rol' },
    {
      header: 'Estado',
      render: (r) => (
        <Pill tone={ESTADO_TONE[r.estado]} small>
          {r.estado}
        </Pill>
      ),
    },
    {
      header: 'Último acceso',
      render: (r) => <span className="mono text-[var(--text-3)]">{r.ultimoAcceso ?? '—'}</span>,
    },
    {
      header: '',
      align: 'right',
      render: (r) => (
        <button
          className="text-[12px] text-[var(--text-3)] hover:text-[var(--text)]"
          onClick={() => setEditingUser(r)}
        >
          Editar
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Miembros del estudio con acceso al sistema"
        actions={
          <Can permission="usuarios.invitar">
            <Button variant="primary" onClick={() => setShowInvite(true)}>
              Invitar usuario
            </Button>
          </Can>
        }
      />
      <PageStateGuard loading={loading} error={error}>
        {data && (
          <DataTable
            columns={columns}
            rows={data}
            rowKey={(r) => r.id}
            emptyMessage="No hay usuarios cargados."
          />
        )}
      </PageStateGuard>

      {showInvite && (
        <InviteEstudioModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => {
            setShowInvite(false);
            refetch();
          }}
        />
      )}

      {editingUser && (
        <EditRolModal
          usuario={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

function InviteEstudioModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('EMPLEADO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/v1/estudios/equipo/invitar', {
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
          Enviar invitación a un nuevo miembro del estudio.
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
              placeholder="usuario@ejemplo.com"
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
              {ROLES_ESTUDIO.map((r) => (
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

function EditRolModal({
  usuario,
  onClose,
  onSuccess,
}: {
  usuario: UsuarioEstudio;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rol, setRol] = useState(usuario.rol);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rol === usuario.rol) {
      onClose();
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch(`/v1/estudios/equipo/${usuario.id}/rol`, {
        method: 'PATCH',
        body: JSON.stringify({ rol }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${res.status}`);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? 'Error al cambiar rol');
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
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-1">Editar rol</h2>
        <p className="text-[12px] text-[var(--text-3)] mb-5">
          Cambiar el rol de {usuario.nombre} ({usuario.email}).
        </p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-rol" className={labelClass}>Rol</label>
            <select
              id="edit-rol"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className={inputClass}
            >
              {ROLES_ESTUDIO.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
