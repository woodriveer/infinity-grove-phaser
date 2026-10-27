import { describe, expect, it } from 'vitest';
import { AutoClicker, autoClickUnlocked } from './autoClick';

describe('AutoClicker', () => {
    it('fires nothing at 499 ms and one click when 500 ms are reached', () => {
        const clicker = new AutoClicker();

        expect(clicker.advance(499)).toBe(0);
        expect(clicker.advance(1)).toBe(1);
    });

    it('fires two clicks over 1000 ms of 16 ms frames', () => {
        const clicker = new AutoClicker();
        let clicks = 0;

        for (let ms = 0; ms + 16 <= 1008; ms += 16)
        {
            clicks += clicker.advance(16);
        }

        expect(clicks).toBe(2);
    });

    it('fires two clicks for one 1000 ms frame', () => {
        expect(new AutoClicker().advance(1000)).toBe(2);
    });

    it('fires at most 5 clicks in a 10 s frame and keeps the rest of the time for the next frames', () => {
        const clicker = new AutoClicker();

        expect(clicker.advance(10000)).toBe(5);
        expect(clicker.elapsedMs).toBe(7500);
        expect(clicker.advance(0)).toBe(5);
        expect(clicker.advance(0)).toBe(5);
        expect(clicker.advance(0)).toBe(5);
        expect(clicker.advance(0)).toBe(0);
    });

    it('uses a new interval from the next advance', () => {
        const clicker = new AutoClicker();

        clicker.intervalMs = 50;

        expect(clicker.advance(100)).toBe(2);
    });
});

describe('autoClickUnlocked', () => {
    it('is closed in chapter 1', () => {
        expect(autoClickUnlocked({ chapter: 1, completed: false })).toBe(false);
    });

    it('opens in chapter 2 and later', () => {
        expect(autoClickUnlocked({ chapter: 2, completed: false })).toBe(true);
        expect(autoClickUnlocked({ chapter: 5, completed: false })).toBe(true);
    });

    it('opens on a completed campaign', () => {
        expect(autoClickUnlocked({ chapter: 1, completed: true })).toBe(true);
    });

    it('is closed before the campaign loads', () => {
        expect(autoClickUnlocked({ chapter: null, completed: false })).toBe(false);
    });
});
