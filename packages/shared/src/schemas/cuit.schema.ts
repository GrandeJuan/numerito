import { z } from 'zod/v4';

export function validarCuit(cuit: string): boolean {
  const clean = cuit.replace(/-/g, '');
  if (clean.length !== 11 || !/^\d{11}$/.test(clean)) return false;

  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i]) * mult[i];
  }
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;
  return checkDigit === parseInt(clean[10]);
}

export const cuitSchema = z
  .string()
  .regex(/^\d{2}-?\d{8}-?\d$/, 'Formato de CUIT inválido')
  .check(
    z.refine(validarCuit, 'CUIT inválido — dígito verificador incorrecto'),
  );
