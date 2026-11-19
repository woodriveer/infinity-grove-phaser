//  The adds of a miniboss (spec miniboss-adds) as the progress and farm payloads carry them: `stage.adds` is a list of
//  { health, defenseBuff } in slot order. Pure JavaScript: no Phaser.
import { DEFAULT_STATS } from './monster';

export const MAX_ADDS = 2;
export const MAX_ADD_BUFF = 90;

const validHealth = (health) => typeof health === 'number' && Number.isFinite(health) && health >= 1;
const validBuff = (buff) => Number.isInteger(buff) && buff >= 0 && buff <= MAX_ADD_BUFF;

//  The adds of `stage`: [ { health, defenseBuff, stats } ], where stats are the stage's phase monster stats. A missing stage or a
//  missing or non-list `adds` gives none; an entry with a bad health or buff is skipped; only the first MAX_ADDS valid entries count.
export const addsOf = (stage) =>
{
    const list = Array.isArray(stage?.adds) ? stage.adds : [];
    const stats = stage?.monster ?? DEFAULT_STATS;

    return list
        .filter((add) => validHealth(add?.health) && validBuff(add?.defenseBuff))
        .slice(0, MAX_ADDS)
        .map(({ health, defenseBuff }) => ({ health, defenseBuff, stats }));
};
