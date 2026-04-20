/**
 * Public events from the Clientes context.
 * Other contexts subscribe to these event names — never import Clientes internals.
 */
export const CLIENTES_EVENTS = {
  PERFIL_FISCAL_ACTUALIZADO: 'clientes.perfil-fiscal-actualizado',
} as const;

export interface PerfilFiscalActualizadoPayload {
  clienteId: string;
  estudioId: string;
  occurredOn: Date;
}
