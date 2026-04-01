import { ValueObject } from '../../../shared/domain';

interface RazonSocialProps {
  value: string;
}

const MIN_LENGTH = 3;

export class RazonSocial extends ValueObject<RazonSocialProps> {
  get value(): string {
    return this.props.value;
  }

  static create(razonSocial: string): RazonSocial {
    const trimmed = razonSocial.trim();
    if (!trimmed || trimmed.length < MIN_LENGTH) {
      throw new Error(`Razón social debe tener al menos ${MIN_LENGTH} caracteres`);
    }
    return new RazonSocial({ value: trimmed });
  }
}
