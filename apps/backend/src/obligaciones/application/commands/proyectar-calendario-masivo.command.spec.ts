import {
  ProyectarCalendarioMasivoHandler,
  type ProyectarCalendarioMasivoResult,
} from './proyectar-calendario-masivo.command';
import { ProyectarCalendarioMensualHandler } from './proyectar-calendario-mensual.command';
import { Cliente } from '../../../clientes/domain/entities/cliente.entity';
import { Cuit } from '../../../clientes/domain/value-objects/cuit.vo';
import { RazonSocial } from '../../../clientes/domain/value-objects/razon-social.vo';
import { InscripcionJurisdiccion } from '../../../clientes/domain/value-objects/inscripcion-jurisdiccion.vo';
import { JURISDICCION } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { EventBus } from '../../../shared/domain/event-bus';
import type { ClienteRepository } from '../../../clientes/domain/repositories/cliente.repository';
import { CalendarioMensualListo } from '../../domain/events/calendario-mensual-listo.event';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

const makeCliente = (id: string, nombre: string, withInscripciones: boolean) => {
  const cliente = Cliente.create(
    {
      cuit: Cuit.create('20-12345678-6'),
      razonSocial: RazonSocial.create(nombre),
      condicionIva: 'RESPONSABLE_INSCRIPTO',
      tipo: 'PERSONA_JURIDICA',
      regimen: 'GENERAL',
      estudioId: 'estudio-1',
    },
    id,
  );
  if (withInscripciones) {
    const insc = InscripcionJurisdiccion.create({
      jurisdiccion: JURISDICCION.NACIONAL,
      regimen: 'GENERAL',
      activa: true,
      desde: new Date('2025-01-01'),
    });
    cliente.actualizarPerfilFiscal([insc]);
    cliente.clearDomainEvents();
  }
  return cliente;
};

describe('ProyectarCalendarioMasivo Command', () => {
  let handler: ProyectarCalendarioMasivoHandler;
  let clienteRepo: jest.Mocked<ClienteRepository>;
  let proyectarHandler: jest.Mocked<ProyectarCalendarioMensualHandler>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    clienteRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCuit: jest.fn(),
      findByResponsableId: jest.fn(),
    };
    proyectarHandler = {
      execute: jest.fn(),
    } as any;
    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };
    handler = new ProyectarCalendarioMasivoHandler(clienteRepo, proyectarHandler, eventBus);
  });

  it('should project for all active clients with inscripciones', async () => {
    const cliente1 = makeCliente('c1', 'Empresa A', true);
    const cliente2 = makeCliente('c2', 'Empresa B', true);
    clienteRepo.findAll.mockResolvedValue([cliente1, cliente2]);
    proyectarHandler.execute.mockResolvedValue({
      proyectados: 3,
      omitidos: 0,
      errores: [],
    });

    const result = await handler.execute(principal, { periodo: '2026-05' });

    expect(result.clientesProcesados).toBe(2);
    expect(result.totalProyectados).toBe(6);
    expect(result.resumenPorCliente).toHaveLength(2);
    expect(proyectarHandler.execute).toHaveBeenCalledTimes(2);
  });

  it('should skip clients without active inscripciones', async () => {
    const clienteWithInsc = makeCliente('c1', 'Con Inscr', true);
    const clienteWithout = makeCliente('c2', 'Sin Inscr', false);
    clienteRepo.findAll.mockResolvedValue([clienteWithInsc, clienteWithout]);
    proyectarHandler.execute.mockResolvedValue({
      proyectados: 2,
      omitidos: 0,
      errores: [],
    });

    const result = await handler.execute(principal, { periodo: '2026-05' });

    expect(result.clientesProcesados).toBe(1);
    expect(result.clientesOmitidos).toBe(1);
    expect(proyectarHandler.execute).toHaveBeenCalledTimes(1);
  });

  it('should emit calendario-mensual-listo event per client with projections', async () => {
    const cliente = makeCliente('c1', 'Empresa A', true);
    clienteRepo.findAll.mockResolvedValue([cliente]);
    proyectarHandler.execute.mockResolvedValue({
      proyectados: 5,
      omitidos: 0,
      errores: [],
    });

    await handler.execute(principal, { periodo: '2026-05' });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = (eventBus.publish as jest.Mock).mock.calls[0][0] as CalendarioMensualListo;
    expect(event.eventName).toBe('obligaciones.calendario-mensual-listo');
    expect(event.estudioId).toBe('estudio-1');
    expect(event.clienteId).toBe('c1');
    expect(event.clienteNombre).toBe('Empresa A');
    expect(event.periodo).toBe('2026-05');
    expect(event.totalVencimientos).toBe(5);
  });

  it('should not emit event when no vencimientos projected', async () => {
    const cliente = makeCliente('c1', 'Empresa A', true);
    clienteRepo.findAll.mockResolvedValue([cliente]);
    proyectarHandler.execute.mockResolvedValue({
      proyectados: 0,
      omitidos: 3,
      errores: [],
    });

    const result = await handler.execute(principal, { periodo: '2026-05' });

    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(result.resumenPorCliente).toHaveLength(0);
  });

  it('should capture errors per client without stopping batch', async () => {
    const cliente1 = makeCliente('c1', 'Empresa OK', true);
    const cliente2 = makeCliente('c2', 'Empresa Fail', true);
    clienteRepo.findAll.mockResolvedValue([cliente1, cliente2]);
    proyectarHandler.execute
      .mockResolvedValueOnce({ proyectados: 2, omitidos: 0, errores: [] })
      .mockRejectedValueOnce(new Error('DB timeout'));

    const result = await handler.execute(principal, { periodo: '2026-05' });

    expect(result.clientesProcesados).toBe(2);
    expect(result.errores).toHaveLength(1);
    expect(result.errores[0].clienteId).toBe('c2');
    expect(result.errores[0].error).toContain('DB timeout');
    expect(result.totalProyectados).toBe(2);
  });

  it('should return empty result for no active clients', async () => {
    clienteRepo.findAll.mockResolvedValue([]);

    const result = await handler.execute(principal, { periodo: '2026-05' });

    expect(result.clientesProcesados).toBe(0);
    expect(result.totalProyectados).toBe(0);
    expect(result.resumenPorCliente).toHaveLength(0);
  });
});
