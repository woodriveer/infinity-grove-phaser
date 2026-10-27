import { describe, expect, it } from 'vitest';
import { resetReward } from './accountReset';
import { autoClickUnlocked } from '../combat/autoClick';

describe('resetReward', () => {
    it('is closed in chapter 1 and before the campaign loads', () => {
        expect(resetReward({ chapter: 1, completed: false })).toBeNull();
        expect(resetReward({ chapter: null, completed: false })).toBeNull();
    });

    it('pays the number of the chapter from chapter 2', () => {
        expect(resetReward({ chapter: 2, completed: false })).toBe(2);
        expect(resetReward({ chapter: 4, completed: false })).toBe(4);
        expect(resetReward({ chapter: 5, completed: false })).toBe(5);
    });

    it('pays 5 for a completed campaign', () => {
        expect(resetReward({ chapter: 5, completed: true })).toBe(5);
    });
});

describe('autoClickUnlocked after a reset', () => {
    it('opens in chapter 1 once the player has reset', () => {
        expect(autoClickUnlocked({ chapter: 1, completed: false, resets: 1 })).toBe(true);
    });

    it('stays closed in chapter 1 for a player who never reset', () => {
        expect(autoClickUnlocked({ chapter: 1, completed: false, resets: 0 })).toBe(false);
        expect(autoClickUnlocked({ chapter: 1, completed: false })).toBe(false);
    });
});
