export const TIPO_CLIENTE = {
  PERSONA_FISICA: 'PERSONA_FISICA',
  PERSONA_JURIDICA: 'PERSONA_JURIDICA',
  SOCIEDAD: 'SOCIEDAD',
} as const;

export type TipoCliente = (typeof TIPO_CLIENTE)[keyof typeof TIPO_CLIENTE];
