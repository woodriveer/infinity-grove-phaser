import { formatCopper } from './equipment';

//  The rules of the bulk sale of the bag: the selection, its totals and the Portuguese texts. Pure JavaScript: no Phaser, so every rule is unit-tested.
//  `ids` is always a Set of piece ids. Every function returns a new value and never mutates its arguments.

//  The five rarities in the order of the buttons
export const RARITY_ORDER = [ 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY' ];

//  The bag: the pieces no hero wears, in the order of the list
export const bagPieces = (pieces) => pieces.filter((piece) => !piece.heroId);

//  The copper the pieces of `ids` pay together (sum of sellPrice); pieces not in `ids` count nothing
export const sellTotal = (pieces, ids) => pieces.filter((piece) => ids.has(piece.id)).reduce((sum, piece) => sum + piece.sellPrice, 0);

//  A new Set with `id` added, or without it when it was there
export const toggleSelected = (ids, id) =>
{
    const next = new Set(ids);

    if (next.has(id))
    {
        next.delete(id);
    }
    else
    {
        next.add(id);
    }

    return next;
};

//  Whether the bag holds the rarity and whether every bag piece of it is selected
export const rarityState = (ids, bag, rarity) =>
{
    const ofRarity = bag.filter((piece) => piece.rarity === rarity);

    return {
        available: ofRarity.length > 0,
        allSelected: ofRarity.length > 0 && ofRarity.every((piece) => ids.has(piece.id))
    };
};

//  Selects every bag piece of `rarity`, or unselects them all when all were selected; the other ids stay
export const toggleRarity = (ids, bag, rarity) =>
{
    const { allSelected } = rarityState(ids, bag, rarity);
    const next = new Set(ids);

    bag.filter((piece) => piece.rarity === rarity).forEach((piece) =>
    {
        if (allSelected)
        {
            next.delete(piece.id);
        }
        else
        {
            next.add(piece.id);
        }
    });

    return next;
};

//  The selected ids that are still in the bag, in the order of the bag (the order of the request)
export const selectedInBag = (ids, pieces) => bagPieces(pieces).filter((piece) => ids.has(piece.id)).map((piece) => piece.id);

//  "Selecionadas: 3 · Total: 4 prata"
export const selectionSummary = (count, total) => `Selecionadas: ${count} · Total: ${formatCopper(total)}`;

//  "Vender 1 peça por 1 prata?" / "Vender 2 peças por 3 prata?"
export const sellQuestion = (count, total) => `Vender ${count} ${count === 1 ? 'peça' : 'peças'} por ${formatCopper(total)}?`;

//  "1 peça vendida por 1 prata" / "3 peças vendidas por 12 prata"
export const sellNotice = (sold, earned) => `${sold} ${sold === 1 ? 'peça vendida' : 'peças vendidas'} por ${formatCopper(earned)}`;
