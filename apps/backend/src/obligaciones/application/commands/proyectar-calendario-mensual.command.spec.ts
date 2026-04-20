import {
  ProyectarCalendarioMensualHandler,
  type ProyectarCalendarioMensualCommand,
} from './proyectar-calendario-mensual.command';
import { Cuit } from '../../../clientes/domain/value-objects/cuit.vo';
import { RazonSocial } from '../../../clientes/domain/value-objects/razon-social.vo';
import { InscripcionJurisdiccion } from '../../../clientes/domain/value-objects/inscripcion-jurisdiccion.vo';
import { Cliente } from '../../../clientes/domain/entities/cliente.entity';
import { CatalogoObligacion } from '../../domain/entities/catalogo-obligacion.entity';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import { JURISDICCION, TIPO_OBLIGACION, FRECUENCIA_OBLIGACION } from '@numerito/shared';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { EventBus } from '../../../shared/domain/event-bus';

const principal: EstudioPrincipal = { estudioId: 'estudio-1', userId: 'user-1', roles: [] };

// Future date helpers — use next month to avoid past-date validation issues
const nextMonth = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const makeFutureDate = (day: number): Date => {
  const periodo = nextMonth();
  const [y, m] = periodo.split('-').map(Number);
  return new Date(y, m - 1, day);
};

const makeCliente = (inscripciones: InscripcionJurisdiccion[] = []) => {
  const cliente = Cliente.create(
    {
      cuit: Cuit.create('20-12345678-6'),
      razonSocial: RazonSocial.create('Empresa Test SRL'),
      condicionIva: 'RESPONSABLE_INSCRIPTO',
      tipo: 'PERSONA_JURIDICA',
      regimen: 'GENERAL',
      estudioId: 'estudio-1',
    },
    'cliente-1',
  );
  if (inscripciones.length > 0) {
    cliente.actualizarPerfilFiscal(inscripciones);
    cliente.clearDomainEvents(); // Clear events from setup
  }
  return cliente;
};

const makeCatalogo = (tipo: string, jurisdiccion: string) =>
  CatalogoObligacion.create({
    nombre: `DDJJ ${tipo}`,
    tipoObligacion: tipo as any,
    jurisdiccion: jurisdiccion as any,
    frecuencia: FRECUENCIA_OBLIGACION.MENSUAL,
  });

describe('ProyectarCalendarioMensual Command', () => {
  let handler: ProyectarCalendarioMensualHandler;
  let mockVencimientoRepo: any;
  let mockClienteRepo: any;
  let mockCatalogoRepo: any;
  let mockReglaService: any;
  let mockAjusteService: any;
  let mockEventBus: EventBus;

  const periodo = nextMonth();

  beforeEach(() => {
    mockVencimientoRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByClienteId: jest.fn(),
      findByPeriodo: jest.fn(),
      findByEstado: jest.fn(),
      findProximosAVencer: jest.fn(),
      findByClienteAndPeriodo: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockClienteRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCuit: jest.fn(),
      findByResponsableId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    mockCatalogoRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByJurisdiccion: jest.fn().mockResolvedValue([]),
      findActivos: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    mockReglaService = {
      calcularFechaConPerfil: jest.fn(),
      calcularFechaVencimiento: jest.fn(),
      validarSinConflicto: jest.fn(),
    };
    mockAjusteService = {
      ajustar: jest.fn().mockImplementation((fecha: Date) => Promise.resolve(fecha)),
    };
    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };
    handler = new ProyectarCalendarioMensualHandler(
      mockVencimientoRepo,
      mockClienteRepo,
      mockCatalogoRepo,
      mockReglaService,
      mockAjusteService,
      mockEventBus,
    );
  });

  it('should throw when cliente not found', async () => {
    mockClienteRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(principal, { clienteId: 'nonexistent', periodo }),
    ).rejects.toThrow('Cliente no encontrado');
  });

  it('should throw when cliente has no active inscripciones', async () => {
    const cliente = makeCliente(); // no inscripciones
    mockClienteRepo.findById.mockResolvedValue(cliente);

    await expect(
      handler.execute(principal, { clienteId: 'cliente-1', periodo }),
    ).rejects.toThrow('no tiene inscripciones activas');
  });

  it('should project vencimientos for a single ARCA inscription', async () => {
    const inscripciones = [
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARCA,
        regimen: 'GENERAL',
        activa: true,
        desde: '2024-01-01',
      }),
    ];
    const cliente = makeCliente(inscripciones);
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const catalogo = makeCatalogo(TIPO_OBLIGACION.IVA, JURISDICCION.ARCA);
    mockCatalogoRepo.findByJurisdiccion.mockResolvedValue([catalogo]);

    const futureDate = makeFutureDate(20);
    mockReglaService.calcularFechaConPerfil.mockResolvedValue(futureDate);

    const result = await handler.execute(principal, { clienteId: 'cliente-1', periodo });

    expect(result.proyectados).toBe(1);
    expect(result.omitidos).toBe(0);
    expect(result.errores).toHaveLength(0);
    expect(mockVencimientoRepo.save).toHaveBeenCalledTimes(1);
    expect(mockVencimientoRepo.save).toHaveBeenCalledWith(principal, expect.any(Vencimiento));

    // Verify event published
    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    const events = (mockEventBus.publishAll as jest.Mock).mock.calls[0][0];
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('obligaciones.vencimiento-proyectado');
    expect(events[0].clienteId).toBe('cliente-1');
    expect(events[0].tipoObligacion).toBe(TIPO_OBLIGACION.IVA);
    expect(events[0].periodo).toBe(periodo);
    expect(events[0].estudioId).toBe('estudio-1');
  });

  it('should project vencimientos for multiple inscriptions (ARCA + ARBA)', async () => {
    const inscripciones = [
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARCA,
        regimen: 'GENERAL',
        activa: true,
        desde: '2024-01-01',
      }),
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARBA,
        regimen: 'CONVENIO_MULTILATERAL',
        activa: true,
        desde: '2024-03-01',
      }),
    ];
    const cliente = makeCliente(inscripciones);
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const catalogoARCA = makeCatalogo(TIPO_OBLIGACION.IVA, JURISDICCION.ARCA);
    const catalogoARBA = makeCatalogo(TIPO_OBLIGACION.IIBB, JURISDICCION.ARBA);
    mockCatalogoRepo.findByJurisdiccion
      .mockResolvedValueOnce([catalogoARCA])
      .mockResolvedValueOnce([catalogoARBA]);

    const futureDate = makeFutureDate(20);
    mockReglaService.calcularFechaConPerfil.mockResolvedValue(futureDate);

    const result = await handler.execute(principal, { clienteId: 'cliente-1', periodo });

    expect(result.proyectados).toBe(2);
    expect(mockVencimientoRepo.save).toHaveBeenCalledTimes(2);
    expect(mockCatalogoRepo.findByJurisdiccion).toHaveBeenCalledWith(JURISDICCION.ARCA);
    expect(mockCatalogoRepo.findByJurisdiccion).toHaveBeenCalledWith(JURISDICCION.ARBA);
  });

  it('should be idempotent — skip already projected vencimientos', async () => {
    const inscripciones = [
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARCA,
        regimen: 'GENERAL',
        activa: true,
        desde: '2024-01-01',
      }),
    ];
    const cliente = makeCliente(inscripciones);
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const catalogo = makeCatalogo(TIPO_OBLIGACION.IVA, JURISDICCION.ARCA);
    mockCatalogoRepo.findByJurisdiccion.mockResolvedValue([catalogo]);

    // Simulate an already-existing vencimiento
    const existing = Vencimiento.reconstitute(
      {
        clienteId: 'cliente-1',
        estudioId: 'estudio-1',
        tipoObligacion: TIPO_OBLIGACION.IVA,
        periodo,
        fechaVencimiento: makeFutureDate(20),
        fechaNominal: null,
        descripcion: 'DDJJ IVA',
        estado: 'PENDIENTE',
      },
      'existing-v-1',
    );
    mockVencimientoRepo.findByClienteAndPeriodo.mockResolvedValue([existing]);

    const result = await handler.execute(principal, { clienteId: 'cliente-1', periodo });

    expect(result.proyectados).toBe(0);
    expect(result.omitidos).toBe(1);
    expect(mockVencimientoRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publishAll).not.toHaveBeenCalled();
  });

  it('should skip inactive catalogo entries', async () => {
    const inscripciones = [
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARCA,
        regimen: 'GENERAL',
        activa: true,
        desde: '2024-01-01',
      }),
    ];
    const cliente = makeCliente(inscripciones);
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const activeCatalogo = makeCatalogo(TIPO_OBLIGACION.IVA, JURISDICCION.ARCA);
    const inactiveCatalogo = makeCatalogo(TIPO_OBLIGACION.SICOSS, JURISDICCION.ARCA);
    inactiveCatalogo.desactivar();
    mockCatalogoRepo.findByJurisdiccion.mockResolvedValue([activeCatalogo, inactiveCatalogo]);

    const futureDate = makeFutureDate(20);
    mockReglaService.calcularFechaConPerfil.mockResolvedValue(futureDate);

    const result = await handler.execute(principal, { clienteId: 'cliente-1', periodo });

    expect(result.proyectados).toBe(1);
    expect(mockReglaService.calcularFechaConPerfil).toHaveBeenCalledTimes(1);
  });

  it('should skip inactive inscripciones', async () => {
    const inscripciones = [
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARCA,
        regimen: 'GENERAL',
        activa: true,
        desde: '2024-01-01',
      }),
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARBA,
        regimen: 'CONVENIO_MULTILATERAL',
        activa: false, // Inactive — should be skipped
        desde: '2023-01-01',
      }),
    ];
    const cliente = makeCliente(inscripciones);
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const catalogo = makeCatalogo(TIPO_OBLIGACION.IVA, JURISDICCION.ARCA);
    mockCatalogoRepo.findByJurisdiccion.mockResolvedValue([catalogo]);

    const futureDate = makeFutureDate(20);
    mockReglaService.calcularFechaConPerfil.mockResolvedValue(futureDate);

    const result = await handler.execute(principal, { clienteId: 'cliente-1', periodo });

    expect(result.proyectados).toBe(1);
    // Only called for ARCA, not ARBA
    expect(mockCatalogoRepo.findByJurisdiccion).toHaveBeenCalledTimes(1);
    expect(mockCatalogoRepo.findByJurisdiccion).toHaveBeenCalledWith(JURISDICCION.ARCA);
  });

  it('should pass correct perfil fiscal to regla service', async () => {
    const inscripciones = [
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARCA,
        regimen: 'GENERAL',
        activa: true,
        desde: '2024-01-01',
      }),
    ];
    const cliente = makeCliente(inscripciones);
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const catalogo = makeCatalogo(TIPO_OBLIGACION.IVA, JURISDICCION.ARCA);
    mockCatalogoRepo.findByJurisdiccion.mockResolvedValue([catalogo]);

    const futureDate = makeFutureDate(20);
    mockReglaService.calcularFechaConPerfil.mockResolvedValue(futureDate);

    await handler.execute(principal, { clienteId: 'cliente-1', periodo });

    expect(mockReglaService.calcularFechaConPerfil).toHaveBeenCalledWith(
      TIPO_OBLIGACION.IVA,
      {
        cuit: '20123456786',
        jurisdiccion: JURISDICCION.ARCA,
        regimen: 'GENERAL',
      },
      periodo,
    );
  });

  it('should continue projecting when one obligation fails and record error', async () => {
    const inscripciones = [
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARCA,
        regimen: 'GENERAL',
        activa: true,
        desde: '2024-01-01',
      }),
    ];
    const cliente = makeCliente(inscripciones);
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const cat1 = makeCatalogo(TIPO_OBLIGACION.IVA, JURISDICCION.ARCA);
    const cat2 = makeCatalogo(TIPO_OBLIGACION.SICOSS, JURISDICCION.ARCA);
    mockCatalogoRepo.findByJurisdiccion.mockResolvedValue([cat1, cat2]);

    const futureDate = makeFutureDate(20);
    mockReglaService.calcularFechaConPerfil
      .mockRejectedValueOnce(new Error('No hay regla de vencimiento para IVA con terminación 6'))
      .mockResolvedValueOnce(futureDate);

    const result = await handler.execute(principal, { clienteId: 'cliente-1', periodo });

    expect(result.proyectados).toBe(1);
    expect(result.errores).toHaveLength(1);
    expect(result.errores[0]).toContain('IVA');
    expect(mockVencimientoRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should apply ajuste día hábil and store both fechaNominal and fechaAjustada', async () => {
    const inscripciones = [
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARCA,
        regimen: 'GENERAL',
        activa: true,
        desde: '2024-01-01',
      }),
    ];
    const cliente = makeCliente(inscripciones);
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const catalogo = makeCatalogo(TIPO_OBLIGACION.IVA, JURISDICCION.ARCA);
    mockCatalogoRepo.findByJurisdiccion.mockResolvedValue([catalogo]);

    const fechaNominal = makeFutureDate(20);
    const fechaAjustada = makeFutureDate(22); // Adjusted (e.g., holiday on 20, weekend on 21)
    mockReglaService.calcularFechaConPerfil.mockResolvedValue(fechaNominal);
    mockAjusteService.ajustar.mockResolvedValue(fechaAjustada);

    await handler.execute(principal, { clienteId: 'cliente-1', periodo });

    expect(mockAjusteService.ajustar).toHaveBeenCalledWith(fechaNominal, JURISDICCION.ARCA);

    const savedVencimiento = mockVencimientoRepo.save.mock.calls[0][1] as Vencimiento;
    expect(savedVencimiento.fechaVencimiento).toEqual(fechaAjustada);
    expect(savedVencimiento.fechaNominal).toEqual(fechaNominal);
  });

  it('should use estudioId from principal for created vencimientos', async () => {
    const customPrincipal: EstudioPrincipal = {
      estudioId: 'estudio-99',
      userId: 'user-1',
      roles: [],
    };
    const inscripciones = [
      InscripcionJurisdiccion.create({
        jurisdiccion: JURISDICCION.ARCA,
        regimen: 'GENERAL',
        activa: true,
        desde: '2024-01-01',
      }),
    ];
    const cliente = makeCliente(inscripciones);
    mockClienteRepo.findById.mockResolvedValue(cliente);

    const catalogo = makeCatalogo(TIPO_OBLIGACION.IVA, JURISDICCION.ARCA);
    mockCatalogoRepo.findByJurisdiccion.mockResolvedValue([catalogo]);

    const futureDate = makeFutureDate(20);
    mockReglaService.calcularFechaConPerfil.mockResolvedValue(futureDate);

    await handler.execute(customPrincipal, { clienteId: 'cliente-1', periodo });

    const savedVencimiento = mockVencimientoRepo.save.mock.calls[0][1] as Vencimiento;
    expect(savedVencimiento.estudioId).toBe('estudio-99');
  });
});
