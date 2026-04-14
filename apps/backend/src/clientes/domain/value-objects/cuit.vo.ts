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
}
