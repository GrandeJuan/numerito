import { ContabilidadController } from './contabilidad.controller';
import { LibroContable } from '../../domain/entities/libro-contable.entity';
import { AsientoContable, LineaAsiento } from '../../domain/entities/asiento-contable.entity';

const makeLibro = (overrides: Partial<{ id: string; estudioId: string }> = {}) =>
  LibroContable.create(
    {
      clienteId: 'cliente-1',
      estudioId: overrides.estudioId ?? 'estudio-1',
      tipo: 'DIARIO',
      periodo: '2026-01',
    },
    overrides.id,
  );

const balancedLineas: LineaAsiento[] = [
  { cuentaId: 'c1', debe: 1000, haber: 0, descripcion: 'Debe' },
  { cuentaId: 'c2', debe: 0, haber: 1000, descripcion: 'Haber' },
];

const unbalancedLineas: LineaAsiento[] = [
  { cuentaId: 'c1', debe: 1000, haber: 0, descripcion: 'Debe' },
  { cuentaId: 'c2', debe: 0, haber: 500, descripcion: 'Haber' },
];

const makeAsiento = (overrides: Partial<{ id: string; libroId: string }> = {}) =>
  AsientoContable.create(
    {
      libroId: overrides.libroId ?? 'libro-1',
      clienteId: 'cliente-1',
      estudioId: 'estudio-1',
      fecha: new Date('2026-03-01'),
      descripcion: 'Asiento test',
      lineas: balancedLineas,
    },
    overrides.id,
  );

describe('ContabilidadController', () => {
  let controller: ContabilidadController;
  let mockLibroRepo: any;
  let mockAsientoRepo: any;

  beforeEach(() => {
    mockLibroRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByClienteId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    mockAsientoRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByLibroId: jest.fn().mockResolvedValue([]),
      findByClienteId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    controller = new ContabilidadController(mockLibroRepo, mockAsientoRepo);
  });

  describe('stats', () => {
    it('should return contabilidad stats', async () => {
      const libros = [makeLibro(), makeLibro({ id: 'l2' })];
      const asientos = [makeAsiento()];
      mockLibroRepo.findAll.mockResolvedValue(libros);
      mockAsientoRepo.findAll.mockResolvedValue(asientos);

      const result = await controller.stats();
      expect(result.data.asientosDelPeriodo).toBe(1);
      expect(result.data.totalLibros).toBe(2);
      expect(result.data.balanceCuadrado).toBe(true);
    });

    it('should return zero stats when no data', async () => {
      mockAsientoRepo.findAll.mockResolvedValue([]);

      const result = await controller.stats();
      expect(result.data.asientosDelPeriodo).toBe(0);
      expect(result.data.totalLibros).toBe(0);
    });
  });

  describe('listLibros', () => {
    it('should return paginated libros for estudio', async () => {
      const libros = [makeLibro(), makeLibro()];
      mockLibroRepo.findAll.mockResolvedValue(libros);

      const result = await controller.listLibros(1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should use default page and limit when not provided', async () => {
      mockLibroRepo.findAll.mockResolvedValue([]);

      const result = await controller.listLibros();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('createLibro', () => {
    it('should create a new libro', async () => {
      const dto = { clienteId: 'cliente-1', tipo: 'DIARIO', periodo: '2026-01' };
      const result = await controller.createLibro(dto as any, 'estudio-1');
      expect(result.id).toBeDefined();
      expect(mockLibroRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('rubricarLibro', () => {
    it('should rubricar a libro', async () => {
      const libro = makeLibro();
      mockLibroRepo.findById.mockResolvedValue(libro);

      await controller.rubricarLibro(libro.id, { numeroRubrica: 'RUB-001' } as any);
      expect(libro.isRubricado).toBe(true);
      expect(libro.numeroRubrica).toBe('RUB-001');
      expect(mockLibroRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when libro not found', async () => {
      mockLibroRepo.findById.mockResolvedValue(null);

      await expect(
        controller.rubricarLibro('bad-id', { numeroRubrica: 'RUB-001' } as any),
      ).rejects.toThrow('LibroContable no encontrado');
    });
  });

  describe('listAsientosByLibro', () => {
    it('should return asientos for a libro', async () => {
      const libro = makeLibro({ id: 'libro-1' });
      mockLibroRepo.findById.mockResolvedValue(libro);
      const asientos = [makeAsiento({ libroId: 'libro-1' })];
      mockAsientoRepo.findByLibroId.mockResolvedValue(asientos);

      const result = await controller.listAsientosByLibro('libro-1', 1, 20);
      expect(result.data).toHaveLength(1);
    });

    it('should use default page and limit when not provided', async () => {
      const libro = makeLibro({ id: 'libro-1' });
      mockLibroRepo.findById.mockResolvedValue(libro);
      mockAsientoRepo.findByLibroId.mockResolvedValue([]);

      const result = await controller.listAsientosByLibro('libro-1');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should throw when libro not found', async () => {
      mockLibroRepo.findById.mockResolvedValue(null);

      await expect(controller.listAsientosByLibro('bad-id', 1, 20)).rejects.toThrow(
        'LibroContable no encontrado',
      );
    });
  });

  describe('createAsiento', () => {
    it('should create a balanced asiento', async () => {
      const dto = {
        libroId: 'libro-1',
        clienteId: 'cliente-1',
        fecha: '2026-03-01',
        descripcion: 'Test asiento',
        lineas: balancedLineas,
      };
      const result = await controller.createAsiento(dto as any, 'estudio-1');
      expect(result.id).toBeDefined();
      expect(mockAsientoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when asiento is not balanced', async () => {
      const dto = {
        libroId: 'libro-1',
        clienteId: 'cliente-1',
        fecha: '2026-03-01',
        descripcion: 'Unbalanced',
        lineas: unbalancedLineas,
      };

      await expect(controller.createAsiento(dto as any, 'estudio-1')).rejects.toThrow(
        'El asiento contable debe estar balanceado',
      );
      expect(mockAsientoRepo.save).not.toHaveBeenCalled();
    });
  });
});
