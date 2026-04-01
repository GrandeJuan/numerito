/**
 * Port for fiscal organism scrapers.
 * Each implementation (ARCA, ARBA, AGIP) runs as a Fargate task
 * on a schedule via EventBridge.
 *
 * Infrastructure:
 * - ECS Fargate task with Playwright headless browser
 * - EventBridge Scheduler: ARCA cada 4h, ARBA/AGIP 1x/día
 * - Credentials in AWS Secrets Manager (CUIT + clave fiscal per client)
 * - Results queued to SQS for async processing
 */

export interface CredencialFiscal {
  cuit: string;
  claveFiscal: string;
  organismo: 'ARCA' | 'ARBA' | 'AGIP';
}

export interface NotificacionScraped {
  cuitCliente: string;
  origen: 'ARCA' | 'ARBA' | 'AGIP';
  asunto: string;
  contenido: string;
  fechaNotificacion: Date;
  archivoAdjunto?: {
    nombre: string;
    contenido: Buffer;
    mimeType: string;
  };
}

export interface FiscalScraperPort {
  obtenerNotificaciones(credencial: CredencialFiscal): Promise<NotificacionScraped[]>;
  verificarConexion(credencial: CredencialFiscal): Promise<boolean>;
}

export const ARCA_SCRAPER = Symbol('ArcaScraper');
export const ARBA_SCRAPER = Symbol('ArbaScraper');
export const AGIP_SCRAPER = Symbol('AgipScraper');
