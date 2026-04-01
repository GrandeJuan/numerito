import { ValueObject } from '../../../shared/domain';
import { InvalidNombreEstudioError } from '../../../shared/domain/exceptions';

interface NombreEstudioProps {
  value: string;
}

const MIN_LENGTH = 3;

export class NombreEstudio extends ValueObject<NombreEstudioProps> {
  get value(): string {
    return this.props.value;
  }

  static create(nombre: string): NombreEstudio {
    const trimmed = nombre.trim();
    if (!trimmed || trimmed.length < MIN_LENGTH) {
      throw new InvalidNombreEstudioError(`debe tener al menos ${MIN_LENGTH} caracteres`);
    }
    return new NombreEstudio({ value: trimmed });
  }
}
