//  The stops of the chapter map of the Rever chefes screen (spec boss-map): the minibosses 1 to `stageCount` and the chapter boss, each with
//  the state the player sees. Pure JavaScript: no Phaser.
//    defeated  the boss is in the farm list, the player may fight it again
//    current   the next boss of the campaign: the miniboss of the current stage, or the chapter boss; not clickable
//    locked    every other stop
//  `bosses` is the farm list ([ { kind, stage? } ]), `position` the campaign position ({ stage, kind, completed }).
import { CHAPTER_BOSS, MINIBOSS } from './campaign';

export const DEFEATED = 'defeated';
export const CURRENT = 'current';
export const LOCKED = 'locked';

export const stopId = ({ kind, stage }) => (kind === CHAPTER_BOSS ? 'chapter-boss' : `miniboss-${stage}`);

export const bossMapStops = ({ bosses, position, stageCount }) =>
{
    const beaten = new Set(bosses.map(stopId));
    const nextBoss = position.completed ? null : { kind: position.kind === CHAPTER_BOSS ? CHAPTER_BOSS : MINIBOSS, stage: position.stage };
    const stops = [
        ...Array.from({ length: stageCount }, (_, index) => ({ kind: MINIBOSS, stage: index + 1 })),
        { kind: CHAPTER_BOSS }
    ];

    return stops.map((stop) =>
    {
        const id = stopId(stop);
        let state = LOCKED;

        if (beaten.has(id))
        {
            state = DEFEATED;
        }
        else if (nextBoss && stopId(nextBoss) === id)
        {
            state = CURRENT;
        }

        return { ...stop, id, state };
    });
};
