'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

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

const ROL_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  SOCIO: 'Socio',
  RESPONSABLE: 'Responsable',
  EMPLEADO: 'Empleado',
  CLIENTE: 'Cliente',
};

const ROL_COLORS: Record<string, string> = {
  SOCIO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  RESPONSABLE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  EMPLEADO: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const ESTADO_COLORS: Record<string, string> = {
  ACTIVO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  INACTIVO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const CONDICION_IVA_LABELS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTO: 'Monotributista',
  EXENTO: 'Exento',
  NO_RESPONSABLE: 'No Responsable',
  CONSUMIDOR_FINAL: 'Consumidor Final',
};

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
    'GESTIONAR_USUARIOS', 'VER_USUARIOS',
    'GESTIONAR_CLIENTES', 'VER_CLIENTES',
    'GESTIONAR_OBLIGACIONES', 'VER_OBLIGACIONES',
    'GESTIONAR_CONTABILIDAD', 'VER_CONTABILIDAD',
    'GESTIONAR_NOMINA', 'VER_NOMINA',
    'GESTIONAR_DOCUMENTOS', 'VER_DOCUMENTOS',
    'GESTIONAR_TAREAS', 'VER_TAREAS',
    'GESTIONAR_FACTURACION', 'VER_FACTURACION',
    'GESTIONAR_CONFIGURACION',
    'VER_PROPIOS_DATOS', 'VER_PROPIOS_DOCUMENTOS', 'VER_PROPIOS_VENCIMIENTOS',
  ],
  RESPONSABLE: [
    'VER_USUARIOS',
    'GESTIONAR_CLIENTES', 'VER_CLIENTES',
    'GESTIONAR_OBLIGACIONES', 'VER_OBLIGACIONES',
    'GESTIONAR_CONTABILIDAD', 'VER_CONTABILIDAD',
    'GESTIONAR_NOMINA', 'VER_NOMINA',
    'GESTIONAR_DOCUMENTOS', 'VER_DOCUMENTOS',
    'GESTIONAR_TAREAS', 'VER_TAREAS',
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
  const { estudioActual, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [estudioInfo, setEstudioInfo] = useState<EstudioInfo | null>(null);
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const isSocio = estudioActual?.rol === 'SOCIO';

  useEffect(() => {
    if (!estudioActual || !isSocio) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [estudioRes, equipoRes, planRes] = await Promise.all([
          apiFetch('/v1/estudios/me'),
          apiFetch('/v1/estudios/equipo'),
          apiFetch('/v1/estudios/plan'),
        ]);

        if (estudioRes.ok) {
          const body = await estudioRes.json();
          setEstudioInfo(body.data);
        }
        if (equipoRes.ok) {
          const body = await equipoRes.json();
          setEquipo(body.data);
        }
        if (planRes.ok) {
          const body = await planRes.json();
          setPlan(body.data);
        }
      } catch {
        // silently fail — sections show empty state
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [estudioActual, isSocio]);

  if (!estudioActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">settings</span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Seleccione un estudio para ver la configuracion.</p>
        </div>
      </div>
    );
  }

  if (!isSocio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-red-400">lock</span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Acceso denegado</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Solo los socios pueden acceder a la configuracion.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuracion</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Ajustes del estudio contable.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informacion del Estudio</h2>
          {estudioInfo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
                <p className="text-gray-900 dark:text-white">{estudioInfo.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">CUIT</label>
                <p className="text-gray-900 dark:text-white font-mono">{estudioInfo.cuit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Condicion IVA</label>
                <p className="text-gray-900 dark:text-white">
                  {CONDICION_IVA_LABELS[estudioInfo.condicionIva] ?? estudioInfo.condicionIva}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No se pudo cargar la informacion del estudio.</p>
          )}
        </div>
      )}

      {activeTab === 'equipo' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Miembros del Equipo</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Rol</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {equipo.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          {m.nombre.charAt(0)}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">{m.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{m.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROL_COLORS[m.rol] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {ROL_LABELS[m.rol] ?? m.rol}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[m.estado] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {m.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
                {equipo.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron miembros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Actual</h2>
          {plan ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-emerald-500">verified</span>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{plan.nombre}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[plan.estado] ?? 'bg-gray-100 text-gray-800'}`}>
                    {plan.estado === 'ACTIVO' ? 'Activo' : plan.estado}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Clientes</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.clientesActuales}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">/ {plan.clientesMax}</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min((plan.clientesActuales / plan.clientesMax) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Usuarios</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.usuariosActuales}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">/ {plan.usuariosMax}</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min((plan.usuariosActuales / plan.usuariosMax) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No se pudo cargar la informacion del plan.</p>
          )}
        </div>
      )}

      {activeTab === 'permisos' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Matriz de Permisos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Permisos predeterminados por rol (solo lectura).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Grupo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Permiso</th>
                  {ROLES_MATRIX.map((rol) => (
                    <th key={rol} className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      {ROL_LABELS[rol] ?? rol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map((group) =>
                  group.permisos.map((permiso, idx) => (
                    <tr key={permiso} className="border-b border-gray-100 dark:border-gray-700/50">
                      {idx === 0 && (
                        <td
                          rowSpan={group.permisos.length}
                          className="py-3 px-4 font-medium text-gray-900 dark:text-white align-top"
                        >
                          {group.label}
                        </td>
                      )}
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-xs font-mono">
                        {permiso.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                      </td>
                      {ROLES_MATRIX.map((rol) => (
                        <td key={rol} className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={PERMISOS_POR_ROL[rol]?.includes(permiso) ?? false}
                            readOnly
                            className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-0 cursor-default"
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
