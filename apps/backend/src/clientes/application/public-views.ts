/**
 * Public views from the clientes context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const CLIENTE_SUMMARY_VIEW = Symbol('CLIENTE_SUMMARY_VIEW');

export type { ClienteSummaryViewInput, ClienteSummaryDto } from './views/cliente-summary.view';
