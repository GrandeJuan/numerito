import { ResumenMensualMapper } from './resumen-mensual.mapper';
import { ResumenMensual, EstadoResumen } from '../../domain/entities/resumen-mensual.entity';
import type { ResumenMensualEntity } from './resumen-mensual.schema';

describe('ResumenMensualMapper', () => {
  const mapper = new ResumenMensualMapper();

  const schemaEntity: ResumenMensualEntity = {
    id: 'resumen-1',
    estudioId: 'estudio-1',
    clienteId: 'cliente-1',
    clienteNombre: 'Empresa Test SRL',
    periodo: '2026-05',
    totalVencimientos: 8,
    estado: 'LISTO',
    pdfBuffer: Buffer.from('pdf content'),
    emailEnviado: true,
    errorMensaje: null,
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-01'),
  };

  it('should map from schema to persistence format', () => {
    const persistence = mapper.fromSchema(schemaEntity);

    expect(persistence.id).toBe('resumen-1');
    expect(persistence.estado).toBe(EstadoResumen.LISTO);
    expect(persistence.pdfBuffer).toEqual(Buffer.from('pdf content'));
    expect(persistence.emailEnviado).toBe(true);
  });

  it('should map from persistence to domain', () => {
    const persistence = mapper.fromSchema(schemaEntity);
    const domain = mapper.toDomain(persistence);

    expect(domain.id).toBe('resumen-1');
    expect(domain.clienteNombre).toBe('Empresa Test SRL');
    expect(domain.periodo).toBe('2026-05');
    expect(domain.estado).toBe(EstadoResumen.LISTO);
    expect(domain.pdfBuffer).toEqual(Buffer.from('pdf content'));
  });

  it('should map from domain to persistence', () => {
    const domain = ResumenMensual.create({
      estudioId: 'estudio-1',
      clienteId: 'cliente-1',
      clienteNombre: 'Empresa Test SRL',
      periodo: '2026-05',
      totalVencimientos: 5,
    });
    domain.marcarListo(Buffer.from('generated pdf'));

    const persistence = mapper.toPersistence(domain);

    expect(persistence.estudioId).toBe('estudio-1');
    expect(persistence.estado).toBe(EstadoResumen.LISTO);
    expect(persistence.pdfBuffer).toEqual(Buffer.from('generated pdf'));
    expect(persistence.emailEnviado).toBe(false);
  });

  it('should handle round-trip correctly', () => {
    const original = ResumenMensual.create({
      estudioId: 'estudio-1',
      clienteId: 'cliente-1',
      clienteNombre: 'Empresa Test SRL',
      periodo: '2026-05',
      totalVencimientos: 3,
    });
    original.marcarListo(Buffer.from('pdf'));
    original.marcarEmailEnviado();

    const persistence = mapper.toPersistence(original);
    const reconstituted = mapper.toDomain(persistence);

    expect(reconstituted.id).toBe(original.id);
    expect(reconstituted.estado).toBe(original.estado);
    expect(reconstituted.emailEnviado).toBe(original.emailEnviado);
    expect(reconstituted.pdfBuffer).toEqual(original.pdfBuffer);
  });
});
