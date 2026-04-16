import { Cliente } from '../../domain/entities/cliente.entity';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import {
  ClienteMapper,
  clientePersistenceSchema,
  type ClientePersistence,
} from './cliente.mapper';
import type { ClienteEntity } from './cliente.schema';
import {
  CONDICION_IVA,
  REGIMEN,
  TIPO_CLIENTE,
} from '@numerito/shared';

describe('ClienteMapper', () => {
  const mapper = new ClienteMapper();
  const validId = '11111111-1111-1111-1111-111111111111';
  const estudioId = 'estudio-1';

  const validPersistence: ClientePersistence = {
    id: validId,
    cuit: '20123456786',
    razonSocial: 'Grande & Asociados S.A.',
    condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
    tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
    regimen: REGIMEN.GENERAL,
    estudioId,
    responsableId: 'user-42',
    isActive: true,
  };

  describe('toDomain', () => {
    it('reconstitutes a Cliente preserving all fields', () => {
      const cliente = mapper.toDomain(validPersistence);

      expect(cliente).toBeInstanceOf(Cliente);
      expect(cliente.id).toBe(validId);
      expect(cliente.cuit.raw).toBe('20123456786');
      expect(cliente.razonSocial.value).toBe('Grande & Asociados S.A.');
      expect(cliente.condicionIva).toBe(CONDICION_IVA.RESPONSABLE_INSCRIPTO);
      expect(cliente.tipo).toBe(TIPO_CLIENTE.PERSONA_JURIDICA);
      expect(cliente.regimen).toBe(REGIMEN.GENERAL);
      expect(cliente.estudioId).toBe(estudioId);
      expect(cliente.isActive).toBe(true);
      expect(cliente.responsableId).toBe('user-42');
    });

    it('omits responsableId when not present', () => {
      const { responsableId: _ignored, ...rest } = validPersistence;
      const cliente = mapper.toDomain(rest as ClientePersistence);
      expect(cliente.responsableId).toBeUndefined();
    });

    it('preserves inactive state', () => {
      const cliente = mapper.toDomain({ ...validPersistence, isActive: false });
      expect(cliente.isActive).toBe(false);
    });

    it('does not emit domain events on reconstitution', () => {
      const cliente = mapper.toDomain(validPersistence);
      expect(cliente.getDomainEvents()).toHaveLength(0);
    });

    it('rejects malformed persistence id (Zod validation)', () => {
      const bad = { ...validPersistence, id: 'not-a-uuid' };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects missing required fields (Zod validation)', () => {
      const bad = { ...validPersistence } as Partial<ClientePersistence>;
      delete bad.cuit;
      expect(() => mapper.toDomain(bad as ClientePersistence)).toThrow();
    });

    it('rejects empty razonSocial (Zod validation)', () => {
      expect(() => mapper.toDomain({ ...validPersistence, razonSocial: '' })).toThrow();
    });

    it('rejects unknown condicionIva codes (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        condicionIva: 'NOT_A_CONDICION' as ClientePersistence['condicionIva'],
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });

    it('rejects wrong types (Zod validation)', () => {
      const bad = {
        ...validPersistence,
        isActive: 'true' as unknown as boolean,
      };
      expect(() => mapper.toDomain(bad)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('extracts the flat persistence shape from a domain Cliente (with responsable)', () => {
      const cliente = Cliente.reconstitute(
        {
          cuit: Cuit.create(validPersistence.cuit),
          razonSocial: RazonSocial.create(validPersistence.razonSocial),
          condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
          tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
          regimen: REGIMEN.GENERAL,
          estudioId,
          isActive: true,
          responsableId: 'user-42',
        },
        validId,
      );

      expect(mapper.toPersistence(cliente)).toEqual(validPersistence);
    });

    it('omits responsableId when absent on the domain entity', () => {
      const cliente = Cliente.reconstitute(
        {
          cuit: Cuit.create(validPersistence.cuit),
          razonSocial: RazonSocial.create(validPersistence.razonSocial),
          condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
          tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
          regimen: REGIMEN.GENERAL,
          estudioId,
          isActive: true,
        },
        validId,
      );

      expect(mapper.toPersistence(cliente).responsableId).toBeUndefined();
    });

    it('unwraps Cuit to its raw string form', () => {
      const cliente = Cliente.reconstitute(
        {
          cuit: Cuit.create('20-12345678-6'),
          razonSocial: RazonSocial.create(validPersistence.razonSocial),
          condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
          tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
          regimen: REGIMEN.GENERAL,
          estudioId,
          isActive: true,
        },
        validId,
      );

      expect(mapper.toPersistence(cliente).cuit).toBe('20123456786');
    });

    it('reflects mutations made via domain methods', () => {
      const cliente = mapper.toDomain(validPersistence);
      cliente.deactivate();
      cliente.changeCondicionIva(CONDICION_IVA.MONOTRIBUTO);

      const persistence = mapper.toPersistence(cliente);
      expect(persistence.isActive).toBe(false);
      expect(persistence.condicionIva).toBe(CONDICION_IVA.MONOTRIBUTO);
    });

    it('produces output that satisfies the persistence schema', () => {
      const cliente = mapper.toDomain(validPersistence);
      const out = mapper.toPersistence(cliente);
      expect(() => clientePersistenceSchema.parse(out)).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('toDomain -> toPersistence is the identity for valid input', () => {
      const cliente = mapper.toDomain(validPersistence);
      expect(mapper.toPersistence(cliente)).toEqual(validPersistence);
    });
  });

  describe('fromSchema', () => {
    const schemaEntity = {
      id: validId,
      cuit: '20123456786',
      razonSocial: 'Grande & Asociados S.A.',
      condicionIva: { codigo: CONDICION_IVA.RESPONSABLE_INSCRIPTO },
      tipoCliente: { codigo: TIPO_CLIENTE.PERSONA_JURIDICA },
      regimen: { codigo: REGIMEN.GENERAL },
      estudio: { id: estudioId },
      responsable: { id: 'user-42' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as ClienteEntity;

    it('flattens populated FK references into ids', () => {
      expect(mapper.fromSchema(schemaEntity)).toEqual(validPersistence);
    });

    it('preserves undefined responsable when absent', () => {
      const withoutResponsable = {
        ...schemaEntity,
        responsable: undefined,
      } as ClienteEntity;
      expect(mapper.fromSchema(withoutResponsable).responsableId).toBeUndefined();
    });

    it('output of fromSchema is consumable by toDomain', () => {
      const cliente = mapper.toDomain(mapper.fromSchema(schemaEntity));
      expect(cliente.id).toBe(validId);
      expect(cliente.estudioId).toBe(estudioId);
      expect(cliente.responsableId).toBe('user-42');
    });
  });
});
