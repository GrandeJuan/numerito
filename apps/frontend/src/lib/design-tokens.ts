// Design System Tokens — Single source of truth for Numerito brand
// All pages must import from here instead of defining local color maps.

export const BRAND = {
  primary: '#091426',
  accent: '#4edea3',
  accentSecondary: '#00a472',
  lightBg: '#faf8ff',
  darkBg: '#0d1f3c',
  cardDark: '#162a4a',
  textPrimary: '#131b2e',
  textSecondary: '#45474c',
  textMuted: '#75777d',
  borderLight: '#e2e8f0',
} as const;

// --- Status badges (Tailwind className strings) ---

export const STATUS_COLORS: Record<string, string> = {
  // Spanish-cased keys used by portal / dashboard home
  Pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Cumplido: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Presentada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Vencido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Pagada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Activo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Inactivo: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',

  // UPPER_CASE keys used by obligaciones / facturacion / configuracion
  PENDIENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  PRESENTADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  VENCIDO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ACTIVO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  INACTIVO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',

  // Facturacion states
  EMITIDA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PARCIALMENTE_PAGADA: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  PAGADA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  VENCIDA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ANULADA: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export const ROL_COLORS: Record<string, string> = {
  SUPERADMIN: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  SOCIO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  RESPONSABLE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  EMPLEADO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  CLIENTE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  MEDIA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ALTA: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  URGENTE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// --- KPI icon style (brand accent) ---
export const KPI_ICON_STYLE = {
  bg: 'bg-[#4edea3]/10',
  text: 'text-[#4edea3]',
  className: 'bg-[#4edea3]/10 text-[#4edea3]',
} as const;

// --- Card classes ---
export const CARD_CLASSES = {
  base: 'rounded-xl shadow-sm',
  light: 'bg-white shadow-[#091426]/5 border border-[#e2e8f0]',
  dark: 'dark:bg-[#162a4a] dark:border-white/10',
  full: 'bg-white shadow-sm shadow-[#091426]/5 border border-[#e2e8f0] dark:bg-[#162a4a] dark:border-white/10 rounded-xl',
} as const;

// --- Table classes ---
export const TABLE_CLASSES = {
  header: 'bg-[#f0f4f8] dark:bg-[#162a4a]',
  headerText: 'text-[#45474c] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider',
  rowHover: 'hover:bg-[#4edea3]/5 dark:hover:bg-[#4edea3]/5',
  rowBorder: 'border-b border-gray-100 dark:border-gray-700/50',
} as const;

// --- Button classes ---
export const BUTTON_PRIMARY =
  'bg-[#091426] text-white font-bold rounded-xl shadow-lg shadow-[#091426]/20 hover:opacity-90 transition-all';

// --- Chart theme ---
export const CHART_THEME = {
  primaryFill: '#4edea3',
  secondaryFill: '#091426',
  gridLight: '#e2e8f0',
  gridDark: '#1e3a5f',
  tooltipStyle: {
    backgroundColor: '#091426',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
  },
} as const;
