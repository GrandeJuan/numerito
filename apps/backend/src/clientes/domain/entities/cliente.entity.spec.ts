import { Cliente } from './cliente.entity';
import { Cuit } from '../value-objects/cuit.vo';
import { RazonSocial } from '../value-objects/razon-social.vo';
import { InscripcionJurisdiccion } from '../value-objects/inscripcion-jurisdiccion.vo';
import { CONDICION_IVA, PROVINCIA, TIPO_CLIENTE, REGIMEN, JURISDICCION } from '@numerito/shared';
import { InscripcionDuplicadaError } from '../../../shared/domain/exceptions';

describe('Cliente Entity (Aggregate Root)', () => {
  const createCliente = () => {
    return Cliente.create({
      cuit: Cuit.create('20-12345678-6'),
      razonSocial: RazonSocial.create('Grande & Asociados S.A.'),
      condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
      tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
      regimen: REGIMEN.GENERAL,
      estudioId: 'estudio-1',
    });
  };

  it('should create a cliente with valid data', () => {
    const cliente = createCliente();
    expect(cliente.id).toBeDefined();
    expect(cliente.cuit.raw).toBe('20123456786');
    expect(cliente.razonSocial.value).toBe('Grande & Asociados S.A.');
    expect(cliente.condicionIva).toBe(CONDICION_IVA.RESPONSABLE_INSCRIPTO);
    expect(cliente.tipo).toBe(TIPO_CLIENTE.PERSONA_JURIDICA);
    expect(cliente.regimen).toBe(REGIMEN.GENERAL);
    expect(cliente.estudioId).toBe('estudio-1');
    expect(cliente.isActive).toBe(true);
    expect(cliente.provincias).toEqual([]);
  });

  it('should change condicion IVA', () => {
    const cliente = createCliente();
    cliente.changeCondicionIva(CONDICION_IVA.MONOTRIBUTO);
    expect(cliente.condicionIva).toBe(CONDICION_IVA.MONOTRIBUTO);
  });

  it('should change regimen', () => {
    const cliente = createCliente();
    cliente.changeRegimen(REGIMEN.MONOTRIBUTO);
    expect(cliente.regimen).toBe(REGIMEN.MONOTRIBUTO);
  });

  it('should assign responsable', () => {
    const cliente = createCliente();
    cliente.assignResponsable('user-123');
    expect(cliente.responsableId).toBe('user-123');
  });

  it('should manage provincias', () => {
    const cliente = createCliente();
    cliente.addProvincia(PROVINCIA.BUENOS_AIRES);
    cliente.addProvincia(PROVINCIA.CABA);
    expect(cliente.provincias).toEqual([PROVINCIA.BUENOS_AIRES, PROVINCIA.CABA]);

    // No duplicates
    cliente.addProvincia(PROVINCIA.BUENOS_AIRES);
    expect(cliente.provincias).toHaveLength(2);

    cliente.removeProvincia(PROVINCIA.CABA);
    expect(cliente.provincias).toEqual([PROVINCIA.BUENOS_AIRES]);
  });

  it('should soft delete (deactivate)', () => {
    const cliente = createCliente();
    cliente.deactivate();
    expect(cliente.isActive).toBe(false);
  });

  it('should reactivate', () => {
    const cliente = createCliente();
    cliente.deactivate();
    cliente.activate();
    expect(cliente.isActive).toBe(true);
  });

  it('should update razon social', () => {
    const cliente = createCliente();
    const newRazonSocial = RazonSocial.create('Perez & Cia S.R.L.');
    cliente.updateRazonSocial(newRazonSocial);
    expect(cliente.razonSocial.value).toBe('Perez & Cia S.R.L.');
  });

  describe('actualizarPerfilFiscal', () => {
    it('should set inscripciones and emit domain event', () => {
      const cliente = createCliente();
      const inscripciones = [
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARCA,
          regimen: 'IVA',
          activa: true,
          desde: '2024-01-01',
        }),
      ];

      cliente.actualizarPerfilFiscal(inscripciones);

      expect(cliente.inscripciones).toHaveLength(1);
      expect(cliente.inscripciones[0].jurisdiccion).toBe(JURISDICCION.ARCA);
      expect(cliente.inscripciones[0].regimen).toBe('IVA');
      expect(cliente.inscripciones[0].activa).toBe(true);

      const events = cliente.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('clientes.perfil-fiscal-actualizado');
    });

    it('should allow multiple inscripciones in different jurisdicciones', () => {
      const cliente = createCliente();
      const inscripciones = [
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARCA,
          regimen: 'IVA',
          activa: true,
          desde: '2024-01-01',
        }),
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARBA,
          regimen: 'IIBB',
          activa: true,
          desde: '2024-01-01',
        }),
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.AGIP,
          regimen: 'IIBB',
          activa: true,
          desde: '2024-03-01',
        }),
      ];

      cliente.actualizarPerfilFiscal(inscripciones);
      expect(cliente.inscripciones).toHaveLength(3);
    });

    it('should reject duplicate active inscripciones in same jurisdiccion+regimen', () => {
      const cliente = createCliente();
      const inscripciones = [
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARCA,
          regimen: 'IVA',
          activa: true,
          desde: '2024-01-01',
        }),
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARCA,
          regimen: 'IVA',
          activa: true,
          desde: '2024-06-01',
        }),
      ];

      expect(() => cliente.actualizarPerfilFiscal(inscripciones)).toThrow(
        InscripcionDuplicadaError,
      );
    });

    it('should allow inactive duplicate in same jurisdiccion+regimen', () => {
      const cliente = createCliente();
      const inscripciones = [
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARCA,
          regimen: 'IVA',
          activa: true,
          desde: '2024-01-01',
        }),
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARCA,
          regimen: 'IVA',
          activa: false,
          desde: '2023-01-01',
        }),
      ];

      cliente.actualizarPerfilFiscal(inscripciones);
      expect(cliente.inscripciones).toHaveLength(2);
    });

    it('should allow same jurisdiccion with different regimen', () => {
      const cliente = createCliente();
      const inscripciones = [
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARCA,
          regimen: 'IVA',
          activa: true,
          desde: '2024-01-01',
        }),
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARCA,
          regimen: 'GANANCIAS',
          activa: true,
          desde: '2024-01-01',
        }),
      ];

      cliente.actualizarPerfilFiscal(inscripciones);
      expect(cliente.inscripciones).toHaveLength(2);
    });

    it('should replace previous inscripciones', () => {
      const cliente = createCliente();
      cliente.actualizarPerfilFiscal([
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARCA,
          regimen: 'IVA',
          activa: true,
          desde: '2024-01-01',
        }),
      ]);

      cliente.clearDomainEvents();
      cliente.actualizarPerfilFiscal([
        InscripcionJurisdiccion.create({
          jurisdiccion: JURISDICCION.ARBA,
          regimen: 'IIBB',
          activa: true,
          desde: '2024-06-01',
        }),
      ]);

      expect(cliente.inscripciones).toHaveLength(1);
      expect(cliente.inscripciones[0].jurisdiccion).toBe(JURISDICCION.ARBA);
      expect(cliente.getDomainEvents()).toHaveLength(1);
    });

    it('should allow empty inscripciones', () => {
      const cliente = createCliente();
      cliente.actualizarPerfilFiscal([]);
      expect(cliente.inscripciones).toHaveLength(0);
      expect(cliente.getDomainEvents()).toHaveLength(1);
    });
  });

  describe('overridesResponsable', () => {
    it('should start with empty overrides', () => {
      const cliente = createCliente();
      expect(cliente.overridesResponsable).toEqual({});
    });

    it('should assign a responsable override for a specific obligation type', () => {
      const cliente = createCliente();
      cliente.asignarResponsablePorObligacion('IVA', 'user-200');
      expect(cliente.overridesResponsable).toEqual({ IVA: 'user-200' });
    });

    it('should allow multiple overrides for different obligation types', () => {
      const cliente = createCliente();
      cliente.asignarResponsablePorObligacion('IVA', 'user-200');
      cliente.asignarResponsablePorObligacion('IIBB', 'user-300');
      expect(cliente.overridesResponsable).toEqual({ IVA: 'user-200', IIBB: 'user-300' });
    });

    it('should replace an existing override for the same obligation type', () => {
      const cliente = createCliente();
      cliente.asignarResponsablePorObligacion('IVA', 'user-200');
      cliente.asignarResponsablePorObligacion('IVA', 'user-999');
      expect(cliente.overridesResponsable).toEqual({ IVA: 'user-999' });
    });

    it('should remove an override', () => {
      const cliente = createCliente();
      cliente.asignarResponsablePorObligacion('IVA', 'user-200');
      cliente.quitarOverrideResponsable('IVA');
      expect(cliente.overridesResponsable).toEqual({});
    });

    it('should resolve override over default responsable', () => {
      const cliente = createCliente();
      cliente.assignResponsable('user-default');
      cliente.asignarResponsablePorObligacion('IVA', 'user-override');
      expect(cliente.resolverResponsable('IVA')).toBe('user-override');
    });

    it('should fall back to default responsable when no override exists', () => {
      const cliente = createCliente();
      cliente.assignResponsable('user-default');
      expect(cliente.resolverResponsable('IVA')).toBe('user-default');
    });

    it('should return undefined when no override and no default', () => {
      const cliente = createCliente();
      expect(cliente.resolverResponsable('IVA')).toBeUndefined();
    });
  });

  describe('reconstitute', () => {
    it('should preserve all fields including persisted state', () => {
      const cliente = Cliente.reconstitute({
        cuit: Cuit.create('20-12345678-6'),
        razonSocial: RazonSocial.create('Grande & Asociados S.A.'),
        condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
        tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
        regimen: REGIMEN.GENERAL,
        estudioId: 'estudio-1',
        isActive: false,
        responsableId: 'user-42',
        provincias: [PROVINCIA.BUENOS_AIRES, PROVINCIA.CABA],
      }, 'existing-id');

      expect(cliente.id).toBe('existing-id');
      expect(cliente.cuit.raw).toBe('20123456786');
      expect(cliente.razonSocial.value).toBe('Grande & Asociados S.A.');
      expect(cliente.condicionIva).toBe(CONDICION_IVA.RESPONSABLE_INSCRIPTO);
      expect(cliente.tipo).toBe(TIPO_CLIENTE.PERSONA_JURIDICA);
      expect(cliente.regimen).toBe(REGIMEN.GENERAL);
      expect(cliente.estudioId).toBe('estudio-1');
      expect(cliente.isActive).toBe(false);
      expect(cliente.responsableId).toBe('user-42');
      expect(cliente.provincias).toEqual([PROVINCIA.BUENOS_AIRES, PROVINCIA.CABA]);
    });

    it('should preserve inscripciones on reconstitute', () => {
      const cliente = Cliente.reconstitute({
        cuit: Cuit.create('20-12345678-6'),
        razonSocial: RazonSocial.create('Test S.A.'),
        condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
        tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
        regimen: REGIMEN.GENERAL,
        estudioId: 'estudio-1',
        isActive: true,
        inscripciones: [
          { jurisdiccion: JURISDICCION.ARCA, regimen: 'IVA', activa: true, desde: '2024-01-01' },
          { jurisdiccion: JURISDICCION.ARBA, regimen: 'IIBB', activa: false, desde: '2023-06-01' },
        ],
      }, 'id-x');

      expect(cliente.inscripciones).toHaveLength(2);
      expect(cliente.inscripciones[0].jurisdiccion).toBe(JURISDICCION.ARCA);
      expect(cliente.inscripciones[1].activa).toBe(false);
    });

    it('should preserve overridesResponsable on reconstitute', () => {
      const cliente = Cliente.reconstitute({
        cuit: Cuit.create('20-12345678-6'),
        razonSocial: RazonSocial.create('Test S.A.'),
        condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
        tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
        regimen: REGIMEN.GENERAL,
        estudioId: 'estudio-1',
        isActive: true,
        responsableId: 'user-42',
        overridesResponsable: { IVA: 'user-200', IIBB: 'user-300' },
      }, 'id-overrides');

      expect(cliente.overridesResponsable).toEqual({ IVA: 'user-200', IIBB: 'user-300' });
      expect(cliente.resolverResponsable('IVA')).toBe('user-200');
      expect(cliente.resolverResponsable('GANANCIAS')).toBe('user-42');
    });

    it('should not emit domain events on reconstitute', () => {
      const cliente = Cliente.reconstitute({
        cuit: Cuit.create('20-12345678-6'),
        razonSocial: RazonSocial.create('Test S.A.'),
        condicionIva: CONDICION_IVA.MONOTRIBUTO,
        tipo: TIPO_CLIENTE.PERSONA_FISICA,
        regimen: REGIMEN.MONOTRIBUTO,
        estudioId: 'e1',
        isActive: true,
      }, 'id-1');

      expect(cliente.getDomainEvents()).toHaveLength(0);
    });

    it('should allow domain operations on reconstituted entities', () => {
      const cliente = Cliente.reconstitute({
        cuit: Cuit.create('20-12345678-6'),
        razonSocial: RazonSocial.create('Test S.A.'),
        condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
        tipo: TIPO_CLIENTE.PERSONA_JURIDICA,
        regimen: REGIMEN.GENERAL,
        estudioId: 'e1',
        isActive: true,
      }, 'id-1');

      cliente.changeCondicionIva(CONDICION_IVA.MONOTRIBUTO);
      expect(cliente.condicionIva).toBe(CONDICION_IVA.MONOTRIBUTO);

      cliente.deactivate();
      expect(cliente.isActive).toBe(false);

      cliente.assignResponsable('user-99');
      expect(cliente.responsableId).toBe('user-99');
    });
  });
});
