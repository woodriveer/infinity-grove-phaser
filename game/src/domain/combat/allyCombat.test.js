import { describe, expect, it, vi } from 'vitest';
import { landTeam } from './allyCombat';
import { Monster } from './monster';

const hitter = (base) => ({ baseDamage: base });
const hit = () => vi.fn((attacker, target) =>
{
    target.hit(attacker.baseDamage);

    return attacker.baseDamage;
});
const one = (base = 2) => [ { slot: 1, attacker: hitter(base) } ];

describe('landTeam', () => {
    const two = () => [ { slot: 1, attacker: hitter(2) }, { slot: 2, attacker: hitter(3) } ];

    it('lands every ally in slot order and sums the round', () => {
        const m = new Monster(100);
        const land = hit();

        const result = landTeam({ allies: two(), hit: land, target: () => m });

        expect(result).toEqual({
            slots: [ 1, 2 ],
            damage: 5,
            hits: [ { slot: 1, target: m, damage: 2 }, { slot: 2, target: m, damage: 3 } ]
        });
        expect(m.health).toBe(95);
        expect(land.mock.calls.map(([ attacker ]) => attacker.baseDamage)).toEqual([ 2, 3 ]);
    });

    it('a kill stops the later slots', () => {
        const m = new Monster(2);
        const land = hit();

        const result = landTeam({ allies: two(), hit: land, target: () => m });

        expect(result.slots).toEqual([ 1 ]);
        expect(result.damage).toBe(2);
        expect(land).toHaveBeenCalledTimes(1);
    });

    it('the target is read before every hit', () => {
        const a = new Monster(100);
        const b = new Monster(100);
        const targets = [ a, b ];

        const result = landTeam({ allies: two(), hit: hit(), target: () => targets.shift() });

        expect(result.hits.map((h) => h.target)).toEqual([ a, b ]);
        expect(a.health).toBe(98);
        expect(b.health).toBe(97);
    });

    it('a target that dies mid-round hands the later slots to the next target', () => {
        const a = new Monster(2);
        const b = new Monster(100);

        const result = landTeam({ allies: two(), hit: hit(), target: () => (a.dead ? b : a) });

        expect(result.hits.map((h) => h.target)).toEqual([ a, b ]);
        expect(a.dead).toBe(true);
        expect(b.health).toBe(97);
    });

    it('a null target lands nothing', () => {
        const land = hit();

        expect(landTeam({ allies: one(), hit: land, target: () => null })).toEqual({ slots: [], damage: 0, hits: [] });
        expect(land).not.toHaveBeenCalled();
    });

    it('a dead target lands nothing', () => {
        const m = new Monster(1);
        const land = hit();

        m.hit(1);

        expect(landTeam({ allies: one(), hit: land, target: () => m })).toEqual({ slots: [], damage: 0, hits: [] });
        expect(land).not.toHaveBeenCalled();
    });

    it('no ally lands nothing', () => {
        expect(landTeam({ allies: [], hit: hit(), target: () => new Monster(10) })).toEqual({ slots: [], damage: 0, hits: [] });
    });
});
