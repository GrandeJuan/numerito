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
    expect(doc.sizeBytes).toBe(150000);
  });

  it('should expose all getters', () => {
    const doc = Documento.create({
      clienteId: 'c1',
      tenantId: 't1',
      tipo: TIPO_DOCUMENTO.CONTRATO,
      nombre: 'Contrato.pdf',
      s3Key: 'tenants/t1/contrato.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 50000,
    });
    expect(doc.clienteId).toBe('c1');
    expect(doc.tenantId).toBe('t1');
    expect(doc.tipo).toBe(TIPO_DOCUMENTO.CONTRATO);
    expect(doc.nombre).toBe('Contrato.pdf');
    expect(doc.s3Key).toBe('tenants/t1/contrato.pdf');
    expect(doc.mimeType).toBe('application/pdf');
    expect(doc.sizeBytes).toBe(50000);
    expect(doc.version).toBe(1);
  });
});
