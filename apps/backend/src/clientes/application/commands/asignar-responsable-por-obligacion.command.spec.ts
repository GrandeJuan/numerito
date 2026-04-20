import {
  AsignarResponsablePorObligacionHandler,
  type AsignarResponsablePorObligacionCommand,
} from './asignar-responsable-por-obligacion.command';
import { Cliente } from '../../domain/entities/cliente.entity';
import { Cuit } from '../../domain/value-objects/cuit.vo';
import { RazonSocial } from '../../domain/value-objects/razon-social.vo';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

const makeCliente = () =>
  Cliente.create(
    {
      cuit: Cuit.create('20-12345678-6'),
      razonSocial: RazonSocial.create('Test SRL'),
      condicionIva: 'RESPONSABLE_INSCRIPTO',
      tipo: 'PERSONA_JURIDICA',
      regimen: 'GENERAL',
      estudioId: 'estudio-1',
    },
    'cliente-1',
  );

describe('AsignarResponsablePorObligacion Command', () => {
  let handler: AsignarResponsablePorObligacionHandler;
  let mockClienteRepo: any;

  beforeEach(() => {
    mockClienteRepo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new AsignarResponsablePorObligacionHandler(mockClienteRepo);
  });

  it('should throw when cliente not found', async () => {
    mockClienteRepo.findById.mockResolvedValue(null);
    await expect(
      handler.execute(principal, {
        clienteId: 'nonexistent',
        tipoObligacion: 'IVA',
        responsableId: 'user-200',
      }),
    ).rejects.toThrow('Cliente no encontrado');
  });

  it('should set override responsable on the client', async () => {
    const cliente = makeCliente();
    mockClienteRepo.findById.mockResolvedValue(cliente);

    await handler.execute(principal, {
      clienteId: 'cliente-1',
      tipoObligacion: 'IVA',
      responsableId: 'user-200',
    });

    expect(cliente.overridesResponsable).toEqual({ IVA: 'user-200' });
    expect(mockClienteRepo.save).toHaveBeenCalledWith(principal, cliente);
  });

  it('should replace existing override for same tipo', async () => {
    const cliente = makeCliente();
    cliente.asignarResponsablePorObligacion('IVA', 'user-old');
    mockClienteRepo.findById.mockResolvedValue(cliente);

    await handler.execute(principal, {
      clienteId: 'cliente-1',
      tipoObligacion: 'IVA',
      responsableId: 'user-new',
    });

    expect(cliente.overridesResponsable).toEqual({ IVA: 'user-new' });
  });
});
