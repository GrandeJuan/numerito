/**
 * Public views from the documentos context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const DOCUMENTOS_CLIENTE_COUNT_VIEW = Symbol('DOCUMENTOS_CLIENTE_COUNT_VIEW');

export type { DocumentosClienteCountViewInput, DocumentosClienteCountDto } from './views/documentos-cliente-count.view';
