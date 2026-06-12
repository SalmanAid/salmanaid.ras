import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge tailwind classes correctly', () => {
    expect(cn('p-4', 'bg-red-500')).toBe('p-4 bg-red-500');
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('formatCurrency utility', () => {
  it('should format numbers to IDR correctly', () => {
    expect(formatCurrency(10000)).toBe('Rp10.000');
  });

  it('should parse and format currency input values', () => {
    expect(parseCurrencyInput('Rp1.000.000')).toBe(1000000);
    expect(formatCurrencyInput('1000000')).toBe('Rp1.000.000');
    expect(formatCurrencyInput('')).toBe('');
  });
});
