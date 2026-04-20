import { DomainEvent } from '../../../shared/domain';

export class PerfilFiscalActualizado extends DomainEvent {
  constructor(
    public readonly clienteId: string,
    public readonly estudioId: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'clientes.perfil-fiscal-actualizado';
  }
}
