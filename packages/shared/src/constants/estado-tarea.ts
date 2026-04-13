export const ESTADO_TAREA = {
  PENDIENTE: 'PENDIENTE',
  EN_PROGRESO: 'EN_PROGRESO',
  COMPLETADO: 'COMPLETADO',
} as const;

export type EstadoTarea = (typeof ESTADO_TAREA)[keyof typeof ESTADO_TAREA];

export const ESTADO_TAREA_LABELS: Record<EstadoTarea, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En Progreso',
  COMPLETADO: 'Completada',
};
