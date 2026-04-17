/**
 * Public views from the facturacion context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const FACTURAS_PENDIENTES_CLIENTE_VIEW = Symbol('FACTURAS_PENDIENTES_CLIENTE_VIEW');
export const FACTURACION_MES_VIEW = Symbol('FACTURACION_MES_VIEW');
export const FACTURACION_MENSUAL_VIEW = Symbol('FACTURACION_MENSUAL_VIEW');
export const FACTURAS_RECIENTES_CLIENTE_VIEW = Symbol('FACTURAS_RECIENTES_CLIENTE_VIEW');

export type { FacturasPendientesClienteViewInput, FacturasPendientesClienteDto } from './views/facturas-pendientes-cliente.view';
export type { FacturacionMesViewInput, FacturacionMesDto } from './views/facturacion-mes.view';
export type { FacturacionMensualViewInput, FacturacionMensualItemDto } from './views/facturacion-mensual.view';
export type { FacturasRecientesClienteViewInput, FacturaRecienteClienteDto } from './views/facturas-recientes-cliente.view';
