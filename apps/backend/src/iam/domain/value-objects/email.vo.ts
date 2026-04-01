import { ValueObject } from '../../../shared/domain';
import { InvalidEmailError } from '../../../shared/domain/exceptions';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  get value(): string {
    return this.props.value;
  }

  static create(email: string): Email {
    if (!email || !Email.isValid(email)) {
      throw new InvalidEmailError(email);
    }
    return new Email({ value: email.toLowerCase().trim() });
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
