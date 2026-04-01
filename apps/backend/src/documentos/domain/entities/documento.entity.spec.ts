import { Documento, TIPO_DOCUMENTO } from './documento.entity';

describe('Documento Entity', () => {
  it('should create a documento', () => {
    const doc = Documento.create({
      clienteId: 'c1',
      tenantId: 't1',
      tipo: TIPO_DOCUMENTO.BALANCE,
      nombre: 'Balance 2025.pdf',
      s3Key: 'tenants/t1/clientes/c1/balances/2025.pdf',
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
      tenantId: 't1',
      tipo: TIPO_DOCUMENTO.DDJJ,
      nombre: 'DDJJ IVA.pdf',
      s3Key: 'key1',
      mimeType: 'application/pdf',
      sizeBytes: 100000,
    });
    doc.newVersion('key2', 150000);
    expect(doc.version).toBe(2);
    expect(doc.s3Key).toBe('key2');
  });
});
