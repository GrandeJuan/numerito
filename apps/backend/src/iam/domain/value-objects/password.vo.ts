import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const MIN_LENGTH = 8;

export class Password {
  private constructor(private readonly hash: string) {}

  get hashedValue(): string {
    return this.hash;
  }

  static async create(plainText: string): Promise<Password> {
    if (!plainText || plainText.length < MIN_LENGTH) {
      throw new Error(`Password must be at least ${MIN_LENGTH} characters`);
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
