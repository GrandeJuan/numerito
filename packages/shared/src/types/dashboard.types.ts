export interface DashboardStats {
  kpis: {
    clientes: number;
    vencimientosProximos: number;
    facturacionMes?: number;
    tareasActivas: number;
  };
  vencimientosPorEstado: { estado: string; cantidad: number }[];
  facturacionMensual?: { mes: string; monto: number }[];
  proximosVencimientos: {
    id: string;
    cliente: string;
    obligacion: string;
    fecha: string;
    estado: string;
  }[];
  actividadReciente: { tipo: string; descripcion: string; fecha: string; usuario?: string }[];
  cargaTrabajo?: { usuario: string; tareas: number }[];
}
