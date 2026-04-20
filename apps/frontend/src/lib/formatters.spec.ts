import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCurrency, formatCurrencyCompact, formatFecha, relativeTime } from './formatters';

describe('formatCurrency', () => {
  it('formats a positive number with peso sign', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('$');
    expect(result).toContain('1');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats large numbers with locale separators', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('$');
    expect(result).toContain('1');
  });
});

describe('formatCurrencyCompact', () => {
  it('returns plain currency under 1k', () => {
    expect(formatCurrencyCompact(850)).toBe('$850');
    expect(formatCurrencyCompact(0)).toBe('$0');
  });

  it('formats thousands with one decimal and K suffix', () => {
    expect(formatCurrencyCompact(1200)).toBe('$1.2K');
    expect(formatCurrencyCompact(7500)).toBe('$7.5K');
  });

  it('formats millions with two decimals and M suffix', () => {
    expect(formatCurrencyCompact(4_820_000)).toBe('$4.82M');
  });

  it('formats billions with two decimals and B suffix', () => {
    expect(formatCurrencyCompact(1_300_000_000)).toBe('$1.30B');
  });
});

describe('formatFecha', () => {
  it('formats a date-only string', () => {
    const result = formatFecha('2026-01-15');
    expect(result).toContain('15');
    expect(result).toContain('01');
    expect(result).toContain('2026');
  });

  it('formats a datetime string', () => {
    const result = formatFecha('2026-03-20T14:30:00');
    expect(result).toContain('20');
    expect(result).toContain('03');
    expect(result).toContain('2026');
  });

  it('returns the original string on invalid input', () => {
    expect(formatFecha('not-a-date')).toBe('not-a-date');
  });
});

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "ahora" for just now', () => {
    expect(relativeTime('2026-04-13T12:00:00Z')).toBe('ahora');
  });

  it('returns minutes ago', () => {
    expect(relativeTime('2026-04-13T11:45:00Z')).toBe('hace 15m');
  });

  it('returns hours ago', () => {
    expect(relativeTime('2026-04-13T09:00:00Z')).toBe('hace 3h');
  });

  it('returns days ago', () => {
    expect(relativeTime('2026-04-11T12:00:00Z')).toBe('hace 2d');
  });
});
