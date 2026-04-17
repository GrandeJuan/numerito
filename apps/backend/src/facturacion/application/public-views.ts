/**
 * Public views from the facturacion context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const FACTURAS_PENDIENTES_CLIENTE_VIEW = Symbol('FACTURAS_PENDIENTES_CLIENTE_VIEW');

export type { FacturasPendientesClienteViewInput, FacturasPendientesClienteDto } from './views/facturas-pendientes-cliente.view';
