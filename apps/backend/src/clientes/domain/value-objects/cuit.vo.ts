import { ValueObject } from '../../../shared/domain';

interface CuitProps {
  value: string;
}

const MULT = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function validarCuit(raw: string): boolean {
  if (raw.length !== 11 || !/^\d{11}$/.test(raw)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(raw[i]) * MULT[i];
  }
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;
  return checkDigit === parseInt(raw[10]);
}

function formatCuit(raw: string): string {
  return `${raw.slice(0, 2)}-${raw.slice(2, 10)}-${raw.slice(10)}`;
}

export class Cuit extends ValueObject<CuitProps> {
  get value(): string {
    return formatCuit(this.props.value);
  }

  get raw(): string {
    return this.props.value;
  }

  static create(cuit: string): Cuit {
    const clean = cuit.replace(/-/g, '');
    if (!validarCuit(clean)) {
      throw new Error(`CUIT inválido: ${cuit}`);
    }
    return new Cuit({ value: clean });
  }
}
