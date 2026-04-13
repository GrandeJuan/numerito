'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFetchWithEstudio } from '@/lib/use-fetch-with-estudio';
import { PageStateGuard } from '@/components/shared/page-state-guard';
import { CARD_CLASSES, TABLE_CLASSES } from '@/lib/design-tokens';
import { RolBadge } from '@/components/shared/rol-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ROL_LABELS, CONDICION_IVA_LABELS } from '@numerito/shared';

type Tab = 'general' | 'equipo' | 'plan' | 'permisos';

interface EstudioInfo {
  nombre: string;
  cuit: string;
  condicionIva: string;
}

interface Miembro {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
}

interface PlanInfo {
  nombre: string;
  estado: string;
  clientesActuales: number;
  clientesMax: number;
  usuariosActuales: number;
  usuariosMax: number;
}

// Permission groups for the matrix (mirrors backend permisos-default.seed.ts)
const PERMISSION_GROUPS = [
  { label: 'Usuarios', permisos: ['GESTIONAR_USUARIOS', 'VER_USUARIOS'] },
  { label: 'Clientes', permisos: ['GESTIONAR_CLIENTES', 'VER_CLIENTES'] },
  { label: 'Obligaciones', permisos: ['GESTIONAR_OBLIGACIONES', 'VER_OBLIGACIONES'] },
  { label: 'Contabilidad', permisos: ['GESTIONAR_CONTABILIDAD', 'VER_CONTABILIDAD'] },
  { label: 'Nomina', permisos: ['GESTIONAR_NOMINA', 'VER_NOMINA'] },
  { label: 'Documentos', permisos: ['GESTIONAR_DOCUMENTOS', 'VER_DOCUMENTOS'] },
  { label: 'Tareas', permisos: ['GESTIONAR_TAREAS', 'VER_TAREAS'] },
  { label: 'Facturacion', permisos: ['GESTIONAR_FACTURACION', 'VER_FACTURACION'] },
  { label: 'Configuracion', permisos: ['GESTIONAR_CONFIGURACION'] },
];

const ROLES_MATRIX = ['SOCIO', 'RESPONSABLE', 'EMPLEADO'] as const;

// Default permissions per role (mirrors backend seed)
const PERMISOS_POR_ROL: Record<string, string[]> = {
  SOCIO: [
    'GESTIONAR_USUARIOS',
    'VER_USUARIOS',
    'GESTIONAR_CLIENTES',
    'VER_CLIENTES',
    'GESTIONAR_OBLIGACIONES',
    'VER_OBLIGACIONES',
    'GESTIONAR_CONTABILIDAD',
    'VER_CONTABILIDAD',
    'GESTIONAR_NOMINA',
    'VER_NOMINA',
    'GESTIONAR_DOCUMENTOS',
    'VER_DOCUMENTOS',
    'GESTIONAR_TAREAS',
    'VER_TAREAS',
    'GESTIONAR_FACTURACION',
    'VER_FACTURACION',
    'GESTIONAR_CONFIGURACION',
    'VER_PROPIOS_DATOS',
    'VER_PROPIOS_DOCUMENTOS',
    'VER_PROPIOS_VENCIMIENTOS',
  ],
  RESPONSABLE: [
    'VER_USUARIOS',
    'GESTIONAR_CLIENTES',
    'VER_CLIENTES',
    'GESTIONAR_OBLIGACIONES',
    'VER_OBLIGACIONES',
    'GESTIONAR_CONTABILIDAD',
    'VER_CONTABILIDAD',
    'GESTIONAR_NOMINA',
    'VER_NOMINA',
    'GESTIONAR_DOCUMENTOS',
    'VER_DOCUMENTOS',
    'GESTIONAR_TAREAS',
    'VER_TAREAS',
    'VER_FACTURACION',
  ],
  EMPLEADO: [
    'VER_CLIENTES',
    'VER_OBLIGACIONES',
    'VER_CONTABILIDAD',
    'VER_NOMINA',
    'VER_DOCUMENTOS',
    'VER_TAREAS',
  ],
};

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'general', label: 'General', icon: 'settings' },
  { key: 'equipo', label: 'Equipo', icon: 'group' },
  { key: 'plan', label: 'Plan', icon: 'credit_card' },
  { key: 'permisos', label: 'Permisos', icon: 'shield' },
];

export default function ConfiguracionPage() {
  const { estudioActual } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const isSocio = estudioActual?.rol === 'SOCIO';

  // Pass null to skip fetching when user is not a socio
  const {
    data: estudioInfo,
    loading: loadingEstudio,
    error: errorEstudio,
  } = useFetchWithEstudio<EstudioInfo>(isSocio ? '/v1/estudios/me' : null);
  const { data: equipo } = useFetchWithEstudio<Miembro[]>(isSocio ? '/v1/estudios/equipo' : null);
  const { data: plan } = useFetchWithEstudio<PlanInfo>(isSocio ? '/v1/estudios/plan' : null);

  const equipoColumns: Column<Miembro>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (m) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {m.nombre.charAt(0)}
          </div>
          <span className="text-[#091426] dark:text-white font-medium">{m.nombre}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (m) => <span className="text-gray-600 dark:text-[#c5c6cd]">{m.email}</span>,
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (m) => (
        <RolBadge rol={m.rol} label={ROL_LABELS[m.rol as keyof typeof ROL_LABELS] ?? m.rol} />
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (m) => (
        <StatusBadge status={m.estado} label={m.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'} />
      ),
    },
  ];

  // Show access denied before PageStateGuard when estudio is loaded but user is not socio
  if (estudioActual && !isSocio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-red-400">lock</span>
          <p className="mt-2 text-[#45474c] dark:text-[#a0a3a8]">Acceso denegado</p>
          <p className="text-sm text-gray-500 dark:text-[#75777d]">
            Solo los socios pueden acceder a la configuracion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageStateGuard
      estudioActual={estudioActual}
      loading={loadingEstudio}
      error={errorEstudio}
      icon="settings"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#091426] dark:text-white">Configuracion</h1>
          <p className="mt-1 text-[#45474c] dark:text-[#a0a3a8]">Ajustes del estudio contable.</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-white/10">
          <nav className="flex gap-4">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#4edea3] text-[#091426] dark:text-[#4edea3]'
                    : 'border-transparent text-gray-500 dark:text-[#a0a3a8] hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <div className={`${CARD_CLASSES.full} p-6`}>
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
              Informacion del Estudio
            </h2>
            {estudioInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-[#a0a3a8] mb-1">
                    Nombre
                  </label>
                  <p className="text-[#091426] dark:text-white">{estudioInfo.nombre}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-[#a0a3a8] mb-1">
                    CUIT
                  </label>
                  <p className="text-[#091426] dark:text-white font-mono">{estudioInfo.cuit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-[#a0a3a8] mb-1">
                    Condicion IVA
                  </label>
                  <p className="text-[#091426] dark:text-white">
                    {CONDICION_IVA_LABELS[
                      estudioInfo.condicionIva as keyof typeof CONDICION_IVA_LABELS
                    ] ?? estudioInfo.condicionIva}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-[#a0a3a8] text-sm">
                No se pudo cargar la informacion del estudio.
              </p>
            )}
          </div>
        )}

        {activeTab === 'equipo' && (
          <DataTable
            columns={equipoColumns}
            data={equipo ?? []}
            rowKey={(m) => m.id}
            emptyMessage="No se encontraron miembros."
          />
        )}

        {activeTab === 'plan' && (
          <div className={`${CARD_CLASSES.full} p-6`}>
            <h2 className="text-lg font-semibold text-[#091426] dark:text-white mb-4">
              Plan Actual
            </h2>
            {plan ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-emerald-500">
                    verified
                  </span>
                  <div>
                    <p className="text-xl font-bold text-[#091426] dark:text-white">
                      {plan.nombre}
                    </p>
                    <StatusBadge
                      status={plan.estado}
                      label={plan.estado === 'ACTIVO' ? 'Activo' : plan.estado}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#f0f4f8] dark:bg-[#162a4a] rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-[#a0a3a8] mb-2">Clientes</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-[#091426] dark:text-white">
                        {plan.clientesActuales}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-[#a0a3a8] mb-0.5">
                        / {plan.clientesMax}
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-[#162a4a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min((plan.clientesActuales / plan.clientesMax) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-[#f0f4f8] dark:bg-[#162a4a] rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-[#a0a3a8] mb-2">Usuarios</p>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-[#091426] dark:text-white">
                        {plan.usuariosActuales}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-[#a0a3a8] mb-0.5">
                        / {plan.usuariosMax}
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-[#162a4a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${Math.min((plan.usuariosActuales / plan.usuariosMax) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-[#a0a3a8] text-sm">
                No se pudo cargar la informacion del plan.
              </p>
            )}
          </div>
        )}

        {activeTab === 'permisos' && (
          <div className={`${CARD_CLASSES.full} overflow-hidden`}>
            <div className="p-6 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-lg font-semibold text-[#091426] dark:text-white">
                Matriz de Permisos
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#a0a3a8] mt-1">
                Permisos predeterminados por rol (solo lectura).
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className={`border-b border-gray-200 dark:border-white/10 ${TABLE_CLASSES.header}`}
                  >
                    <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>Grupo</th>
                    <th className={`text-left py-3 px-4 ${TABLE_CLASSES.headerText}`}>Permiso</th>
                    {ROLES_MATRIX.map((rol) => (
                      <th key={rol} className={`text-center py-3 px-4 ${TABLE_CLASSES.headerText}`}>
                        {ROL_LABELS[rol as keyof typeof ROL_LABELS] ?? rol}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_GROUPS.map((group) =>
                    group.permisos.map((permiso, idx) => (
                      <tr
                        key={permiso}
                        className="border-b border-[#e2e8f0]/50 dark:border-white/5"
                      >
                        {idx === 0 && (
                          <td
                            rowSpan={group.permisos.length}
                            className="py-3 px-4 font-medium text-[#091426] dark:text-white align-top"
                          >
                            {group.label}
                          </td>
                        )}
                        <td className="py-3 px-4 text-gray-600 dark:text-[#c5c6cd] text-xs font-mono">
                          {permiso
                            .replace(/_/g, ' ')
                            .toLowerCase()
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </td>
                        {ROLES_MATRIX.map((rol) => (
                          <td key={rol} className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={PERMISOS_POR_ROL[rol]?.includes(permiso) ?? false}
                              readOnly
                              className="w-4 h-4 rounded border-[#e2e8f0] text-emerald-500 focus:ring-0 cursor-default"
                            />
                          </td>
                        ))}
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageStateGuard>
  );
}
