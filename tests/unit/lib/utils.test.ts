import { describe, it, expect } from 'vitest';
import { cn, formatCurrency } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge tailwind classes correctly', () => {
    expect(cn('p-4', 'bg-red-500')).toBe('p-4 bg-red-500');
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('formatCurrency utility', () => {
  it('should format numbers to IDR correctly', () => {
    // Note: Intl formatting might have different space characters (non-breaking space) depending on environment
    // We can check if it contains the currency code and the number
    const result = formatCurrency(10000);
    expect(result).toContain('Rp');
    expect(result).toContain('10.000');
  });
});
