export interface EstudioInfo {
  id: string;
  nombre: string;
}

export interface EstudioLookupService {
  findById(id: string): Promise<EstudioInfo | null>;
}

export const ESTUDIO_LOOKUP_SERVICE = Symbol('EstudioLookupService');
