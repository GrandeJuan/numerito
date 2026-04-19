'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/card';
import { Tabs } from '@/components/tabs';
import { Avatar } from '@/components/avatar';
import { Section } from '@/components/section';

type Tab = 'datos' | 'seguridad' | 'sesiones' | '2fa';

export function PerfilPage() {
  const { user, estudioActual } = useAuth();
  const [tab, setTab] = useState<Tab>('datos');

  return (
    <PageStateGuard estudioActual={estudioActual} loading={false} error={null} icon="user">
      <PageHeader title="Mi perfil" subtitle="Configuración personal" />

      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <Avatar name={user?.nombre ?? 'Usuario'} size={48} />
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold text-[var(--text)]">
              {user?.nombre ?? '—'}
            </div>
            <div className="text-[12.5px] text-[var(--text-3)] font-mono">
              {user?.email ?? '—'}
            </div>
          </div>
        </div>
      </Card>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'datos', label: 'Datos' },
          { value: 'seguridad', label: 'Seguridad' },
          { value: 'sesiones', label: 'Sesiones' },
          { value: '2fa', label: 'Autenticación 2FA' },
        ]}
      />

      <Card>
        {tab === 'datos' && (
          <Section title="Información personal" subtitle="Datos visibles para el equipo">
            <p className="text-[12.5px] text-[var(--text-3)]">
              Formulario a migrar desde la implementación actual. Mantener los
              inputs y labels existentes y solo aplicar los tokens del sistema.
            </p>
          </Section>
        )}
        {tab === 'seguridad' && (
          <Section title="Contraseña" subtitle="Cambiar contraseña de acceso">
            <p className="text-[12.5px] text-[var(--text-3)]">
              Formulario existente, con botón `Button variant="primary"`.
            </p>
          </Section>
        )}
        {tab === 'sesiones' && (
          <Section title="Sesiones activas" subtitle="Dispositivos donde iniciaste sesión">
            <p className="text-[12.5px] text-[var(--text-3)]">
              Lista existente dentro de `Section`, con botón `Revocar` (ghost).
            </p>
          </Section>
        )}
        {tab === '2fa' && (
          <Section title="Autenticación de dos factores" subtitle="Código por app autenticadora">
            <p className="text-[12.5px] text-[var(--text-3)]">
              Flujo existente de setup 2FA con QR y verificación.
            </p>
          </Section>
        )}
      </Card>
    </PageStateGuard>
  );
}
