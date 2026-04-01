import { Email } from './email.vo';

describe('Email Value Object', () => {
  it('should create a valid email', () => {
    const email = Email.create('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  it('should normalize email to lowercase', () => {
    const email = Email.create('Test@EXAMPLE.com');
    expect(email.value).toBe('test@example.com');
  });

  it('should throw on invalid email format', () => {
    expect(() => Email.create('not-an-email')).toThrow();
    expect(() => Email.create('')).toThrow();
    expect(() => Email.create('missing@')).toThrow();
  });

  it('should be equal when values match', () => {
    const email1 = Email.create('test@example.com');
    const email2 = Email.create('test@example.com');
    expect(email1.equals(email2)).toBe(true);
  });
});
