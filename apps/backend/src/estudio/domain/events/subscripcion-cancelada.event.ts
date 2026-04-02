import { DomainEvent } from '../../../shared/domain';

export class SubscripcionCancelada extends DomainEvent {
  constructor(
    public readonly subscripcionId: string,
    public readonly estudioId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'estudio.subscripcion-cancelada';
  }
}
