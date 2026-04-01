import { generateTotpSecret, generateTotp, verifyTotp, generateTotpUri } from './totp';

describe('TOTP utils', () => {
  it('should generate a base32 secret of length 20', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBe(20);
  });

  it('should generate a 6-digit TOTP', () => {
    const secret = generateTotpSecret();
    const code = generateTotp(secret);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should verify a valid TOTP code', () => {
    const secret = generateTotpSecret();
    const code = generateTotp(secret);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it('should reject an invalid TOTP code', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, '000000')).toBe(false);
  });

  it('should accept codes within window', () => {
    const secret = generateTotpSecret();
    const code = generateTotp(secret);
    // window=1 should still accept current code
    expect(verifyTotp(secret, code, 1)).toBe(true);
  });

  it('should generate a valid otpauth URI', () => {
    const uri = generateTotpUri('user@test.com', 'Numerito', 'ABCDEFGH');
    expect(uri).toBe(
      'otpauth://totp/Numerito:user%40test.com?secret=ABCDEFGH&issuer=Numerito',
    );
  });

  it('should handle special characters in email and issuer', () => {
    const uri = generateTotpUri('a+b@c.com', 'My App', 'SECRET');
    expect(uri).toContain('My%20App');
    expect(uri).toContain('a%2Bb%40c.com');
  });

  it('should handle secrets with invalid base32 characters (skipped in decode)', () => {
    // '1' and '0' are not valid base32 chars, they should be skipped
    const code = generateTotp('ABCDEFGH10ABCDEFGH10');
    expect(code).toMatch(/^\d{6}$/);
  });
});
