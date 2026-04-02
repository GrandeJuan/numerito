import * as bcrypt from 'bcrypt';
import { InvalidPasswordError } from '../../../shared/domain/exceptions';
import { AUTH } from '../../../shared/config/constants';

const SALT_ROUNDS = AUTH.SALT_ROUNDS;
const MIN_LENGTH = AUTH.MIN_PASSWORD_LENGTH;

export class Password {
  private constructor(private readonly hash: string) {}

  get hashedValue(): string {
    return this.hash;
  }

  static async create(plainText: string): Promise<Password> {
    if (!plainText || plainText.length < MIN_LENGTH) {
      throw new InvalidPasswordError(`debe tener al menos ${MIN_LENGTH} caracteres`);
    }
    const hash = await bcrypt.hash(plainText, SALT_ROUNDS);
    return new Password(hash);
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  async compare(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.hash);
  }
}
