//  The element table of the game. Pure JavaScript: no Phaser.
//  The triad fire > nature > water > fire hits for double and is hit for half; light and darkness hit each other for
//  90 %, hit the triad for 180 % and are hit by the triad for 90 %; an element against itself is neutral.
export const FIRE = 'FIRE';
export const WATER = 'WATER';
export const NATURE = 'NATURE';
export const LIGHT = 'LIGHT';
export const DARKNESS = 'DARKNESS';

export const ELEMENTS = [ FIRE, WATER, NATURE, LIGHT, DARKNESS ];

const STRONG = 2;
const WEAK = 0.5;
const NEUTRAL = 1;
const HOLY_DARK_VS_TRIAD = 1.8;
const REDUCED = 0.9;

//  What each triad element beats and loses to
const BEATS = { [FIRE]: NATURE, [NATURE]: WATER, [WATER]: FIRE };
const OPPOSED = [ LIGHT, DARKNESS ];

const requireElement = (element) =>
{
    if (!ELEMENTS.includes(element))
    {
        throw new Error(`Unknown element: ${element}`);
    }
};

//  How much of its damage `attacker` deals to `defender`
export const elementMultiplier = (attacker, defender) =>
{
    requireElement(attacker);
    requireElement(defender);

    if (attacker === defender)
    {
        return NEUTRAL;
    }

    const attackerOpposed = OPPOSED.includes(attacker);
    const defenderOpposed = OPPOSED.includes(defender);

    if (attackerOpposed && defenderOpposed)
    {
        return REDUCED;
    }

    if (attackerOpposed)
    {
        return HOLY_DARK_VS_TRIAD;
    }

    if (defenderOpposed)
    {
        return REDUCED;
    }

    return BEATS[attacker] === defender ? STRONG : WEAK;
};
