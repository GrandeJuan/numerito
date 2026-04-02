import { DomainEvent } from '../../../shared/domain';

export class SubscripcionCreada extends DomainEvent {
  constructor(
    public readonly subscripcionId: string,
    public readonly estudioId: string,
    public readonly planId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'estudio.subscripcion-creada';
  }
}
