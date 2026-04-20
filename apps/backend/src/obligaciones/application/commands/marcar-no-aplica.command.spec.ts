import { MarcarNoAplicaHandler } from './marcar-no-aplica.command';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import { TIPO_OBLIGACION, ESTADO_VENCIMIENTO } from '@numerito/shared';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

describe('MarcarNoAplicaHandler', () => {
  let handler: MarcarNoAplicaHandler;
  let mockRepo: any;

  const makeVencimiento = (estado = ESTADO_VENCIMIENTO.PENDIENTE) => {
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
      },
      'v-1',
    );
  };

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new MarcarNoAplicaHandler(mockRepo);
  });

  it('should mark a PENDIENTE vencimiento as NO_APLICA', async () => {
    const vencimiento = makeVencimiento();
    mockRepo.findById.mockResolvedValue(vencimiento);

    const result = await handler.execute(principal, {
      vencimientoId: 'v-1',
      motivo: 'Cliente dado de baja',
    });

    expect(result.estado).toBe(ESTADO_VENCIMIENTO.NO_APLICA);
    expect(result.motivo).toBe('Cliente dado de baja');
    expect(mockRepo.save).toHaveBeenCalledWith(principal, vencimiento);
  });

  it('should throw RecursoNoEncontradoError if vencimiento not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(principal, {
        vencimientoId: 'bad-id',
        motivo: 'No aplica',
      }),
    ).rejects.toThrow(RecursoNoEncontradoError);
  });

  it('should propagate domain error if vencimiento is not PENDIENTE', async () => {
    const vencimiento = makeVencimiento(ESTADO_VENCIMIENTO.PRESENTADO);
    mockRepo.findById.mockResolvedValue(vencimiento);

    await expect(
      handler.execute(principal, {
        vencimientoId: 'v-1',
        motivo: 'No aplica',
      }),
    ).rejects.toThrow('Solo se puede marcar como no aplica un vencimiento en estado PENDIENTE');
  });

  it('should pass principal to repository findById', async () => {
    mockRepo.findById.mockResolvedValue(makeVencimiento());

    await handler.execute(principal, {
      vencimientoId: 'v-1',
      motivo: 'No aplica',
    });

    expect(mockRepo.findById).toHaveBeenCalledWith(principal, 'v-1');
  });
});
