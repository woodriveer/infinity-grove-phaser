import { describe, expect, it } from 'vitest';
import { DAMAGE_PER_CLICK, MONSTER_MAX_HEALTH, Monster } from './monster';

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

    it('is level 1 by default and keeps the level it is given', () => {
        expect(new Monster().level).toBe(1);
        expect(new Monster(10, 2).level).toBe(2);
    });

    it('keeps its level while taking damage and respawning', () => {
        const monster = new Monster(10, 3);

        monster.hit(10);
        monster.respawn();

        expect(monster.level).toBe(3);
        expect(monster.health).toBe(10);
    });
});
