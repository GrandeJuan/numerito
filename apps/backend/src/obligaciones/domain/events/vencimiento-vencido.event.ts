import { DomainEvent } from '../../../shared/domain';

export class VencimientoVencido extends DomainEvent {
  constructor(
    public readonly vencimientoId: string,
    public readonly clienteId: string,
    public readonly tipoObligacion: string,
    public readonly periodo: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'obligaciones.vencimiento-vencido';
  }
}
