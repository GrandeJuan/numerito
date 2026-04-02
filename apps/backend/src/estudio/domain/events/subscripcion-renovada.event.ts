import { DomainEvent } from '../../../shared/domain';

export class SubscripcionRenovada extends DomainEvent {
  constructor(
    public readonly subscripcionId: string,
    public readonly estudioId: string,
    public readonly nuevaFechaFin: Date,
  ) {
    super();
  }

  get eventName(): string {
    return 'estudio.subscripcion-renovada';
  }
}
