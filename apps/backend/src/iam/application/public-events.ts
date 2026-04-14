/**
 * Public events from the IAM context.
 * Other contexts subscribe to these event names — never import IAM internals.
 */
export const IAM_EVENTS = {
  USUARIO_REGISTRADO: 'iam.usuario-registrado',
} as const;

export interface UsuarioRegistradoPayload {
  usuarioId: string;
  email: string;
  occurredOn: Date;
}
