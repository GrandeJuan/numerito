import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import type { ZodSchema } from 'zod';
import {
  crearClienteSchema,
  iniciarSesionSchema,
  registrarUsuarioSchema,
  crearFacturaSchema,
} from '@numerito/shared';
import { crearClienteDtoSchema } from '../../clientes/application/dtos/crear-cliente.dto';
import { IniciarSesionDto } from '../../iam/application/dtos/iniciar-sesion.dto';
import { RegistrarUsuarioDto } from '../../iam/application/dtos/registrar-usuario.dto';
import { CrearFacturaDto } from '../../facturacion/application/dtos/crear-factura.dto';

async function classValidatorAccepts<T extends object>(
  cls: new () => T,
  input: Record<string, unknown>,
): Promise<boolean> {
  const instance = plainToInstance(cls, input);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  return errors.length === 0;
}

function zodAccepts(schema: ZodSchema, input: unknown): boolean {
  return schema.safeParse(input).success;
}

// ── CrearCliente (Zod-derived — identity check) ─────────────────────────

describe('Schema agreement: CrearCliente', () => {
  it('DTO schema is the same instance as the shared schema', () => {
    expect(crearClienteDtoSchema).toBe(crearClienteSchema);
  });
});

// ── IniciarSesion ───────────────────────────────────────────────────────

describe('Schema agreement: IniciarSesion', () => {
  const validInputs = [
    { email: 'user@example.com', password: 'secret123' },
    { email: 'admin@test.org', password: 'a' },
  ];

  const invalidInputs: Array<{ label: string; input: Record<string, unknown> }> = [
    { label: 'missing email', input: { password: 'secret' } },
    { label: 'missing password', input: { email: 'user@example.com' } },
    { label: 'invalid email format', input: { email: 'not-an-email', password: 'secret' } },
    { label: 'empty password', input: { email: 'user@example.com', password: '' } },
    { label: 'empty object', input: {} },
  ];

  describe('both accept valid inputs', () => {
    it.each(validInputs)('accepts %j', async (input) => {
      const zodResult = zodAccepts(iniciarSesionSchema, input);
      const cvResult = await classValidatorAccepts(IniciarSesionDto, input);
      expect(zodResult).toBe(true);
      expect(cvResult).toBe(true);
    });
  });

  describe('both reject invalid inputs', () => {
    it.each(invalidInputs)('rejects: $label', async ({ input }) => {
      const zodResult = zodAccepts(iniciarSesionSchema, input);
      const cvResult = await classValidatorAccepts(IniciarSesionDto, input);
      expect(zodResult).toBe(false);
      expect(cvResult).toBe(false);
    });
  });
});

// ── RegistrarUsuario ────────────────────────────────────────────────────

describe('Schema agreement: RegistrarUsuario', () => {
  const valid = {
    email: 'user@example.com',
    password: '12345678',
    nombre: 'Juan',
    apellido: 'Perez',
    rol: 'SOCIO',
  };

  const validInputs = [valid];

  const invalidInputs: Array<{ label: string; input: Record<string, unknown> }> = [
    { label: 'missing email', input: { ...valid, email: undefined } },
    { label: 'invalid email', input: { ...valid, email: 'not-an-email' } },
    { label: 'password too short', input: { ...valid, password: '1234567' } },
    { label: 'missing nombre', input: { ...valid, nombre: undefined } },
    { label: 'empty nombre', input: { ...valid, nombre: '' } },
    { label: 'missing apellido', input: { ...valid, apellido: undefined } },
    { label: 'empty apellido', input: { ...valid, apellido: '' } },
    { label: 'missing rol', input: { ...valid, rol: undefined } },
    { label: 'empty rol', input: { ...valid, rol: '' } },
    { label: 'empty object', input: {} },
  ];

  describe('both accept valid inputs', () => {
    it.each(validInputs)('accepts %j', async (input) => {
      const zodResult = zodAccepts(registrarUsuarioSchema, input);
      const cvResult = await classValidatorAccepts(RegistrarUsuarioDto, input);
      expect(zodResult).toBe(true);
      expect(cvResult).toBe(true);
    });
  });

  describe('both reject invalid inputs', () => {
    it.each(invalidInputs)('rejects: $label', async ({ input }) => {
      const zodResult = zodAccepts(registrarUsuarioSchema, input);
      const cvResult = await classValidatorAccepts(RegistrarUsuarioDto, input);
      expect(zodResult).toBe(false);
      expect(cvResult).toBe(false);
    });
  });
});

// ── CrearFactura ────────────────────────────────────────────────────────

describe('Schema agreement: CrearFactura', () => {
  const validLinea = {
    descripcion: 'Servicio contable',
    cantidad: 1,
    precioUnitario: 1000,
    alicuotaIva: 21,
  };

  const valid = {
    clienteId: 'client-123',
    numero: 'A-0001-00000001',
    fechaEmision: '2026-01-15',
    fechaVencimiento: '2026-02-15',
    concepto: 'Servicios profesionales',
    lineas: [validLinea],
  };

  const validInputs = [valid];

  const invalidInputs: Array<{ label: string; input: Record<string, unknown> }> = [
    { label: 'missing clienteId', input: { ...valid, clienteId: undefined } },
    { label: 'empty clienteId', input: { ...valid, clienteId: '' } },
    { label: 'missing numero', input: { ...valid, numero: undefined } },
    { label: 'empty numero', input: { ...valid, numero: '' } },
    { label: 'missing concepto', input: { ...valid, concepto: undefined } },
    { label: 'empty concepto', input: { ...valid, concepto: '' } },
    { label: 'empty lineas array', input: { ...valid, lineas: [] } },
    { label: 'missing lineas', input: { ...valid, lineas: undefined } },
    {
      label: 'linea with empty descripcion',
      input: { ...valid, lineas: [{ ...validLinea, descripcion: '' }] },
    },
    {
      label: 'linea with cantidad 0',
      input: { ...valid, lineas: [{ ...validLinea, cantidad: 0 }] },
    },
    {
      label: 'linea with negative precioUnitario',
      input: { ...valid, lineas: [{ ...validLinea, precioUnitario: -1 }] },
    },
    {
      label: 'linea with negative alicuotaIva',
      input: { ...valid, lineas: [{ ...validLinea, alicuotaIva: -1 }] },
    },
    { label: 'empty object', input: {} },
  ];

  describe('both accept valid inputs', () => {
    it.each(validInputs)('accepts %j', async (input) => {
      const zodResult = zodAccepts(crearFacturaSchema, input);
      const cvResult = await classValidatorAccepts(CrearFacturaDto, input);
      expect(zodResult).toBe(true);
      expect(cvResult).toBe(true);
    });
  });

  describe('both reject invalid inputs', () => {
    it.each(invalidInputs)('rejects: $label', async ({ input }) => {
      const zodResult = zodAccepts(crearFacturaSchema, input);
      const cvResult = await classValidatorAccepts(CrearFacturaDto, input);
      expect(zodResult).toBe(false);
      expect(cvResult).toBe(false);
    });
  });
});
