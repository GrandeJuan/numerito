import { DomainEvent } from '../../../shared/domain';

export class VencimientoProrrogado extends DomainEvent {
  constructor(
    public readonly vencimientoId: string,
    public readonly clienteId: string,
    public readonly tipoObligacion: string,
    public readonly periodo: string,
    public readonly motivo: string,
    public readonly nuevaFecha: Date,
  ) {
    super();
  }

  get eventName(): string {
    return 'obligaciones.vencimiento-prorrogado';
  }
}
