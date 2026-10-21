import { describe, expect, it } from 'vitest';
import { Combo, comboText } from './combo';

const clicks = (combo, times) => Array.from({ length: times }, () => combo.click());

describe('Combo', () => {
    it('gives the first click no bonus and the second click 1 %', () => {
        const combo = new Combo();

        expect(combo.click()).toBe(0);
        expect(combo.click()).toBe(1);
    });

    it('gives the 11th click of a streak 10 %', () => {
        const combo = new Combo();

        expect(clicks(combo, 11).at(-1)).toBe(10);
    });

    it('stops at 50 %: the 51st click and every later one get 50', () => {
        const combo = new Combo();
        const bonuses = clicks(combo, 60);

        expect(bonuses[49]).toBe(49);
        expect(bonuses[50]).toBe(50);
        expect(bonuses.slice(50)).toEqual(Array(10).fill(50));
    });

    it('keeps the streak at 1499 ms without a click and ends it at 1500 ms', () => {
        const kept = new Combo();
        const ended = new Combo();

        clicks(kept, 5);
        clicks(ended, 5);
        kept.advance(1499);
        ended.advance(1500);

        expect(kept.streak).toBe(5);
        expect(ended.streak).toBe(0);
    });

    it('starts the next streak at 0 % after the timeout', () => {
        const combo = new Combo();

        clicks(combo, 20);
        combo.advance(1500);

        expect(combo.click()).toBe(0);
    });

    it('restarts the 1500 ms with every click: the idle time is counted from the last one', () => {
        const combo = new Combo();

        clicks(combo, 3);
        combo.advance(1000);
        combo.click();
        combo.advance(1000);

        expect(combo.streak).toBe(4);
    });

    it('adds the idle time of several frames', () => {
        const combo = new Combo();

        combo.click();
        combo.advance(700);
        combo.advance(800);

        expect(combo.streak).toBe(0);
    });

    it('has the bonus of the next click: min(50, streak)', () => {
        const combo = new Combo();

        clicks(combo, 11);

        expect(combo.bonus).toBe(11);
    });

    it('does nothing while there is no streak', () => {
        const combo = new Combo();

        combo.advance(5000);

        expect(combo.streak).toBe(0);
        expect(combo.click()).toBe(0);
    });
});

describe('comboText', () => {
    it('reads the streak and the bonus of the next click', () => {
        const combo = new Combo();

        clicks(combo, 11);

        expect(comboText(combo)).toBe('Combo x11 · +11%');
    });

    it('is empty without a streak', () => {
        expect(comboText(new Combo())).toBe('');
    });

    it('keeps the bonus at 50 for a long streak', () => {
        const combo = new Combo();

        clicks(combo, 57);

        expect(comboText(combo)).toBe('Combo x57 · +50%');
    });
});
