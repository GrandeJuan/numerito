import { DomainEvent } from '../../../shared/domain';

export class CalendarioMensualListo extends DomainEvent {
  constructor(
    public readonly estudioId: string,
    public readonly clienteId: string,
    public readonly clienteNombre: string,
    public readonly periodo: string,
    public readonly totalVencimientos: number,
  ) {
    super();
  }

  get eventName(): string {
    return 'obligaciones.calendario-mensual-listo';
  }
}
