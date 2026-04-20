export interface AlertaConfigData {
  estudioId: string;
  diasAnticipacion: number;
  canalNotificacion: 'EMAIL' | 'INTERNAL' | 'BOTH';
  activa: boolean;
}

export interface AlertaConfigRepository {
  findConfig(): Promise<AlertaConfigData | null>;
  findByEstudioId(estudioId: string): Promise<AlertaConfigData | null>;
  findAllActivas(): Promise<AlertaConfigData[]>;
  save(config: AlertaConfigData): Promise<void>;
}

export const ALERTA_CONFIG_REPOSITORY = Symbol('AlertaConfigRepository');
