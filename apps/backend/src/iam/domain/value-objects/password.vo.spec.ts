import { Password } from './index';

describe('Password Value Object', () => {
  it('should hash a password', async () => {
    const password = await Password.create('SecurePass123!');
    expect(password.hashedValue).not.toBe('SecurePass123!');
    expect(password.hashedValue).toMatch(/^\$2[aby]\$/);
  });

  it('should verify correct password', async () => {
    const password = await Password.create('SecurePass123!');
    const isValid = await password.compare('SecurePass123!');
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const password = await Password.create('SecurePass123!');
    const isValid = await password.compare('WrongPassword');
    expect(isValid).toBe(false);
  });

  it('should throw on weak password (< 8 chars)', async () => {
    await expect(Password.create('short')).rejects.toThrow();
  });

  it('should create from existing hash', () => {
    const hash = '$2b$10$somefakehashvalue1234567890abcdefghijklmnopq';
    const password = Password.fromHash(hash);
    expect(password.hashedValue).toBe(hash);
  });
});
