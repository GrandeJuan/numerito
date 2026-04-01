import { Cliente } from './cliente.entity';
import { Cuit } from '../value-objects/cuit.vo';
import { RazonSocial } from '../value-objects/razon-social.vo';
import { CONDICION_IVA } from '@numerito/shared';

describe('Cliente Entity (Aggregate Root)', () => {
  const createCliente = () => {
    return Cliente.create({
      cuit: Cuit.create('20-12345678-6'),
      razonSocial: RazonSocial.create('Grande & Asociados S.A.'),
      condicionIva: CONDICION_IVA.RESPONSABLE_INSCRIPTO,
      tenantId: 'tenant-1',
    });
  };

  it('should create a cliente with valid data', () => {
    const cliente = createCliente();
    expect(cliente.id).toBeDefined();
    expect(cliente.cuit.raw).toBe('20123456786');
    expect(cliente.razonSocial.value).toBe('Grande & Asociados S.A.');
    expect(cliente.condicionIva).toBe(CONDICION_IVA.RESPONSABLE_INSCRIPTO);
    expect(cliente.tenantId).toBe('tenant-1');
    expect(cliente.isActive).toBe(true);
  });

  it('should change condicion IVA', () => {
    const cliente = createCliente();
    cliente.changeCondicionIva(CONDICION_IVA.MONOTRIBUTO);
    expect(cliente.condicionIva).toBe(CONDICION_IVA.MONOTRIBUTO);
  });

  it('should update razon social', () => {
    const cliente = createCliente();
    const newRs = RazonSocial.create('Perez S.R.L.');
    cliente.updateRazonSocial(newRs);
    expect(cliente.razonSocial.value).toBe('Perez S.R.L.');
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
});
