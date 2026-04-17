import { parseAllowedOrigins } from './cors-origins';

describe('parseAllowedOrigins', () => {
  it('returns empty array for undefined', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseAllowedOrigins('')).toEqual([]);
  });

  it('returns a single string for one origin (exact match semantics in Nest cors)', () => {
    expect(parseAllowedOrigins('http://127.0.0.1:5100')).toBe('http://127.0.0.1:5100');
  });

  it('returns array for multiple origins', () => {
    expect(parseAllowedOrigins('http://127.0.0.1:5100,http://localhost:5100')).toEqual([
      'http://127.0.0.1:5100',
      'http://localhost:5100',
    ]);
  });

  it('trims whitespace around entries', () => {
    expect(parseAllowedOrigins('http://a.com ,  http://b.com ')).toEqual([
      'http://a.com',
      'http://b.com',
    ]);
  });

  it('drops empty entries (trailing commas, double commas)', () => {
    expect(parseAllowedOrigins('http://a.com,,http://b.com,')).toEqual([
      'http://a.com',
      'http://b.com',
    ]);
  });

  it('accepts both localhost and 127.0.0.1 variants (regression: login failed-to-fetch when origin mismatched)', () => {
    const origins = parseAllowedOrigins('http://127.0.0.1:5100,http://localhost:5100');
    expect(origins).toContain('http://127.0.0.1:5100');
    expect(origins).toContain('http://localhost:5100');
  });
});
