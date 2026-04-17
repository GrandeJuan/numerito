import type { CredencialFiscalData } from '../../domain/repositories/credencial-fiscal.repository';
import {
  CredencialFiscalMapper,
  credencialFiscalPersistenceSchema,
  type CredencialFiscalPersistence,
} from './credencial-fiscal.mapper';
import type { CredencialFiscalEntity } from './credencial-fiscal.schema';

describe('CredencialFiscalMapper', () => {
  const mapper = new CredencialFiscalMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const clienteId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const estudioId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

  const validPersistence: CredencialFiscalPersistence = {
    id: validId,
    clienteId,
    estudioId,
    organismoId: '1',
    cuit: '20-12345678-6',
    secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:cred-abc123',
    ultimaSincronizacion: undefined,
    estado: 'ACTIVA',
  };

  describe('toDomain', () => {
    it('returns a CredencialFiscalData preserving all fields', () => {
      const data = mapper.toDomain(validPersistence);

      expect(data.id).toBe(validId);
      expect(data.clienteId).toBe(clienteId);
      expect(data.estudioId).toBe(estudioId);
      expect(data.organismoId).toBe('1');
      expect(data.cuit).toBe('20-12345678-6');
      expect(data.secretArn).toBe('arn:aws:secretsmanager:us-east-1:123456789012:secret:cred-abc123');
      expect(data.estado).toBe('ACTIVA');
    });

    it('handles optional ultimaSincronizacion when present', () => {
      const date = new Date('2024-12-01');
      const data = mapper.toDomain({ ...validPersistence, ultimaSincronizacion: date });
      expect(data.ultimaSincronizacion).toEqual(date);
    });

    it('omits ultimaSincronizacion when not present', () => {
      const data = mapper.toDomain(validPersistence);
      expect(data.ultimaSincronizacion).toBeUndefined();
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      const bad = { ...validPersistence, id: 'not-a-uuid' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<CredencialFiscalPersistence>;
      delete bad.cuit;
      expect(() => mapper.toDomain(bad as CredencialFiscalPersistence)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from CredencialFiscalData', () => {
      const data: CredencialFiscalData = {
        id: validId,
        clienteId,
        estudioId,
        organismoId: '1',
        cuit: '20-12345678-6',
        secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:cred-abc123',
        estado: 'ACTIVA',
      };
      expect(mapper.toPersistence(data)).toEqual({
        ...validPersistence,
        ultimaSincronizacion: undefined,
      });
    });

    it('produces output that satisfies the persistence schema', () => {
      const data = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(data);
      expect(() => credencialFiscalPersistenceSchema.parse(out)).not.toThrow();
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
      id: validId,
      cliente: { id: clienteId },
      estudio: { id: estudioId },
      organismo: { id: 1 },
      cuit: '20-12345678-6',
      secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:cred-abc123',
      ultimaSincronizacion: undefined,
      estado: 'ACTIVA',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as CredencialFiscalEntity;

    it('flattens populated FK references and casts organismo.id to string', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('preserves ultimaSincronizacion when present', () => {
      const date = new Date('2024-12-01');
      const withSync = { ...schemaEntity, ultimaSincronizacion: date } as CredencialFiscalEntity;
      expect(mapper.fromSchema(withSync).ultimaSincronizacion).toEqual(date);
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const data = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(data.id).toBe(validId);
      expect(data.clienteId).toBe(clienteId);
      expect(data.organismoId).toBe('1');
    });
  });
});
