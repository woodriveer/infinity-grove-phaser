//  The short number format (spec campaign-chapters, Number Format): from 1 000 a value reads with K, M, B or T, one decimal, no trailing .0
const UNITS = [ [ 1e3, 'K' ], [ 1e6, 'M' ], [ 1e9, 'B' ], [ 1e12, 'T' ] ];

export const formatShort = (value) =>
{
    if (value < 1000)
    {
        return String(value);
    }

    let index = 0;

    while (index + 1 < UNITS.length && UNITS[index + 1][0] <= value)
    {
        index += 1;
    }

    let x = Math.round(value / UNITS[index][0] * 10) / 10;

    //  The rounding reached 1000 of this unit: the next unit reads it as 1
    if (x >= 1000 && index + 1 < UNITS.length)
    {
        index += 1;
        x = Math.round(value / UNITS[index][0] * 10) / 10;
    }

    return `${x}${UNITS[index][1]}`;
};
