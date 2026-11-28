import { describe, expect, it } from 'vitest';
import CASES from '../../../../backend/src/test/resources/ranking/click-power-cases.json';
import { teamActive, teamPassives } from '../heroes/team';
import { allyDamagePerClick } from './allyAttacker';
import { leaderAttacker } from './leaderAttacker';

//  The backend computes the click power of the ranking (ClickPower.kt) from the same cases; both suites read one fixture, so a damage
//  change on one side that the other does not follow fails here or in ClickPowerTest.kt (spec rankings, Power AC 2). The file is imported
//  as JSON, not read with node:fs: a domain test may import nothing but vitest (architecture.test.js).

const piece = (p) => (p.slot === 'WEAPON'
    ? { slot: 'WEAPON', clickDamage: p.click, affixes: [] }
    : { slot: p.slot, affixes: [ { type: 'CLICK_DAMAGE_PCT', value: p.clickDamagePct } ] });

const powerOf = (c) =>
{
    const talents = Object.entries(c.talentValues).map(([ id, value ]) => ({ id, value }));
    const allies = c.allies.slice(0, c.boughtSlots);
    const active = teamActive({ chapter: c.chapter, completed: c.completed });
    const { allyFactor } = teamPassives(active ? allies.map((a) => a.heroId) : []);
    const leader = leaderAttacker({ leader: { element: 'FIRE', stars: c.leader.stars }, pieces: c.leader.pieces.map(piece), talents }).baseDamage;

    return leader + allies.reduce((sum, a) => sum + allyDamagePerClick({ ally: { stars: a.stars }, pieces: a.pieces.map(piece), allyFactor }), 0);
};

describe('the click power of the ranking', () => {
    it('the fixture holds the six cases of the spec', () => {
        expect(CASES.map((c) => c.name.slice(0, 2))).toEqual([ 'C1', 'C2', 'C3', 'C4', 'C5', 'C6' ]);
        expect(CASES.map((c) => c.expected)).toEqual([ 1, 16.5, 41, 33, 131.75, 241 ]);
    });

    it.each(CASES.map((c) => [ c.name, c ]))('the game computes every fixture case like the backend: %s', (_name, c) => {
        expect(powerOf(c)).toBeCloseTo(c.expected, 9);
    });
});
