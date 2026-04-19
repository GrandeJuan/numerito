import { Icons } from '../icons';
import type { NavItem } from '../sidebar';

export const ADMIN_NAV: NavItem[] = [
  { key: 'overview', label: 'Overview', href: '/admin', icon: Icons.home },
  { key: 'estudios', label: 'Estudios', href: '/admin/estudios', icon: Icons.bank },
  { key: 'usuarios', label: 'Usuarios', href: '/admin/usuarios', icon: Icons.people },
  { key: 'suscripciones', label: 'Suscripciones', href: '/admin/suscripciones', icon: Icons.receipt },
  { key: 'facturacion', label: 'Facturación', href: '/admin/facturacion', icon: Icons.receipt },
  { key: 'metricas', label: 'Métricas', href: '/admin/metricas', icon: Icons.event },
  { key: 'integraciones', label: 'Integraciones', href: '/admin/integraciones', icon: Icons.task },
  { key: 'logs', label: 'Logs', href: '/admin/logs', icon: Icons.task },
  { key: 'configuracion', label: 'Configuración', href: '/admin/configuracion', icon: Icons.settings },
];
