import { describe, expect, it, vi } from 'vitest';
import { AllyCombat, landTeam } from './allyCombat';
import { Monster } from './monster';

const hitter = (base) => ({ baseDamage: base });
const hit = () => vi.fn((attacker, target) =>
{
    target.hit(attacker.baseDamage);

    return attacker.baseDamage;
});
const one = (base = 2) => [ { slot: 1, attacker: hitter(base) } ];

describe('AllyCombat', () => {
    it('lands nothing at 999 ms and one tick at 1000 ms', () => {
        const clock = new AllyCombat();
        const monster = new Monster(10);
        const land = hit();

        expect(clock.advance(999, { monster, allies: one(), hit: land }).ticks).toEqual([]);
        expect(monster.health).toBe(10);
        expect(clock.advance(1, { monster, allies: one(), hit: land }).ticks).toEqual([ { slots: [ 1 ], damage: 2 } ]);
        expect(monster.health).toBe(8);
    });

    it('hits in slot order and sums the tick', () => {
        const clock = new AllyCombat();
        const monster = new Monster(100);
        const land = hit();
        const allies = [ { slot: 1, attacker: hitter(2) }, { slot: 2, attacker: hitter(3) } ];

        const { ticks } = clock.advance(1000, { monster, allies, hit: land });

        expect(land.mock.calls.map(([ attacker ]) => attacker.baseDamage)).toEqual([ 2, 3 ]);
        expect(ticks).toEqual([ { slots: [ 1, 2 ], damage: 5 } ]);
    });

    it('a kill stops the later slots of the tick', () => {
        const clock = new AllyCombat();
        const monster = new Monster(2);
        const land = hit();
        const allies = [ { slot: 1, attacker: hitter(2) }, { slot: 2, attacker: hitter(3) } ];

        const { ticks } = clock.advance(1000, { monster, allies, hit: land });

        expect(ticks).toEqual([ { slots: [ 1 ], damage: 2 } ]);
        expect(land).toHaveBeenCalledTimes(1);
    });

    it('the clock starts again at 1000 ms for the next monster after a kill', () => {
        const clock = new AllyCombat();
        const land = hit();
        const first = new Monster(2);
        const next = new Monster(10);

        clock.advance(1000, { monster: first, allies: one(), hit: land });

        expect(clock.advance(999, { monster: next, allies: one(), hit: land }).ticks).toEqual([]);
        expect(clock.advance(1, { monster: next, allies: one(), hit: land }).ticks).toEqual([ { slots: [ 1 ], damage: 2 } ]);
        expect(next.health).toBe(8);
    });

    it('a new monster restarts the clock', () => {
        const clock = new AllyCombat();
        const land = hit();
        const a = new Monster(10);
        const b = new Monster(10);

        clock.advance(600, { monster: a, allies: one(), hit: land });

        expect(clock.advance(600, { monster: b, allies: one(), hit: land }).ticks).toEqual([]);
        expect(clock.advance(400, { monster: b, allies: one(), hit: land }).ticks).toHaveLength(1);
    });

    it('no monster lands nothing and puts the clock back at 1000 ms', () => {
        const clock = new AllyCombat();
        const land = hit();
        const a = new Monster(10);

        clock.advance(600, { monster: a, allies: one(), hit: land });

        expect(clock.advance(100, { monster: null, allies: one(), hit: land }).ticks).toEqual([]);
        expect(clock.advance(999, { monster: a, allies: one(), hit: land }).ticks).toEqual([]);
        expect(clock.advance(1, { monster: a, allies: one(), hit: land }).ticks).toHaveLength(1);
    });

    it('a dead monster lands nothing', () => {
        const clock = new AllyCombat();
        const land = hit();
        const monster = new Monster(1);

        monster.hit(1);

        expect(clock.advance(1000, { monster, allies: one(), hit: land }).ticks).toEqual([]);
        expect(land).not.toHaveBeenCalled();
    });

    it('no ally lands nothing and puts the clock back at 1000 ms', () => {
        const clock = new AllyCombat();
        const land = hit();
        const monster = new Monster(10);

        expect(clock.advance(900, { monster, allies: [], hit: land }).ticks).toEqual([]);
        expect(clock.advance(999, { monster, allies: one(), hit: land }).ticks).toEqual([]);
        expect(clock.advance(1, { monster, allies: one(), hit: land }).ticks).toHaveLength(1);
    });

    it('one advance of 2500 ms lands two ticks and keeps 500 ms', () => {
        const clock = new AllyCombat();
        const land = hit();
        const monster = new Monster(100);

        expect(clock.advance(2500, { monster, allies: one(), hit: land }).ticks).toHaveLength(2);
        expect(clock.advance(499, { monster, allies: one(), hit: land }).ticks).toEqual([]);
        expect(clock.advance(1, { monster, allies: one(), hit: land }).ticks).toHaveLength(1);
    });

    it('the target is read before every hit', () => {
        const clock = new AllyCombat();
        const land = hit();
        const monster = new Monster(100);
        const a = new Monster(100);
        const b = new Monster(100);
        const targets = [ a, b ];
        const allies = [ { slot: 1, attacker: hitter(2) }, { slot: 2, attacker: hitter(3) } ];

        clock.advance(1000, { monster, allies, hit: land, target: () => targets.shift() });

        expect(land.mock.calls.map(([ , aim ]) => aim)).toEqual([ a, b ]);
        expect(a.health).toBe(98);
        expect(b.health).toBe(97);
    });

    it('a null target ends the tick', () => {
        const clock = new AllyCombat();
        const land = hit();
        const monster = new Monster(100);

        expect(clock.advance(1000, { monster, allies: one(), hit: land, target: () => null }).ticks).toEqual([]);
        expect(land).not.toHaveBeenCalled();
    });

    it('the clock follows the monster, not the target', () => {
        const clock = new AllyCombat();
        const land = hit();
        const monster = new Monster(100);
        const b = new Monster(100);
        const c = new Monster(100);

        expect(clock.advance(600, { monster, allies: one(), hit: land, target: () => b }).ticks).toEqual([]);

        const { ticks } = clock.advance(400, { monster, allies: one(), hit: land, target: () => c });

        expect(ticks).toHaveLength(1);
        expect(c.health).toBe(98);
        expect(b.health).toBe(100);
    });
});

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
