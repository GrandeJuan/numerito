import { ReasignarResponsableHandler } from './reasignar-responsable.command';
import { Cliente } from '../../../clientes/domain/entities/cliente.entity';
import { Cuit } from '../../../clientes/domain/value-objects/cuit.vo';
import { RazonSocial } from '../../../clientes/domain/value-objects/razon-social.vo';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import { TIPO_OBLIGACION, ESTADO_VENCIMIENTO } from '@numerito/shared';
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

const makeFutureVencimiento = (tipo: string, id: string, responsableId: string | null = null) =>
  Vencimiento.reconstitute(
    {
      clienteId: 'cliente-1',
      estudioId: 'estudio-1',
      tipoObligacion: tipo as any,
      periodo: '2030-06',
      fechaVencimiento: new Date('2030-07-15'),
      fechaNominal: null,
      descripcion: `DDJJ ${tipo}`,
      estado: ESTADO_VENCIMIENTO.PENDIENTE,
      motivo: null,
      fechaProrrogada: null,
      responsableId,
    },
    id,
  );

describe('ReasignarResponsable Command', () => {
  let handler: ReasignarResponsableHandler;
  let mockVencimientoRepo: any;
  let mockClienteRepo: any;

  beforeEach(() => {
    mockVencimientoRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByClienteId: jest.fn().mockResolvedValue([]),
      findByPeriodo: jest.fn(),
      findByEstado: jest.fn(),
      findProximosAVencer: jest.fn(),
      findByClienteAndPeriodo: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockClienteRepo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new ReasignarResponsableHandler(mockVencimientoRepo, mockClienteRepo);
  });

  it('should throw when cliente not found', async () => {
    mockClienteRepo.findById.mockResolvedValue(null);
    await expect(
      handler.execute(principal, {
        clienteId: 'nonexistent',
        tipoObligacion: TIPO_OBLIGACION.IVA,
        nuevoResponsableId: 'user-200',
      }),
    ).rejects.toThrow('Cliente no encontrado');
  });

  it('should update override on cliente and reassign future PENDIENTE vencimientos', async () => {
    const cliente = makeCliente();
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const v1 = makeFutureVencimiento(TIPO_OBLIGACION.IVA, 'v-1', 'user-old');
    const v2 = makeFutureVencimiento(TIPO_OBLIGACION.IVA, 'v-2', 'user-old');
    mockVencimientoRepo.findByClienteId.mockResolvedValue([v1, v2]);

    const result = await handler.execute(principal, {
      clienteId: 'cliente-1',
      tipoObligacion: TIPO_OBLIGACION.IVA,
      nuevoResponsableId: 'user-new',
    });

    expect(result.vencimientosActualizados).toBe(2);
    expect(v1.responsableId).toBe('user-new');
    expect(v2.responsableId).toBe('user-new');
    expect(cliente.overridesResponsable).toEqual({ [TIPO_OBLIGACION.IVA]: 'user-new' });
    expect(mockVencimientoRepo.save).toHaveBeenCalledTimes(2);
  });

  it('should not reassign vencimientos of different tipo', async () => {
    const cliente = makeCliente();
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const ivaVenc = makeFutureVencimiento(TIPO_OBLIGACION.IVA, 'v-1', 'user-old');
    const iibbVenc = makeFutureVencimiento(TIPO_OBLIGACION.IIBB_ARBA, 'v-2', 'user-old');
    mockVencimientoRepo.findByClienteId.mockResolvedValue([ivaVenc, iibbVenc]);

    const result = await handler.execute(principal, {
      clienteId: 'cliente-1',
      tipoObligacion: TIPO_OBLIGACION.IVA,
      nuevoResponsableId: 'user-new',
    });

    expect(result.vencimientosActualizados).toBe(1);
    expect(ivaVenc.responsableId).toBe('user-new');
    expect(iibbVenc.responsableId).toBe('user-old');
  });

  it('should not reassign PRESENTADO vencimientos', async () => {
    const cliente = makeCliente();
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const pendiente = makeFutureVencimiento(TIPO_OBLIGACION.IVA, 'v-1');
    const presentado = Vencimiento.reconstitute(
      {
        clienteId: 'cliente-1',
        estudioId: 'estudio-1',
        tipoObligacion: TIPO_OBLIGACION.IVA,
        periodo: '2030-06',
        fechaVencimiento: new Date('2030-07-15'),
        fechaNominal: null,
        descripcion: 'IVA',
        estado: ESTADO_VENCIMIENTO.PRESENTADO,
        motivo: null,
        fechaProrrogada: null,
        responsableId: 'user-old',
      },
      'v-2',
    );
    mockVencimientoRepo.findByClienteId.mockResolvedValue([pendiente, presentado]);

    const result = await handler.execute(principal, {
      clienteId: 'cliente-1',
      tipoObligacion: TIPO_OBLIGACION.IVA,
      nuevoResponsableId: 'user-new',
    });

    expect(result.vencimientosActualizados).toBe(1);
    expect(pendiente.responsableId).toBe('user-new');
    expect(presentado.responsableId).toBe('user-old');
  });

  it('should not reassign past vencimientos', async () => {
    const cliente = makeCliente();
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const pastVenc = Vencimiento.reconstitute(
      {
        clienteId: 'cliente-1',
        estudioId: 'estudio-1',
        tipoObligacion: TIPO_OBLIGACION.IVA,
        periodo: '2020-01',
        fechaVencimiento: new Date('2020-02-15'),
        fechaNominal: null,
        descripcion: 'IVA',
        estado: ESTADO_VENCIMIENTO.PENDIENTE,
        motivo: null,
        fechaProrrogada: null,
        responsableId: 'user-old',
      },
      'v-past',
    );
    mockVencimientoRepo.findByClienteId.mockResolvedValue([pastVenc]);

    const result = await handler.execute(principal, {
      clienteId: 'cliente-1',
      tipoObligacion: TIPO_OBLIGACION.IVA,
      nuevoResponsableId: 'user-new',
    });

    expect(result.vencimientosActualizados).toBe(0);
    expect(pastVenc.responsableId).toBe('user-old');
  });
});
