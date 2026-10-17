import { describe, expect, it } from 'vitest';
import { DAMAGE_PER_CLICK, MONSTER_MAX_HEALTH, Monster } from './monster';

describe('Monster', () => {
    it('starts at 10 health', () => {
        expect(new Monster().health).toBe(10);
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

    it('restores 10 health when a hit brings it to 0', () => {
        const monster = new Monster();

        for (let i = 0; i < 9; i++)
        {
            monster.hit();
        }
        expect(monster.health).toBe(1);

        monster.hit();
        expect(monster.health).toBe(10);
    });

    it('restores 10 health, never a negative value, when a hit exceeds the remaining health', () => {
        const monster = new Monster();
        monster.hit(8);
        expect(monster.health).toBe(2);

        monster.hit(5);

        expect(monster.health).toBe(10);
    });
});
