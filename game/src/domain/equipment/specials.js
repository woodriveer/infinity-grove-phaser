//  The fixed effects a piece can carry outside its affixes (spec black-awareness-staff). Pure JavaScript: no Phaser.
//  A piece of the backend carries `special` (a key of SPECIALS) or no field; a key the game does not know is ignored (spec D13).
export const BLACK_AWARENESS_STAFF = 'BLACK_AWARENESS_STAFF';

export const SPECIALS = Object.freeze({
    [BLACK_AWARENESS_STAFF]: Object.freeze({
        name: 'Cajado da Consciência Negra',
        icon: 'staff_black_awares_day',
        darknessDamagePct: 200,
        line: 'Especial: +200% de dano contra Escuridão'
    })
});

//  The special of `piece`, or null for a piece with none or with one the game does not know
export const specialOf = (piece) => (piece?.special != null && Object.hasOwn(SPECIALS, piece.special) ? SPECIALS[piece.special] : null);

//  The notice of the gift and how long it shows (spec D9)
export const GIFT_NOTICE = 'Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!';
export const GIFT_NOTICE_MS = 6000;
