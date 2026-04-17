import type { OrganismoFiscalData } from '../../domain/repositories/organismo-fiscal.repository';
import {
  OrganismoFiscalMapper,
  organismoFiscalPersistenceSchema,
  type OrganismoFiscalPersistence,
} from './organismo-fiscal.mapper';
import type { OrganismoFiscalEntity } from '../../../shared/infrastructure/persistence/organismo-fiscal.schema';

describe('OrganismoFiscalMapper', () => {
  const mapper = new OrganismoFiscalMapper();

  const validPersistence: OrganismoFiscalPersistence = {
    id: '1',
    codigo: 'ARCA',
    nombre: 'Administración Federal de Ingresos Públicos',
    jurisdiccion: 'NACIONAL',
    urlPortal: 'https://www.afip.gob.ar',
    requiereScraping: false,
    tieneWebService: true,
    activo: true,
  };

  describe('toDomain', () => {
    it('returns an OrganismoFiscalData preserving all fields', () => {
      const data = mapper.toDomain(validPersistence);

      expect(data.id).toBe('1');
      expect(data.codigo).toBe('ARCA');
      expect(data.nombre).toBe('Administración Federal de Ingresos Públicos');
      expect(data.jurisdiccion).toBe('NACIONAL');
      expect(data.urlPortal).toBe('https://www.afip.gob.ar');
      expect(data.requiereScraping).toBe(false);
      expect(data.tieneWebService).toBe(true);
      expect(data.activo).toBe(true);
    });

    it('handles optional urlPortal when absent', () => {
      const { urlPortal: _ignored, ...rest } = validPersistence;
      const data = mapper.toDomain(rest as OrganismoFiscalPersistence);
      expect(data.urlPortal).toBeUndefined();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<OrganismoFiscalPersistence>;
      delete bad.codigo;
      expect(() => mapper.toDomain(bad as OrganismoFiscalPersistence)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = { ...validPersistence, activo: 'true' as unknown as boolean };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from OrganismoFiscalData', () => {
      const data: OrganismoFiscalData = {
        id: '1',
        codigo: 'ARCA',
        nombre: 'Administración Federal de Ingresos Públicos',
        jurisdiccion: 'NACIONAL',
        urlPortal: 'https://www.afip.gob.ar',
        requiereScraping: false,
        tieneWebService: true,
        activo: true,
      };
      expect(mapper.toPersistence(data)).toEqual(validPersistence);
    });

    it('produces output that satisfies the persistence schema', () => {
      const data = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(data);
      expect(() => organismoFiscalPersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const data = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(data)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: 1,
      codigo: 'ARCA',
      nombre: 'Administración Federal de Ingresos Públicos',
      jurisdiccion: 'NACIONAL',
      urlPortal: 'https://www.afip.gob.ar',
      requiereScraping: false,
      tieneWebService: true,
      activo: true,
    } as unknown as OrganismoFiscalEntity;

    it('casts numeric id to string', () => {
      expect(mapper.fromSchema(schemaEntity).id).toBe('1');
    });

    it('flattens to the expected persistence shape', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('converts empty urlPortal to undefined', () => {
      const withEmpty = { ...schemaEntity, urlPortal: '' } as OrganismoFiscalEntity;
      expect(mapper.fromSchema(withEmpty).urlPortal).toBeUndefined();
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const data = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(data.id).toBe('1');
      expect(data.codigo).toBe('ARCA');
    });
  });
});
