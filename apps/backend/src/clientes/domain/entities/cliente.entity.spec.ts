import { Cliente } from './cliente.entity';
import { Cuit } from '../value-objects/cuit.vo';
import { RazonSocial } from '../value-objects/razon-social.vo';
import { CONDICION_IVA, PROVINCIA, TIPO_CLIENTE, REGIMEN } from '@numerito/shared';

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
