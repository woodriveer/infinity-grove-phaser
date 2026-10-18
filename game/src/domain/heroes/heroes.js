//  The rules the game applies to the heroes payload of the backend (GET /heroes). Pure JavaScript: no Phaser, so every rule is unit-tested.
//  A hero is { id, name, element, owned, stars, copies: { 0: n, 1: n, 2: n, 3: n }, skills: [ { slot, unlocked, ... } ], ... }.
//  A card has 0 to 3 stars; 3 cards of the same hero and stars (0 to 2) fuse into 1 card of the next stars.
export const FUSION_SIZE = 3;
export const MAX_STARS = 3;

const ALL_STARS = [ 0, 1, 2, 3 ];
const FUSIBLE_STARS = [ 0, 1, 2 ];

export const ELEMENT_LABELS = { FIRE: 'Fogo', WATER: 'Água', NATURE: 'Natureza', LIGHT: 'Luz', DARKNESS: 'Escuridão' };

//  The three heroes a new account can start with
export const STARTING_CHOICES = [
    { element: 'FIRE', heroId: 'kael', label: 'Fogo - Kael' },
    { element: 'WATER', heroId: 'orina', label: 'Água - Orina' },
    { element: 'NATURE', heroId: 'lyra', label: 'Natureza - Lyra' }
];

export const copiesOf = (hero, stars) => hero.copies?.[stars] ?? 0;

//  Every (hero, stars) pair the bag holds at least one card of
export const bagEntries = (heroes) => heroes.flatMap((hero) => ALL_STARS
    .filter((stars) => copiesOf(hero, stars) >= 1)
    .map((stars) => ({ heroId: hero.id, heroName: hero.name, stars, copies: copiesOf(hero, stars) })));

//  Every (hero, stars) pair that can be fused, with whether the bag holds enough cards for it now
export const fusionRows = (heroes) => heroes.flatMap((hero) => FUSIBLE_STARS.map((stars) =>
{
    const copies = copiesOf(hero, stars);

    return { heroId: hero.id, heroName: hero.name, stars, copies, canFuse: copies >= FUSION_SIZE };
}));

//  The skill slots a hero with `stars` stars has unlocked: slot n opens at n stars
export const unlockedSlots = (stars) => [ 1, 2, 3 ].filter((slot) => stars >= slot);

//  A dropped card adds one copy and owns the hero; the list it came from is not changed
export const applyDrop = (heroes, { heroId, stars = 0 }) => heroes.map((hero) => (hero.id === heroId
    ? { ...hero, owned: true, stars: Math.max(hero.stars, stars), copies: { ...hero.copies, [stars]: copiesOf(hero, stars) + 1 } }
    : hero));

//  The name of a boss of the farm list
export const bossLabel = ({ kind, stage }) => (kind === 'MINIBOSS' ? `Miniboss ${stage}` : 'Chefe do capítulo');
