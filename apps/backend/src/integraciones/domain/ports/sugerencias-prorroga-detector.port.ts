/**
 * Port invoked by integraciones after a scraping result is processed.
 * Implementation lives in obligaciones — this keeps integraciones' controller
 * and module free of direct imports from obligaciones' application layer.
 */
export interface SugerenciasProrrogaDetectorPort {
  detectar(input: {
    reglasModificadas: Array<{
      tipo: 'NUEVA' | 'MODIFICADA' | 'SIN_CAMBIOS';
      propuesta: {
        tipoObligacion: string;
        diaVencimiento: number;
        mesSiguiente: boolean;
        jurisdiccion: string;
      };
      cambios?: string[];
      reglaActivaId?: string | null;
    }>;
    ejecucionIngestaId: string | null;
  }): Promise<{ sugerenciasCreadas: number; sugerenciasOmitidas: number }>;
}

export const SUGERENCIAS_PRORROGA_DETECTOR = Symbol('SugerenciasProrrogaDetectorPort');
