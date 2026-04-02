export interface AlertaConfigData {
  estudioId: string;
  diasAnticipacion: number;
  canalNotificacion: 'EMAIL' | 'INTERNAL' | 'BOTH';
  activa: boolean;
}

export interface AlertaConfigRepository {
  findByEstudioId(estudioId: string): Promise<AlertaConfigData | null>;
  save(config: AlertaConfigData): Promise<void>;
}

export const ALERTA_CONFIG_REPOSITORY = Symbol('AlertaConfigRepository');
