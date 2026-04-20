import { ResumenMensual, EstadoResumen } from './resumen-mensual.entity';

describe('ResumenMensual Entity', () => {
  const createProps = {
    estudioId: 'estudio-1',
    clienteId: 'cliente-1',
    clienteNombre: 'Empresa Test SRL',
    periodo: '2026-05',
    totalVencimientos: 8,
  };

  it('should create with GENERANDO state', () => {
    const resumen = ResumenMensual.create(createProps);

    expect(resumen.estudioId).toBe('estudio-1');
    expect(resumen.clienteId).toBe('cliente-1');
    expect(resumen.clienteNombre).toBe('Empresa Test SRL');
    expect(resumen.periodo).toBe('2026-05');
    expect(resumen.totalVencimientos).toBe(8);
    expect(resumen.estado).toBe(EstadoResumen.GENERANDO);
    expect(resumen.pdfBuffer).toBeNull();
    expect(resumen.emailEnviado).toBe(false);
    expect(resumen.errorMensaje).toBeNull();
  });

  it('should transition to LISTO with pdf buffer', () => {
    const resumen = ResumenMensual.create(createProps);
    const buffer = Buffer.from('fake pdf content');

    resumen.marcarListo(buffer);

    expect(resumen.estado).toBe(EstadoResumen.LISTO);
    expect(resumen.pdfBuffer).toBe(buffer);
  });

  it('should mark email as sent', () => {
    const resumen = ResumenMensual.create(createProps);
    resumen.marcarListo(Buffer.from('pdf'));

    resumen.marcarEmailEnviado();

    expect(resumen.emailEnviado).toBe(true);
  });

  it('should transition to ERROR with message', () => {
    const resumen = ResumenMensual.create(createProps);

    resumen.marcarError('Failed to generate PDF');

    expect(resumen.estado).toBe(EstadoResumen.ERROR);
    expect(resumen.errorMensaje).toBe('Failed to generate PDF');
    expect(resumen.pdfBuffer).toBeNull();
  });

  it('should reconstitute from persistence props', () => {
    const resumen = ResumenMensual.reconstitute(
      {
        estudioId: 'estudio-1',
        clienteId: 'cliente-1',
        clienteNombre: 'Empresa Test SRL',
        periodo: '2026-05',
        totalVencimientos: 8,
        estado: EstadoResumen.LISTO,
        pdfBuffer: Buffer.from('pdf data'),
        emailEnviado: true,
        errorMensaje: null,
      },
      'resumen-id',
    );

    expect(resumen.id).toBe('resumen-id');
    expect(resumen.estado).toBe(EstadoResumen.LISTO);
    expect(resumen.emailEnviado).toBe(true);
    expect(resumen.pdfBuffer).toEqual(Buffer.from('pdf data'));
  });
});
