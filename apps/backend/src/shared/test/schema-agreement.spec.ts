import {
  crearClienteSchema,
  iniciarSesionSchema,
  registrarUsuarioSchema,
  crearFacturaSchema,
  crearVencimientoSchema,
  solicitarResetPasswordSchema,
  resetearPasswordSchema,
  refreshTokenSchema,
  verificar2FASchema,
} from '@numerito/shared';
import { crearClienteDtoSchema } from '../../clientes/application/dtos/crear-cliente.dto';
import { iniciarSesionDtoSchema } from '../../iam/application/dtos/iniciar-sesion.dto';
import { registrarUsuarioDtoSchema } from '../../iam/application/dtos/registrar-usuario.dto';
import { crearFacturaDtoSchema } from '../../facturacion/application/dtos/crear-factura.dto';
import { crearVencimientoDtoSchema } from '../../obligaciones/application/dtos/crear-vencimiento.dto';
import { solicitarResetPasswordDtoSchema } from '../../iam/application/dtos/solicitar-reset-password.dto';
import { resetearPasswordDtoSchema } from '../../iam/application/dtos/resetear-password.dto';
import { refreshTokenDtoSchema } from '../../iam/application/dtos/refresh-token.dto';
import { verificar2FADtoSchema } from '../../iam/application/dtos/verificar-2fa.dto';

describe('Schema agreement: all Zod-derived DTOs use shared schema instances', () => {
  it.each([
    ['CrearCliente', crearClienteDtoSchema, crearClienteSchema],
    ['IniciarSesion', iniciarSesionDtoSchema, iniciarSesionSchema],
    ['RegistrarUsuario', registrarUsuarioDtoSchema, registrarUsuarioSchema],
    ['CrearFactura', crearFacturaDtoSchema, crearFacturaSchema],
    ['CrearVencimiento', crearVencimientoDtoSchema, crearVencimientoSchema],
    ['SolicitarResetPassword', solicitarResetPasswordDtoSchema, solicitarResetPasswordSchema],
    ['ResetearPassword', resetearPasswordDtoSchema, resetearPasswordSchema],
    ['RefreshToken', refreshTokenDtoSchema, refreshTokenSchema],
    ['Verificar2FA', verificar2FADtoSchema, verificar2FASchema],
  ])('%s DTO schema is the same instance as shared schema', (_name, dtoSchema, sharedSchema) => {
    expect(dtoSchema).toBe(sharedSchema);
  });
});
