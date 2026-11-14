import { describe, expect, it } from 'vitest';
import { DAMAGE_PER_CLICK, DEFAULT_STATS, healthText, MONSTER_MAX_HEALTH, Monster } from './monster';

describe('Monster', () => {
    it('starts at 10 health and alive', () => {
        const monster = new Monster();

        expect(monster.health).toBe(10);
        expect(monster.dead).toBe(false);
        expect(MONSTER_MAX_HEALTH).toBe(10);
    });

    it('loses 1 health per hit', () => {
        const monster = new Monster();

        monster.hit();
        expect(monster.health).toBe(9);

        monster.hit();
        expect(monster.health).toBe(8);
        expect(DAMAGE_PER_CLICK).toBe(1);
    });

    it('is dead at 0 health and does not respawn on its own', () => {
        const monster = new Monster();

        for (let i = 0; i < 10; i++)
        {
            monster.hit();
        }

        expect(monster.health).toBe(0);
        expect(monster.dead).toBe(true);
    });

    it('never goes below 0 health when a hit exceeds the remaining health', () => {
        const monster = new Monster();
        monster.hit(8);

        monster.hit(5);

        expect(monster.health).toBe(0);
    });

    it('ignores hits while dead', () => {
        const monster = new Monster();
        monster.hit(10);

        const landed = monster.hit();

        expect(landed).toBe(false);
        expect(monster.health).toBe(0);
    });

    it('reports whether a hit landed', () => {
        expect(new Monster().hit()).toBe(true);
    });

    it('restores 10 health and takes hits again after respawn', () => {
        const monster = new Monster();
        monster.hit(10);

        monster.respawn();
        expect(monster.health).toBe(10);
        expect(monster.dead).toBe(false);

        monster.hit();
        expect(monster.health).toBe(9);
    });

    it('has no drop rule by default and keeps the drop rule it is given', () => {
        expect(new Monster().dropRuleId).toBeNull();
        expect(new Monster(10, 2).dropRuleId).toBe(2);
    });

    it('keeps its drop rule while taking damage and respawning', () => {
        const monster = new Monster(10, 3);

        monster.hit(10);
        monster.respawn();

        expect(monster.dropRuleId).toBe(3);
        expect(monster.health).toBe(10);
    });

    it('subtracts a fractional hit exactly', () => {
        const monster = new Monster();

        monster.hit(0.9);

        expect(monster.health).toBe(9.1);
        expect(monster.dead).toBe(false);
    });

    it('reaches exactly 0 after many fractional hits instead of stopping at float dust', () => {
        const monster = new Monster(10);

        for (let i = 0; i < 100; i++)
        {
            monster.hit(0.1);
        }

        expect(monster.health).toBe(0);
        expect(monster.dead).toBe(true);
    });

    it('is dead when a fractional hit takes more than the remaining health', () => {
        const monster = new Monster(1);

        monster.hit(0.6);
        monster.hit(0.6);

        expect(monster.health).toBe(0);
        expect(monster.dead).toBe(true);
    });

    it('carries the stats it was given, fire without defense by default', () => {
        const stats = { element: 'WATER', physicalDefense: 5, magicalDefense: 6, critResistance: 7 };

        expect(new Monster(10, 1, stats).stats).toBe(stats);
        expect(new Monster().stats).toEqual(DEFAULT_STATS);
        expect(DEFAULT_STATS).toEqual({ element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 });
    });

    it('keeps its stats when it respawns', () => {
        const stats = { element: 'NATURE', physicalDefense: 5, magicalDefense: 6, critResistance: 7 };
        const monster = new Monster(10, 1, stats);

        monster.hit(10);
        monster.respawn();

        expect(monster.stats).toBe(stats);
    });
});

describe('healthText', () => {
    it('reads the health left over the maximum', () => {
        const monster = new Monster(30);

        monster.hit(20);

        expect(healthText(monster)).toBe('HP 10/30');
    });

    it('reads the full health of a new monster', () => {
        expect(healthText(new Monster(30))).toBe('HP 30/30');
    });

    it('rounds the health left up to one decimal so a living monster never reads HP 0', () => {
        const monster = new Monster(10);

        monster.hit(9.96);

        expect(healthText(monster)).toBe('HP 0.1/10');
    });

    it('keeps one decimal without a trailing zero', () => {
        const monster = new Monster(10);

        monster.hit(2.7);

        expect(healthText(monster)).toBe('HP 7.3/10');
    });

    it('reads HP 0 only for a dead monster', () => {
        const monster = new Monster(10);

        monster.hit(10);

        expect(healthText(monster)).toBe('HP 0/10');
    });

    it('abbreviates a full 2000 health boss to HP 2K/2K', () => {
        expect(healthText(new Monster(2000))).toBe('HP 2K/2K');
    });

    it('abbreviates a 16 384 000 health boss to HP 16.4M/16.4M', () => {
        expect(healthText(new Monster(16_384_000))).toBe('HP 16.4M/16.4M');
    });

    it('abbreviates a 3 000 000 000 health boss to HP 3B/3B', () => {
        expect(healthText(new Monster(3_000_000_000))).toBe('HP 3B/3B');
    });

    it('reads 1.5K of 2K after 500 damage', () => {
        const monster = new Monster(2000);

        monster.hit(500);

        expect(healthText(monster)).toBe('HP 1.5K/2K');
    });

    it('reads 1K of 2K when 999.95 is left, rounded up to 1000 first', () => {
        const monster = new Monster(2000);

        monster.hit(1000.05);

        expect(healthText(monster)).toBe('HP 1K/2K');
    });

    it('reads 999.9 of 2K when 999.9 is left', () => {
        const monster = new Monster(2000);

        monster.hit(1000.1);

        expect(healthText(monster)).toBe('HP 999.9/2K');
    });

    it('reads 2K of 2K when 1999.95 is left, rounded up to 2000 first', () => {
        const monster = new Monster(2000);

        monster.hit(0.05);

        expect(healthText(monster)).toBe('HP 2K/2K');
    });
});
