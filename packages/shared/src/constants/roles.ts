export const ROL = {
  SOCIO: 'SOCIO',
  RESPONSABLE: 'RESPONSABLE',
  EMPLEADO: 'EMPLEADO',
  CLIENTE: 'CLIENTE',
} as const;

export type Rol = (typeof ROL)[keyof typeof ROL];

export const ROL_LABELS: Record<Rol, string> = {
  SOCIO: 'Socio',
  RESPONSABLE: 'Responsable',
  EMPLEADO: 'Empleado',
  CLIENTE: 'Cliente',
};
