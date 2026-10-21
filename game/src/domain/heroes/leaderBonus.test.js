import { describe, expect, it, vi } from 'vitest';
import { clickHits } from './leaderBonus';

describe('clickHits', () => {
    it('is a double click for Lyra on a roll below 30', () => {
        expect(clickHits('lyra', () => 0.29)).toBe(2);
    });

    it('is a double click on a roll of 0', () => {
        expect(clickHits('lyra', () => 0)).toBe(2);
    });

    it('is a single click for Lyra on a roll of 30 or above', () => {
        expect(clickHits('lyra', () => 0.3)).toBe(1);
        expect(clickHits('lyra', () => 0.99)).toBe(1);
    });

    it('is a single click for every other hero and never rolls', () => {
        const random = vi.fn(() => 0);

        [ 'kael', 'orina', 'seraphine', 'vex', undefined ].forEach((heroId) => expect(clickHits(heroId, random)).toBe(1));
        expect(random).not.toHaveBeenCalled();
    });

    it('rolls once per click', () => {
        const random = vi.fn(() => 0.5);

        clickHits('lyra', random);

        expect(random).toHaveBeenCalledTimes(1);
    });
});
