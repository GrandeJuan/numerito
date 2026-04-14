import { DocumentosController } from './documentos.controller';
import { Documento } from '../../domain/entities/documento.entity';

const makeDocumento = (
  overrides: Partial<{ id: string; clienteId: string; estudioId: string }> = {},
) =>
  Documento.create(
    {
      clienteId: overrides.clienteId ?? 'cliente-1',
      estudioId: overrides.estudioId ?? 'estudio-1',
      tipo: 'BALANCE',
      nombre: 'balance-2025.pdf',
      s3Key: 'documentos/estudio-1/balance-2025.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 102400,
    },
    overrides.id,
  );

describe('DocumentosController', () => {
  let controller: DocumentosController;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByClienteId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };
    controller = new DocumentosController(mockRepo);
  });

  describe('list', () => {
    it('should return paginated documentos for estudio', async () => {
      const docs = [makeDocumento(), makeDocumento({ clienteId: 'cliente-2' })];
      mockRepo.findAll.mockResolvedValue(docs);

      const result = await controller.list('estudio-1', 1, 20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(mockRepo.findAll).toHaveBeenCalled();
    });

    it('should use default page and limit when not provided', async () => {
      mockRepo.findAll.mockResolvedValue([]);

      const result = await controller.list('estudio-1');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should filter by clienteId when provided', async () => {
      const docs = [makeDocumento()];
      mockRepo.findByClienteId.mockResolvedValue(docs);

      const result = await controller.list('estudio-1', 1, 20, 'cliente-1');
      expect(result.data).toHaveLength(1);
      expect(mockRepo.findByClienteId).toHaveBeenCalledWith('cliente-1');
    });
  });

  describe('getById', () => {
    it('should return a documento by id', async () => {
      const doc = makeDocumento();
      mockRepo.findById.mockResolvedValue(doc);

      const result = await controller.getById(doc.id);
      expect(result.data).toBeDefined();
      expect(result.data.nombre).toBe('balance-2025.pdf');
    });

    it('should throw when documento not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(controller.getById('nonexistent')).rejects.toThrow('Documento no encontrado');
    });
  });

  describe('create', () => {
    it('should create a new documento', async () => {
      const dto = {
        clienteId: 'cliente-1',
        tipo: 'BALANCE' as const,
        nombre: 'balance-2025.pdf',
        s3Key: 'documentos/estudio-1/balance-2025.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 102400,
      };

      const result = await controller.create(dto, 'estudio-1');
      expect(result.data.id).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('newVersion', () => {
    it('should update documento version', async () => {
      const doc = makeDocumento();
      mockRepo.findById.mockResolvedValue(doc);

      const dto = { s3Key: 'documentos/estudio-1/balance-2025-v2.pdf', sizeBytes: 204800 };
      const result = await controller.newVersion(doc.id, dto);

      expect(result.data.version).toBe(2);
      expect(result.data.s3Key).toBe(dto.s3Key);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when documento not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(controller.newVersion('bad-id', { s3Key: 'x', sizeBytes: 1 })).rejects.toThrow(
        'Documento no encontrado',
      );
    });
  });
});
