import { Documento } from './documento.entity';
import { TIPO_DOCUMENTO } from '@numerito/shared';

describe('Documento Entity', () => {
  it('should create a documento', () => {
    const doc = Documento.create({
      clienteId: 'c1',
      estudioId: 'e1',
      tipo: TIPO_DOCUMENTO.BALANCE,
      nombre: 'Balance 2025.pdf',
      s3Key: 'estudios/e1/clientes/c1/balances/2025.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 204800,
    });
    expect(doc.id).toBeDefined();
    expect(doc.version).toBe(1);
    expect(doc.tipo).toBe(TIPO_DOCUMENTO.BALANCE);
  });

  it('should increment version on new upload', () => {
    const doc = Documento.create({
      clienteId: 'c1',
      estudioId: 'e1',
      tipo: TIPO_DOCUMENTO.DDJJ,
      nombre: 'DDJJ IVA.pdf',
      s3Key: 'key1',
      mimeType: 'application/pdf',
      sizeBytes: 100000,
    });
    doc.newVersion('key2', 150000);
    expect(doc.version).toBe(2);
    expect(doc.s3Key).toBe('key2');
    expect(doc.sizeBytes).toBe(150000);
  });

  it('should expose all getters', () => {
    const doc = Documento.create({
      clienteId: 'c1',
      estudioId: 'e1',
      tipo: TIPO_DOCUMENTO.CONTRATO,
      nombre: 'Contrato.pdf',
      s3Key: 'estudios/e1/contrato.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 50000,
    });
    expect(doc.clienteId).toBe('c1');
    expect(doc.estudioId).toBe('e1');
    expect(doc.tipo).toBe(TIPO_DOCUMENTO.CONTRATO);
    expect(doc.nombre).toBe('Contrato.pdf');
    expect(doc.s3Key).toBe('estudios/e1/contrato.pdf');
    expect(doc.mimeType).toBe('application/pdf');
    expect(doc.sizeBytes).toBe(50000);
    expect(doc.version).toBe(1);
  });

  describe('reconstitute', () => {
    it('should preserve all fields including version', () => {
      const doc = Documento.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipo: TIPO_DOCUMENTO.BALANCE,
          nombre: 'Balance 2025.pdf',
          s3Key: 'estudios/e1/clientes/c1/balances/2025.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 204800,
          version: 3,
        },
        'existing-id',
      );

      expect(doc.id).toBe('existing-id');
      expect(doc.clienteId).toBe('c1');
      expect(doc.estudioId).toBe('e1');
      expect(doc.tipo).toBe(TIPO_DOCUMENTO.BALANCE);
      expect(doc.nombre).toBe('Balance 2025.pdf');
      expect(doc.s3Key).toBe('estudios/e1/clientes/c1/balances/2025.pdf');
      expect(doc.mimeType).toBe('application/pdf');
      expect(doc.sizeBytes).toBe(204800);
      expect(doc.version).toBe(3);
    });

    it('should not emit domain events on reconstitute', () => {
      const doc = Documento.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipo: TIPO_DOCUMENTO.DDJJ,
          nombre: 'DDJJ.pdf',
          s3Key: 'key1',
          mimeType: 'application/pdf',
          sizeBytes: 100000,
          version: 1,
        },
        'id-1',
      );

      expect(doc.getDomainEvents()).toHaveLength(0);
    });

    it('should allow domain operations on reconstituted entities', () => {
      const doc = Documento.reconstitute(
        {
          clienteId: 'c1',
          estudioId: 'e1',
          tipo: TIPO_DOCUMENTO.BALANCE,
          nombre: 'Balance.pdf',
          s3Key: 'key1',
          mimeType: 'application/pdf',
          sizeBytes: 100000,
          version: 2,
        },
        'id-1',
      );

      doc.newVersion('key2', 150000);
      expect(doc.version).toBe(3);
      expect(doc.s3Key).toBe('key2');
    });
  });
});
