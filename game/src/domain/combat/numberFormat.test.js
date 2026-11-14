import { describe, expect, it } from 'vitest';
import { formatShort } from './numberFormat';

describe('formatShort', () => {
    it('keeps 999 as it is', () => expect(formatShort(999)).toBe('999'));
    it('reads 1000 as 1K', () => expect(formatShort(1000)).toBe('1K'));
    it('reads 1500 as 1.5K', () => expect(formatShort(1500)).toBe('1.5K'));
    it('reads 5000 as 5K', () => expect(formatShort(5000)).toBe('5K'));
    it('reads 50000 as 50K', () => expect(formatShort(50000)).toBe('50K'));
    it('reads 999949 as 999.9K', () => expect(formatShort(999949)).toBe('999.9K'));
    it('reads 999950 as 1M when the rounding reaches 1000K', () => expect(formatShort(999950)).toBe('1M'));
    it('reads 1000000 as 1M', () => expect(formatShort(1000000)).toBe('1M'));
    it('reads 1049999 as 1M', () => expect(formatShort(1049999)).toBe('1M'));
    it('reads 1050000 as 1.1M', () => expect(formatShort(1050000)).toBe('1.1M'));
    it('reads 16384000 as 16.4M', () => expect(formatShort(16384000)).toBe('16.4M'));
    it('reads 20000000 as 20M', () => expect(formatShort(20000000)).toBe('20M'));
    it('reads 2500000000 as 2.5B', () => expect(formatShort(2500000000)).toBe('2.5B'));
    it('reads 3000000000 as 3B', () => expect(formatShort(3000000000)).toBe('3B'));
    it('reads 6000000000 as 6B', () => expect(formatShort(6000000000)).toBe('6B'));
    it('reads 1e12 as 1T', () => expect(formatShort(1e12)).toBe('1T'));
});
