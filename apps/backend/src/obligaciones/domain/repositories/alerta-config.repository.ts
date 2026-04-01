export interface AlertaConfigData {
  tenantId: string;
  diasAnticipacion: number;
  canalNotificacion: 'EMAIL' | 'INTERNAL' | 'BOTH';
  activa: boolean;
}

export interface AlertaConfigRepository {
  findByTenantId(tenantId: string): Promise<AlertaConfigData | null>;
  save(config: AlertaConfigData): Promise<void>;
}

export const ALERTA_CONFIG_REPOSITORY = Symbol('AlertaConfigRepository');
