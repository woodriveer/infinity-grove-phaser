import { describe, expect, it } from 'vitest';
import { AffixState, affixDefense, affixOf, affixText } from './monsterAffix';

const shield = (amount = 10, periodMs = 6000) => new AffixState({ type: 'HIT_SHIELD', amount, periodMs });
const shell = (amount) => new AffixState({ type: 'SHELL', amount, periodMs: null });
const regeneration = (amount) => new AffixState({ type: 'REGENERATION', amount, periodMs: null });
const armored = (amount = 20) => new AffixState({ type: 'ARMORED', amount, periodMs: null });

describe('affixOf', () => {
    it('reads a shield with its period', () => {
        expect(affixOf({ type: 'HIT_SHIELD', amount: 10, periodMs: 6000 })).toEqual({ type: 'HIT_SHIELD', amount: 10, periodMs: 6000 });
    });

    it('reads a shell and drops a period it carries', () => {
        expect(affixOf({ type: 'SHELL', amount: 6, periodMs: 5 })).toEqual({ type: 'SHELL', amount: 6, periodMs: null });
    });

    it('gives null for undefined, null, an unknown type, a bad amount and a shield without a valid period', () => {
        expect(affixOf(undefined)).toBeNull();
        expect(affixOf(null)).toBeNull();
        expect(affixOf({ type: 'NOPE', amount: 1 })).toBeNull();
        expect(affixOf({ type: 'SHELL', amount: 0 })).toBeNull();
        expect(affixOf({ type: 'SHELL', amount: 1.5 })).toBeNull();
        expect(affixOf({ type: 'SHELL', amount: '6' })).toBeNull();
        expect(affixOf({ type: 'HIT_SHIELD', amount: 10, periodMs: null })).toBeNull();
        expect(affixOf({ type: 'HIT_SHIELD', amount: 10, periodMs: 0 })).toBeNull();
        expect(affixOf({ type: 'HIT_SHIELD', amount: 10, periodMs: 2.5 })).toBeNull();
    });
});

describe('affixDefense', () => {
    const stats = { element: 'FIRE', defense: 33, critResistance: 0 };

    it('adds Blindado 20 to defense 33', () => {
        expect(affixDefense(stats, { type: 'ARMORED', amount: 20 })).toEqual({ element: 'FIRE', defense: 53, critResistance: 0 });
    });

    it('ignores physicalDefense of an old payload: Blindado 20 reads 20', () => {
        const old = { element: 'FIRE', physicalDefense: 33, critResistance: 0 };

        expect(affixDefense(old, { type: 'ARMORED', amount: 20 }).defense).toBe(20);
    });

    it('keeps the stats of a shell', () => {
        expect(affixDefense(stats, { type: 'SHELL', amount: 6 })).toBe(stats);
    });
});

describe('SHELL', () => {
    it('a strike of 10 on Carapaça 6 lands 4', () => {
        expect(shell(6).land(10)).toBe(4);
    });

    it('a strike of 5 lands 0', () => {
        expect(shell(6).land(5)).toBe(0);
    });

    it('a critical strike of 30 on Carapaça 16 lands 14', () => {
        expect(shell(16).land(30)).toBe(14);
    });
});

describe('HIT_SHIELD', () => {
    it('10 strikes on a 10-charge shield land 0 each and the 11th of 5 lands 5', () => {
        const state = shield(10);

        for (let i = 0; i < 10; i++)
        {
            expect(state.land(7)).toBe(0);
        }

        expect(state.land(5)).toBe(5);
    });

    it('the last charge starts a 6000 ms recharge', () => {
        const state = shield(1);

        expect(state.land(9)).toBe(0);
        expect(state.charges).toBe(0);
        expect(state.rechargeMs).toBe(6000);
    });

    it('5999 ms later the shield is still down and 1 ms more brings back 10 charges', () => {
        const state = shield(10);

        for (let i = 0; i < 10; i++)
        {
            state.land(1);
        }

        state.advance(5999, {});
        expect(state.charges).toBe(0);

        state.advance(1, {});
        expect(state.charges).toBe(10);
        expect(state.rechargeMs).toBe(0);
    });

    it('a strike after the recharge lands 0', () => {
        const state = shield(2);

        state.land(4);
        state.land(4);
        expect(state.land(4)).toBe(4);

        state.advance(6000, {});
        expect(state.land(4)).toBe(0);
    });

    it('advance does not run the recharge while charges are left', () => {
        const state = shield(3);

        state.land(1);
        state.advance(10_000, {});

        expect(state.charges).toBe(2);
        expect(state.rechargeMs).toBe(0);
    });
});

describe('REGENERATION', () => {
    it('heals 5 a second at 50 basis points of 1000 health', () => {
        const monster = { health: 900, maxHealth: 1000, dead: false };

        expect(regeneration(50).advance(1000, monster)).toBe(5);
        expect(monster.health).toBe(905);
    });

    it('heals in proportion to the ms', () => {
        const monster = { health: 900, maxHealth: 1000, dead: false };

        expect(regeneration(50).advance(200, monster)).toBe(1);
        expect(monster.health).toBe(901);
    });

    it('never heals above the maximum', () => {
        const monster = { health: 998, maxHealth: 1000, dead: false };

        expect(regeneration(50).advance(1000, monster)).toBe(2);
        expect(monster.health).toBe(1000);
    });

    it('does not heal a dead monster', () => {
        const monster = { health: 0, maxHealth: 1000, dead: true };

        expect(regeneration(50).advance(1000, monster)).toBe(0);
        expect(monster.health).toBe(0);
    });
});

describe('affixText', () => {
    it('writes Carapaça with the short number format', () => {
        expect(affixText(shell(6))).toBe('Carapaça: -6 por golpe');
        expect(affixText(shell(1200))).toBe('Carapaça: -1.2K por golpe');
    });

    it('counts the charges of the shield down with each strike', () => {
        const state = shield(10);

        expect(affixText(state)).toBe('Escudo de golpes: 10/10');

        state.land(1);
        state.land(1);
        state.land(1);
        expect(affixText(state)).toBe('Escudo de golpes: 7/10');
    });

    it('counts the seconds left of a shield that is down, rounded up', () => {
        const state = shield(1);

        state.land(1);
        expect(affixText(state)).toBe('Escudo de golpes: volta em 6 s');

        state.advance(100, {});
        expect(affixText(state)).toBe('Escudo de golpes: volta em 6 s');

        state.advance(5000, {});
        expect(affixText(state)).toBe('Escudo de golpes: volta em 1 s');
    });

    it('writes Regeneração with a decimal comma', () => {
        expect(affixText(regeneration(50))).toBe('Regeneração: 0,5% da vida/s');
        expect(affixText(regeneration(25))).toBe('Regeneração: 0,25% da vida/s');
        expect(affixText(regeneration(100))).toBe('Regeneração: 1% da vida/s');
    });

    it('writes Blindado with its defense', () => {
        expect(affixText(armored(20))).toBe('Blindado: +20 de defesa');
    });
});
