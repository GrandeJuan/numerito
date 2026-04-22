import { ProrrogarVencimientoHandler } from './prorrogar-vencimiento.command';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import { TIPO_OBLIGACION, ESTADO_VENCIMIENTO, type EstadoVencimiento } from '@numerito/shared';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

describe('ProrrogarVencimientoHandler', () => {
  let handler: ProrrogarVencimientoHandler;
  let mockRepo: any;
  let mockEventBus: any;

  const makeVencimiento = (estado: EstadoVencimiento = ESTADO_VENCIMIENTO.PENDIENTE) => {
    return Vencimiento.reconstitute(
      {
        clienteId: 'cliente-1',
        estudioId: 'estudio-1',
        tipoObligacion: TIPO_OBLIGACION.IVA,
        periodo: '2030-03',
        fechaVencimiento: new Date('2030-04-15'),
        fechaNominal: null,
        descripcion: 'IVA mensual',
        estado,
        motivo: null,
        fechaProrrogada: null,
        responsableId: null,
      },
      'v-1',
    );
  };

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };
    handler = new ProrrogarVencimientoHandler(mockRepo, mockEventBus);
  });

  it('should prorrogar a PENDIENTE vencimiento', async () => {
    const vencimiento = makeVencimiento();
    mockRepo.findById.mockResolvedValue(vencimiento);

    const result = await handler.execute(principal, {
      vencimientoId: 'v-1',
      motivo: 'Prórroga ARCA',
      nuevaFecha: '2030-05-01',
    });

    expect(result.estado).toBe(ESTADO_VENCIMIENTO.PRORROGADO);
    expect(result.motivo).toBe('Prórroga ARCA');
    expect(result.fechaProrrogada).toEqual(new Date('2030-05-01'));
    expect(mockRepo.save).toHaveBeenCalledWith(principal, vencimiento);
    expect(mockEventBus.publishAll).toHaveBeenCalled();
  });

  it('should throw RecursoNoEncontradoError if vencimiento not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(principal, {
        vencimientoId: 'bad-id',
        motivo: 'Prórroga',
        nuevaFecha: '2030-05-01',
      }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should propagate domain error if vencimiento is not PENDIENTE', async () => {
    const vencimiento = makeVencimiento(ESTADO_VENCIMIENTO.PRESENTADO);
    mockRepo.findById.mockResolvedValue(vencimiento);

    await expect(
      handler.execute(principal, {
        vencimientoId: 'v-1',
        motivo: 'Prórroga',
        nuevaFecha: '2030-05-01',
      }),
    ).rejects.toThrow('Solo se puede prorrogar un vencimiento en estado PENDIENTE');
  });

  it('should pass principal to repository findById', async () => {
    mockRepo.findById.mockResolvedValue(makeVencimiento());

    await handler.execute(principal, {
      vencimientoId: 'v-1',
      motivo: 'Prórroga',
      nuevaFecha: '2030-05-01',
    });

    expect(mockRepo.findById).toHaveBeenCalledWith(principal, 'v-1');
  });

  it('should clear domain events after publishing', async () => {
    const vencimiento = makeVencimiento();
    mockRepo.findById.mockResolvedValue(vencimiento);

    await handler.execute(principal, {
      vencimientoId: 'v-1',
      motivo: 'Prórroga',
      nuevaFecha: '2030-05-01',
    });

    expect(vencimiento.getDomainEvents()).toHaveLength(0);
  });
});
