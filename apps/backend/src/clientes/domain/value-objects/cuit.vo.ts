import { ValueObject } from '../../../shared/domain';
import { InvalidCuitError } from '../../../shared/domain/exceptions';
import { validarCuit } from '@numerito/shared';

interface CuitProps {
  value: string;
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
      throw new InvalidCuitError(cuit);
    }
    return new Cuit({ value: clean });
  }

  /**
   * Creates a placeholder CUIT for imported clients that only have a
   * termination digit. The actual CUIT must be filled in later.
   * Uses tipo 20 + sequential number to ensure uniqueness.
   */
  static placeholder(sequence: number): Cuit {
    const tipo = '20';
    const base = String(sequence).padStart(8, '0');
    const partial = tipo + base;
    const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(partial[i]) * mult[i];
    }
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;
    const cuit = partial + String(checkDigit);
    return new Cuit({ value: cuit });
  }
}
