import { skillLevelOf } from '../skills/skillLevel';
import { ASCENDED_FROM, copiesOf, EXALTED_FROM, FUSION_SIZE, MAX_STARS } from './heroes';

//  The rules of the Mochila cards and the fusion ladder (spec hero-bag-cards). Pure JavaScript: no Phaser, no DOM.
const LAYERS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
const LAST_FUSIBLE = MAX_STARS - 1;

//  'wood' for 0 to 3 stars, 'silver' for 4 to 6, 'gold' for 7 to 9
export const frameTier = (stars) => (stars >= EXALTED_FROM ? 'gold' : stars >= ASCENDED_FROM ? 'silver' : 'wood');

//  Every layer the hero holds at least one copy of, ascending: [ { stars, copies } ]
export const copyLayers = (hero) => LAYERS.filter((stars) => copiesOf(hero, stars) >= 1).map((stars) => ({ stars, copies: copiesOf(hero, stars) }));

//  True when a layer from 0 to 8 holds 3 or more copies
export const canFuseAny = (hero) => LAYERS.some((stars) => stars <= LAST_FUSIBLE && copiesOf(hero, stars) >= FUSION_SIZE);

//  '0★×45'
export const chipText = ({ stars, copies }) => `${stars}★×${copies}`;

//  The ladder rows: the held layers plus the layer above the highest one when that one can fuse now
export const ladderRows = (hero) =>
{
    const layers = copyLayers(hero);
    const top = layers.at(-1);

    if (top && top.stars <= LAST_FUSIBLE && top.copies >= FUSION_SIZE)
    {
        layers.push({ stars: top.stars + 1, copies: 0 });
    }

    return layers.map(({ stars, copies }) => ({
        stars, copies, filled: Math.min(copies, FUSION_SIZE), canFuse: stars <= LAST_FUSIBLE && copies >= FUSION_SIZE, isMax: stars === MAX_STARS
    }));
};

//  The inline width of the bar fill for 0 to 3 filled copies
const BAR_WIDTHS = [ '0%', '33.333%', '66.667%', '100%' ];
export const barWidth = (filled) => BAR_WIDTHS[filled];

//  The cascade of Fundir tudo: { fusions, after: { 0: n, ..., 9: n } } (the backend rule of PlayerCards.fuseAll)
export const cascade = (hero) =>
{
    const after = {};
    let carry = 0;
    let fusions = 0;

    LAYERS.forEach((stars) =>
    {
        const count = copiesOf(hero, stars) + carry;

        if (stars === MAX_STARS)
        {
            after[stars] = count;

            return;
        }
        carry = Math.floor(count / FUSION_SIZE);
        fusions += carry;
        after[stars] = count - carry * FUSION_SIZE;
    });

    return { fusions, after };
};

//  '45×0★ + 1×1★ + 2×2★' from [ { stars, copies } ]; layers with 0 copies are left out
export const layersText = (layers) => layers.filter(({ copies }) => copies >= 1).map(({ stars, copies }) => `${copies}×${stars}★`).join(' + ');

//  The two lines of the Fundir tudo preview: { before: 'Antes: 45×0★ + 1×1★ + 2×2★', after: 'Depois: 1×1★ + 1×2★ + 2×3★' }
export const previewLines = (hero) =>
{
    const { after } = cascade(hero);

    return {
        before: `Antes: ${layersText(copyLayers(hero))}`,
        after: `Depois: ${layersText(LAYERS.map((stars) => ({ stars, copies: after[stars] })))}`
    };
};

//  'Fazer 22 fusões?' / 'Fazer 1 fusão?'
export const fuseAllQuestion = (fusions) => `Fazer ${fusions} ${fusions === 1 ? 'fusão' : 'fusões'}?`;

//  The skills a cascade raised: level after >= 2 and higher than before, in slot order: [ { name, level } ]
export const raisedSkills = (before = [], after = []) => after
    .filter((skill) =>
    {
        const old = before.find((candidate) => candidate.slot === skill.slot);

        return skillLevelOf(skill) >= 2 && skillLevelOf(skill) > skillLevelOf(old);
    })
    .sort((a, b) => a.slot - b.slot)
    .map((skill) => ({ name: skill.name, level: skillLevelOf(skill) }));

//  '22 fusões. Melhor carta: Kael Raizférrea 3★' plus ' · <skill> no nível <level>' per raised skill
export const fuseAllResultText = ({ heroName, fusions, stars, raised = [] }) =>
    `${fusions} ${fusions === 1 ? 'fusão' : 'fusões'}. Melhor carta: ${heroName} ${stars}★${raised.map(({ name, level }) => ` · ${name} no nível ${level}`).join('')}`;
