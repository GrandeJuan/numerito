export interface AlertaConfigData {
  estudioId: string;
  diasAnticipacion: number;
  canalNotificacion: 'EMAIL' | 'INTERNAL' | 'BOTH';
  activa: boolean;
}

export interface AlertaConfigRepository {
  findConfig(): Promise<AlertaConfigData | null>;
  save(config: AlertaConfigData): Promise<void>;
}

export const ALERTA_CONFIG_REPOSITORY = Symbol('AlertaConfigRepository');
